import z from "zod";

const stockArrivalSchema = z.strictObject({
  productId: z
    .coerce
    .number("ID товара необходим")
    .int("ID товара должен быть целым числом")
    .positive("ID товара должен быть больше нуля"),

  quantityDelta: z
    .coerce
    .number("Количество прихода необходимо")
    .int("Количество должно быть целым числом")
    .positive("Количество прихода должно быть больше нуля")
});

export const bulkStockArrivalSchema = z.strictObject({
  arrivals: z
    .array(stockArrivalSchema)
    .min(1, "Добавьте хотя бы один товар")
    .refine(
      (arrivals) => new Set(arrivals.map((arrival) => arrival.productId)).size === arrivals.length,
      "Товары не должны повторяться"
    ),

  reason: z
    .string()
    .trim()
    .max(255, "Комментарий должен быть не более 255 символов")
    .optional()
});

export type BulkStockArrivalInput = z.infer<typeof bulkStockArrivalSchema>;
