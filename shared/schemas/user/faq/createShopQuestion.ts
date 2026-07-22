import z from "zod";
import { imagePathSchema } from "../../imagePath";

const shopQuestionImageSchema = z.strictObject({
	url: imagePathSchema
});

export const createShopQuestionSchema = z.strictObject({
	title: z
		.string("Заголовок необходим")
		.trim()
		.min(1, "Заголовок необходим")
		.max(255, "Заголовок должен быть не более 255 символов"),

	comment: z
		.string("Комментарий необходим")
		.trim()
		.min(1, "Комментарий необходим")
		.max(1000, "Комментарий должен быть не более 1000 символов"),

	shopQuestionImages: z
		.array(shopQuestionImageSchema)
		.max(10, "Максимальное количество фото - 10")
		.optional()
});

export type CreateShopQuestionInput = z.infer<typeof createShopQuestionSchema>;
