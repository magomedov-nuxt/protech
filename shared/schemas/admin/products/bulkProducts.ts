import z from "zod";

const productIdsSchema = z
  .array(z.coerce.number().int().positive())
  .min(1, "Выберите хотя бы один товар")
  .transform((ids) => [...new Set(ids)]);

export const bulkProductsSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("activate"),
    productIds: productIdsSchema
  }),
  z.strictObject({
    action: z.literal("deactivate"),
    productIds: productIdsSchema
  }),
  z.strictObject({
    action: z.literal("delete"),
    productIds: productIdsSchema
  }),
  z.strictObject({
    action: z.literal("changeCategory"),
    productIds: productIdsSchema,
    categoryId: z.coerce.number().int().positive("Выберите категорию")
  })
]);

export type BulkProductsInput = z.infer<typeof bulkProductsSchema>;
