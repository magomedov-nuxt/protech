import z from "zod";
import { imagePathSchema } from "../../imagePath";

const reviewPhotoSchema = z.strictObject({
	url: imagePathSchema
});

export const createReviewSchema = z.strictObject({
	rating: z
		.coerce
		.number("Рейтинг товара необходим")
		.int("Рейтинг должен быть целым числом")
		.min(1, "Минимальное значение рейтинга - 1")
		.max(5, "Максимальное значение рейтинга - 5"),

	advantages: z
		.string()
		.trim()
		.max(500, "Максимальное количество символов преимуществ - 500")
		.optional(),

	disadvantages: z
		.string()
		.trim()
		.max(500, "Максимальное количество символов недостатков - 500")
		.optional(),

	comment: z
		.string()
		.trim()
		.max(500, "Максимальное количество символов коммента - 500")
		.optional(),

	reviewPhotos: z
		.array(reviewPhotoSchema)
		.max(10, "Максимальное количество фото - 10")
		.optional()
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
