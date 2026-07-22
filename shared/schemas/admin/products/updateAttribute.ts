import type z from "zod";
import { createAttributeSchema } from "./createAttribute";

export const updateAttributeSchema = createAttributeSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "Передайте хотя бы одно поле для обновления",
	});

export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>;
