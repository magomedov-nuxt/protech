import { AuditAction, type Prisma } from "@prisma/client";
import { updateReviewSchema } from "~~/shared/schemas/user/reviews/updateReview";
import { deleteStoredImages, getRemovedImageUrls } from "../../../../utils/uploadImage";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const reviewId = getPositiveIntRouterParam(event, "reviewId", "Некорректный ID отзыва");
  const body = await validateBody(event, updateReviewSchema);
  const data: Prisma.ReviewUpdateInput = {};

  if (body.rating !== undefined) data.rating = body.rating;
  if (body.advantages !== undefined) data.advantages = body.advantages;
  if (body.disadvantages !== undefined) data.disadvantages = body.disadvantages;
  if (body.comment !== undefined) data.comment = body.comment;

  const existingPhotos = body.reviewPhotos !== undefined
    ? await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        reviewPhotos: { select: { url: true } }
      }
    })
    : null;

  data.isAnswered = false;

  if (body.reviewPhotos !== undefined) {
    data.reviewPhotos = {
      deleteMany: {},
      ...(body.reviewPhotos.length
        ? {
          create: body.reviewPhotos.map((photo) => ({
            url: photo.url
          }))
        }
        : {})
    };
  }

  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data,
      select: {
        id: true
      }
    });

    if (existingPhotos) {
      const oldUrls = existingPhotos.reviewPhotos.map((photo) => photo.url);
      const newUrls = (body.reviewPhotos ?? []).map((photo) => photo.url);

      await deleteStoredImages(getRemovedImageUrls(oldUrls, newUrls));
    }

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.UPDATE,
      entityType: "review",
      entityId: review.id,
      summary: `Updated review ${review.id}`,
      metadata: {
        fields: Object.keys(body)
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
      message: "Ошибка сервера при обновлении отзыва"
    });
  }
});
