import z from "zod";

export const categorySchema = z.strictObject({
	name: z
		.string('Название категории необходимо')
		.trim()
		.max(50, 'Название категории не более 50 символов')
		.min(1, "Название категории необходимо")
})

export type CategoryInput = z.infer<typeof categorySchema>
