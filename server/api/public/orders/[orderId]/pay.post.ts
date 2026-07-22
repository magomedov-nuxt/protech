import {
  PaymentMethod,
  PaymentStatus
} from "@prisma/client";
import { expireUnpaidOrders, getOrderPaymentExpiresAt, getOrderPaymentRemainingSeconds } from "~~/server/utils/orderExpiry";
import { createYooKassaPayment } from "~~/server/utils/yookassa";
import { syncYooKassaPaymentStatus } from "~~/server/utils/yookassaPaymentStatus";

async function getOrder(orderId: number, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId
    },
    include: {
      payment: true
    }
  });
}

type OrderWithPayment = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
type PayableOrder = OrderWithPayment & {
  payment: NonNullable<OrderWithPayment["payment"]>;
};

function assertPayableOrder(order: Awaited<ReturnType<typeof getOrder>>): PayableOrder {
  if (!order) {
    throw createError({
      statusCode: 404,
      message: "Заказ не найден"
    });
  }

  if (order.paymentMethod !== PaymentMethod.ONLINE) {
    throw createError({
      statusCode: 400,
      message: "Для этого заказа выбрана оплата при получении"
    });
  }

  if (order.orderStatus === "CANCELLED" || order.payment?.paymentStatus === PaymentStatus.CANCELLED) {
    throw createError({
      statusCode: 410,
      message: "Заказ отменён, ссылка на оплату больше недоступна"
    });
  }

  if (order.payment?.paymentStatus === PaymentStatus.PAID) {
    throw createError({
      statusCode: 409,
      message: "Заказ уже оплачен"
    });
  }

  if (order.payment?.paymentStatus !== PaymentStatus.PENDING) {
    throw createError({
      statusCode: 400,
      message: "Заказ сейчас не ожидает оплату"
    });
  }

  return order as PayableOrder;
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const orderId = getPositiveIntRouterParam(event, "orderId", "Некорректный ID заказа");
  const now = new Date();

  let order = assertPayableOrder(await getOrder(orderId, userId));
  let remainingSeconds = getOrderPaymentRemainingSeconds(order.createdAt, now);

  if (remainingSeconds <= 0) {
    await expireUnpaidOrders({ now });
    throw createError({
      statusCode: 410,
      message: "Время оплаты истекло, заказ отменён"
    });
  }

  if (order.payment.transactionId) {
    let shouldReloadOrder = false;

    try {
      const syncResult = await syncYooKassaPaymentStatus(event, order.payment.transactionId);

      shouldReloadOrder = syncResult.processed || Boolean(syncResult.alreadyProcessed);
    } catch (error) {
      console.error("Failed to sync YooKassa payment status before resume", error);
    }

    if (shouldReloadOrder) {
      order = assertPayableOrder(await getOrder(orderId, userId));
      remainingSeconds = getOrderPaymentRemainingSeconds(order.createdAt, new Date());

      if (remainingSeconds <= 0) {
        await expireUnpaidOrders({ now: new Date() });
        throw createError({
          statusCode: 410,
          message: "Время оплаты истекло, заказ отменён"
        });
      }
    }
  }

  let confirmationUrl = order.payment.confirmationUrl;

  if (!confirmationUrl) {
    const yookassaPayment = await createYooKassaPayment(event, {
      orderId: order.id,
      amount: order.payment.amount,
      description: `Заказ №${order.id}`
    });

    confirmationUrl = yookassaPayment.confirmation?.confirmation_url ?? null;

    if (!confirmationUrl) {
      throw createError({
        statusCode: 502,
        message: "ЮKassa не вернула ссылку на оплату"
      });
    }

    await prisma.payment.update({
      where: {
        orderId: order.id
      },
      data: {
        transactionId: yookassaPayment.id,
        confirmationUrl
      }
    });
  }

  return {
    confirmationUrl,
    paymentExpiresAt: getOrderPaymentExpiresAt(order.createdAt),
    paymentRemainingSeconds: remainingSeconds
  };
});
