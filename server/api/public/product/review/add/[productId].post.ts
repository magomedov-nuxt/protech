import { createReviewSchema } from "~~/shared/schemas/user/reviews/createReview";

export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");
  const body = await validateBody(event, createReviewSchema);

  try {
    await prisma.review.create({
      data: {
        userId: user.id,
        productId,
        rating: body.rating,
        advantages: body.advantages,
        disadvantages: body.disadvantages,
        comment: body.comment,
        isAnswered: false,

        ...(body.reviewPhotos?.length
          ? {
            reviewPhotos: {
              create: body.reviewPhotos.map((photo) => ({
                url: photo.url
              }))
            }
          }
          : {})
      }
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2002: "Вы уже оставили отзыв на этот товар",
      P2003: { statusCode: 404, message: "Товар не найден" }
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при оставлении отзыва"
    });
  }
});
