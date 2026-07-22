import type z from "zod";
import { createShopQuestionSchema } from "./createShopQuestion";

export const updateShopQuestionSchema = createShopQuestionSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "Передайте хотя бы одно поле для обновления",
	});

export type UpdateShopQuestionInput = z.infer<typeof updateShopQuestionSchema>;
