export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  try {
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: user.id
        },
        productId
      }
    });

    return { success: true };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении товара из корзины"
    });
  }
});
