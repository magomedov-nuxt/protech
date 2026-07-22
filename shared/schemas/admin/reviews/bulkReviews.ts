import z from "zod";

export const bulkReviewsSchema = z.strictObject({
  action: z.enum(["delete", "markAnswered", "markUnanswered"]),
  reviewIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Выберите хотя бы один отзыв")
    .transform((ids) => [...new Set(ids)])
});

export type BulkReviewsInput = z.infer<typeof bulkReviewsSchema>;
