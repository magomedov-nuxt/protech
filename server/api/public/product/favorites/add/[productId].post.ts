export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  try {
    await prisma.favoriteProduct.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId
        }
      },
      create: {
        userId: user.id,
        productId
      },
      update: {}
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2003: { statusCode: 404, message: "Товар не найден" }
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при добавлении товара в избранное"
    });
  }
});
