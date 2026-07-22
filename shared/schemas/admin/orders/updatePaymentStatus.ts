import z from "zod";

export const updatePaymentStatusSchema = z.strictObject({
	orderId: z
		.coerce
		.number("ID заказа обязательно должно быть")
		.int("ID заказа должно быть целым числом")
		.positive("ID заказа должно быть больше нуля"),

	paymentStatus: z
		.enum(
			["PENDING", "UPON_RECEIPT", "PAID", "CANCELLED"],
			"Статус оплаты необходим"
		)
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
