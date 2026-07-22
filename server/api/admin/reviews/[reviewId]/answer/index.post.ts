import { AuditAction } from "@prisma/client";
import { reviewAnswerSchema } from "~~/shared/schemas/admin/reviews/reviewAnswer";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const reviewId = getPositiveIntRouterParam(event, "reviewId", "Некорректный ID отзыва");
  const body = await validateBody(event, reviewAnswerSchema);

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      productId: true
    }
  });

  if (!review) {
    throw createError({
      statusCode: 404,
      message: "Отзыв не найден"
    });
  }

  const answer = await prisma.$transaction(async (tx) => {
    const answer = await tx.reviewAnswer.create({
      data: {
        reviewId,
        text: body.text,
        userId
      },
      select: {
        id: true
      }
    });

    await tx.review.update({
      where: { id: reviewId },
      data: { isAnswered: true }
    });

    return answer;
  }).catch((error) => {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Отзыв не найден",
      P2003: { statusCode: 404, message: "Отзыв не найден" }
    });

    if (prismaError) {
      throw prismaError;
    }

    throw error;
  });

  await recordAdminAudit({
    adminId: userId,
    action: AuditAction.ANSWER,
    entityType: "review",
    entityId: reviewId,
    summary: `Answered review ${reviewId}`,
    metadata: {
      answerId: answer.id,
      productId: review.productId
    }
  });

  return { success: true };
});
