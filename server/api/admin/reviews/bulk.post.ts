import { AuditAction } from "@prisma/client";
import { bulkReviewsSchema } from "~~/shared/schemas/admin/reviews/bulkReviews";
import { deleteStoredImages } from "../../../utils/uploadImage";

const reviewBulkSummary: Record<string, string> = {
  delete: "Bulk deleted reviews",
  markAnswered: "Bulk marked reviews as answered",
  markUnanswered: "Bulk marked reviews as unanswered"
};

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);
  const body = await validateBody(event, bulkReviewsSchema);

  if (body.action === "delete") {
    const reviews = await prisma.review.findMany({
      where: { id: { in: body.reviewIds } },
      select: {
        reviewPhotos: { select: { url: true } }
      }
    });

    await deleteStoredImages(
      reviews.flatMap((review) => review.reviewPhotos.map((photo) => photo.url))
    );
  }

  const result = body.action === "delete"
    ? await prisma.review.deleteMany({
      where: { id: { in: body.reviewIds } }
    })
    : await prisma.review.updateMany({
      where: { id: { in: body.reviewIds } },
      data: { isAnswered: body.action === "markAnswered" }
    });

  await recordAdminAudit({
    adminId: userId,
    action: body.action === "delete" ? AuditAction.BULK_DELETE : AuditAction.BULK_UPDATE,
    entityType: "review",
    summary: reviewBulkSummary[body.action] ?? "Bulk review operation",
    metadata: {
      reviewIds: body.reviewIds,
      action: body.action,
      affected: result.count
    }
  });

  return { success: true, count: result.count };
});
