import z from "zod";

export const bulkFaqSchema = z.strictObject({
  action: z.enum(["delete", "markAnswered", "markUnanswered"]),
  shopQuestionIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Выберите хотя бы один вопрос")
    .transform((ids) => [...new Set(ids)])
});

export type BulkFaqInput = z.infer<typeof bulkFaqSchema>;
