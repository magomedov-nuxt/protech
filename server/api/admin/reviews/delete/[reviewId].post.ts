import { AuditAction } from "@prisma/client";
import { deleteStoredImages } from "../../../../utils/uploadImage";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const reviewId = getPositiveIntRouterParam(event, "reviewId", "Некорректный ID отзыва");

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        productId: true,
        userId: true,
        reviewPhotos: { select: { url: true } }
      }
    });

    if (!review) {
      throw createError({
        statusCode: 404,
        message: "Отзыв не найден"
      });
    }

    await prisma.review.delete({
      where: { id: reviewId }
    });

    await deleteStoredImages(review.reviewPhotos.map((photo) => photo.url));

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.DELETE,
      entityType: "review",
      entityId: reviewId,
      summary: `Deleted review ${reviewId}`,
      metadata: {
        productId: review?.productId,
        userId: review?.userId
      }
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Отзыв не найден"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении отзыва"
    });
  }
});
