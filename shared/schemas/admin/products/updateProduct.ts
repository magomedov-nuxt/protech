import type z from "zod";
import { createProductSchema } from "./createProduct";

export const updateProductSchema = createProductSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "Передайте хотя бы одно поле для обновления",
	});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
