import { addCartItemSchema } from "~~/shared/schemas/user/carts/addCartItem";

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");
  const { quantity } = await validateBody(event, addCartItemSchema);

  try {
    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: {
          userId
        },
        select: {
          id: true
        }
      });

      if (!cart) {
        throw createError({
          statusCode: 404,
          message: "Корзина не найдена"
        });
      }

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

      const stockQuantity = product.productStocks[0]?.quantity ?? 0;

      if (quantity > stockQuantity) {
        throw createError({
          statusCode: 409,
          message: stockQuantity > 0
            ? `На складе доступно только ${stockQuantity} шт.`
            : "Товара нет в наличии"
        });
      }

      await tx.cartItem.update({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        },
        data: {
          quantity
        }
      });
    });

    return {
      success: true
    };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Товар не найден в корзине"
    });

    if (prismaError) {
      throw prismaError;
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при обновлении товара в корзине"
    });
  }
});
