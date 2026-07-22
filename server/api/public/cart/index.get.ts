export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: {
        cart: {
          userId
        }
      },
      select: {
        id: true,
        quantity: true,
        product: {
          select: {
            id: true,
            name: true,
            currentPrice: true,
            oldPrice: true,
            mainImage: true,
            isActive: true,
            productStocks: {
              select: {
                quantity: true
              }
            }
          }
        }
      }
    });

    return cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        currentPrice: item.product.currentPrice,
        oldPrice: item.product.oldPrice,
        mainImage: item.product.mainImage,
        isActive: item.product.isActive,
        stockQuantity: item.product.productStocks[0]?.quantity ?? 0
      }
    }));
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении товаров корзины"
    });
  }
});
