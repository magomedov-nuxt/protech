import z from "zod";

export const updateProductStockSchema = z.strictObject({
	quantity: z
		.coerce
		.number("Количество товара необходимо")
		.int("Количество товара должно быть целым числом")
		.nonnegative("Количество товара не может быть отрицательным")
		.default(0)
});

export type UpdateProductStockInput = z.infer<typeof updateProductStockSchema>;
