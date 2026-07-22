import z from "zod";

export const reviewAnswerSchema = z.strictObject({
	text: z
		.string("Текст ответа необходим")
		.trim()
		.min(1, "Текст ответа необходим")
		.max(1000, "Текст ответа должен быть не более 1000 символов")
})

export type ReviewAnswerInput = z.infer<typeof reviewAnswerSchema>
