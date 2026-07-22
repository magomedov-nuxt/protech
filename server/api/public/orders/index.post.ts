import {
  OrderStatus,
  PaymentStatus,
  Prisma
} from "@prisma/client";
import { reserveProductStock, restoreOrderStock } from "~~/server/utils/orderStock";
import { createYooKassaPayment } from "~~/server/utils/yookassa";
import { createOrderSchema } from "~~/shared/schemas/user/orders/createOrder";

export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const body = await validateBody(event, createOrderSchema);

  const orderId = await prisma.$transaction(async (tx) => {
    const productIds = body.orderItems.map((item) => item.productId);

    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        id: true,
        name: true,
        article: true,
        mainImage: true,
        currentPrice: true,
        costPrice: true,
        isActive: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        productStocks: {
          select: { quantity: true }
        }
      }
    });

    if (products.length !== productIds.length) {
      throw createError({
        statusCode: 400,
        message: "Один или несколько товаров не найдены"
      });
    }

    for (const product of products) {
      if (!product.isActive) {
        throw createError({
          statusCode: 400,
          message: `Товар с ID ${product.id} недоступен для заказа`
        });
      }
    }

    for (const item of body.orderItems) {
      const product = products.find((candidate) => candidate.id === item.productId);
      const stock = product?.productStocks[0]?.quantity ?? 0;

      if (stock < item.quantity) {
        throw createError({
          statusCode: 400,
          message: `Недостаточно товара с ID ${item.productId} на складе`
        });
      }
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const priceByProductId = new Map<number, Prisma.Decimal>(
      products.map((product) => [
        product.id,
        new Prisma.Decimal(product.currentPrice)
      ])
    );

    const getProductPrice = (productId: number): Prisma.Decimal => {
      const price = priceByProductId.get(productId);

      if (!price) {
        throw createError({
          statusCode: 400,
          message: `Товар с ID ${productId} не найден`
        });
      }

      return price;
    };

    const totalAmount = body.orderItems.reduce<Prisma.Decimal>((sum, item) => {
      const price = getProductPrice(item.productId);

      return sum.add(price.mul(item.quantity));
    }, new Prisma.Decimal(0));

    if (totalAmount.lte(0)) {
      throw createError({
        statusCode: 400,
        message: "Сумма заказа должна быть больше нуля"
      });
    }

    const createdOrder = await tx.order.create({
      data: {
        userId: user.id,
        obtainingMethod: body.obtainingMethod,
        paymentMethod: body.paymentMethod,
        customerPhone: body.customerPhone,
        recipientName: body.recipient?.name,
        recipientPhone: body.recipient?.phone,
        stockReserved: true,

        orderStatus:
          body.paymentMethod === "ONLINE"
            ? OrderStatus.NEW
            : OrderStatus.CONFIRMED
      }
    });

    await tx.orderItem.createMany({
      data: body.orderItems.map((item) => {
        const product = productById.get(item.productId)!;
        const price = priceByProductId.get(item.productId)!;

        return {
          orderId: createdOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price,
          costPrice: product.costPrice,
          lineTotal: price.mul(item.quantity),
          productName: product.name,
          productArticle: product.article,
          productMainImage: product.mainImage,
          categoryId: product.category.id,
          categoryName: product.category.name
        };
      })
    });

    if (body.obtainingMethod === "DELIVERY") {
      await tx.delivery.create({
        data: {
          orderId: createdOrder.id,
          address: body.delivery.address,
          apartment: body.delivery.apartment,
          entrance: body.delivery.entrance,
          floor: body.delivery.floor,
          intercom: body.delivery.intercom,
          comment: body.delivery.comment,
          deliveryMethod: body.delivery.deliveryMethod
        }
      });
    }

    await tx.payment.create({
      data: {
        orderId: createdOrder.id,
        paymentStatus:
          body.paymentMethod === "ONLINE"
            ? PaymentStatus.PENDING
            : PaymentStatus.UPON_RECEIPT,

        amount: totalAmount
      }
    });

    await reserveProductStock(tx, body.orderItems, {
      orderId: createdOrder.id,
      reason: "Order created"
    });

    return createdOrder.id;
  }).catch((error) => {
    const prismaError = toPrismaHttpError(error, {
      P2003: "Один или несколько товаров не найдены"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw error;
  });

  const order = await prisma.order.findUniqueOrThrow({
    where: {
      id: orderId
    },
    select: {
      id: true,
      payment: {
        select: {
          amount: true
        }
      }
    }
  });

  if (body.paymentMethod === "OFFLINE") {
    return {
      order: {
        id: order.id
      },
      payment: {
        type: "offline",
        confirmationUrl: null
      }
    };
  }

  const yookassaPayment = await createYooKassaPayment(event, {
    orderId: order.id,
    amount: order.payment!.amount,
    description: `Заказ №${order.id}`
  }).catch(async (error) => {
    await prisma.$transaction(async (tx) => {
      await restoreOrderStock(tx, order.id, "YooKassa payment creation failed");

      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          paymentStatus: PaymentStatus.CANCELLED,
          paidAt: null
        }
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          stockReserved: false
        }
      });
    });

    throw error;
  });

  await prisma.payment.update({
    where: {
      orderId: order.id
    },
    data: {
      transactionId: yookassaPayment.id,
      confirmationUrl: yookassaPayment.confirmation?.confirmation_url ?? null
    }
  });

  return {
    order: {
      id: order.id
    },
    payment: {
      type: "yookassa",
      status: yookassaPayment.status,
      confirmationUrl: yookassaPayment.confirmation?.confirmation_url ?? null
    }
  };
});
