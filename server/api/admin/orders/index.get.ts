import { OrderStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const orderStatuses = new Set<string>(Object.values(OrderStatus));

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const page = getPageQueryParam(query.page);
  const status = query.status ? String(query.status) : undefined;
  const limit = 20;

  if (status && !orderStatuses.has(status)) {
    throw createError({
      statusCode: 400,
      message: "Некорректный статус заказа"
    });
  }

  const where: Prisma.OrderWhereInput = status
    ? { orderStatus: status as Prisma.EnumOrderStatusFilter["equals"] }
    : {};

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderStatus: true,
        paymentMethod: true,
        obtainingMethod: true,
        customerPhone: true,
        recipientName: true,
        recipientPhone: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
        payment: { select: { amount: true, paymentStatus: true } },
        delivery: {
          select: {
            address: true,
            apartment: true,
            entrance: true,
            floor: true,
            intercom: true,
            comment: true,
            deliveryMethod: true,
          },
        },
        orderItems: {
          select: {
            quantity: true,
            price: true,
            product: { select: { id: true, name: true, mainImage: true } }
          }
        }
      }
    }),
    prisma.order.count({ where })
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
});
