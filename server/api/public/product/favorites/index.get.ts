export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);

  try {
    const favorites = await prisma.favoriteProduct.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        product: {
          select: {
            id: true,
            name: true,
            currentPrice: true,
            oldPrice: true,
            mainImage: true,
            productStocks: {
              select: {
                quantity: true
              }
            }
          }
        }
      }
    });

    return favorites.map((favorite) => ({
      id: favorite.id,
      product: {
        id: favorite.product.id,
        name: favorite.product.name,
        currentPrice: favorite.product.currentPrice,
        oldPrice: favorite.product.oldPrice,
        mainImage: favorite.product.mainImage,
        stockQuantity: favorite.product.productStocks[0]?.quantity ?? 0
      }
    }));
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении избранных товаров"
    });
  }
});
