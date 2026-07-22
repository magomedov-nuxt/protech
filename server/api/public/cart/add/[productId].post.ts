export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: productId,
          isActive: true
        },
        select: {
          id: true,
          productStocks: {
            select: {
              quantity: true
            }
          }
        }
      });

      if (!product) {
        throw createError({
          statusCode: 404,
          message: "Товар не найден"
        });
      }

      const cart = await tx.cart.upsert({
        where: {
          userId: user.id
        },
        create: {
          userId: user.id
        },
        update: {},
        select: {
          id: true
        }
      });

      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        },
        select: {
          quantity: true
        }
      });

      const stockQuantity = product.productStocks[0]?.quantity ?? 0;
      const nextQuantity = (existingCartItem?.quantity ?? 0) + 1;
      const maxAllowedQuantity = Math.min(stockQuantity, 99);

      if (stockQuantity <= 0) {
        throw createError({
          statusCode: 409,
          message: "Товара нет в наличии"
        });
      }

      if (nextQuantity > maxAllowedQuantity) {
        throw createError({
          statusCode: 409,
          message: `На складе доступно только ${maxAllowedQuantity} шт.`
        });
      }

      await tx.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        },
        create: {
          cartId: cart.id,
          productId,
          quantity: 1
        },
        update: {
          quantity: {
            increment: 1
          }
        }
      });
    });

    return {
      success: true
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при добавлении товара в корзину"
    });
  }
});
