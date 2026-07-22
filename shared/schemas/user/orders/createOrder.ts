// server/schemas/createOrder.ts
import { z } from "zod";

const orderItemSchema = z.strictObject({
	productId: z.coerce
		.number("ID продукта необходим")
		.int("ID продукта должен быть целым числом")
		.positive("ID продукта должен быть больше нуля"),

	quantity: z.coerce
		.number("Количество товара необходимо")
		.int("Количество товара должно быть целым числом")
		.positive("Количество товара должно быть больше нуля")
});

const orderItemsSchema = z
	.array(orderItemSchema)
	.min(1, "Заказ должен содержать хотя бы один товар")
	.superRefine((items, ctx) => {
		const seen = new Set<number>();

		for (const [index, item] of items.entries()) {
			if (seen.has(item.productId)) {
				ctx.addIssue({
					code: "custom",
					path: [index, "productId"],
					message: "Товар дублируется в заказе"
				});
			}

			seen.add(item.productId);
		}
	});

const customerPhoneSchema = z
	.string("Телефон необходим")
	.trim()
	.min(5, "Телефон должен содержать не менее 5 символов")
	.max(30, "Телефон должен быть не длиннее 30 символов")
	.regex(/^\+?[0-9\s().-]+$/, "Введите корректный номер телефона");

const recipientSchema = z.strictObject({
	name: z
		.string("Имя получателя необходимо")
		.trim()
		.min(2, "Имя получателя должно содержать не менее 2 символов")
		.max(120, "Имя получателя должно быть не длиннее 120 символов"),

	phone: customerPhoneSchema
});

const deliveryDetailsSchema = z.strictObject({
	address: z
		.string("Адрес доставки необходим")
		.trim()
		.min(1, "Адрес доставки необходим")
		.max(500, "Адрес доставки должен быть не более 500 символов"),

	apartment: z.string().trim().max(50).optional(),
	entrance: z.string().trim().max(50).optional(),
	floor: z.string().trim().max(50).optional(),
	intercom: z.string().trim().max(50).optional(),
	comment: z.string().trim().max(1000).optional(),

	deliveryMethod: z.enum(["OZON"]).default("OZON")
});

export const createOrderSchema = z.discriminatedUnion("obtainingMethod", [
	z.strictObject({
		obtainingMethod: z.literal("PICKUP"),
		paymentMethod: z.enum(["OFFLINE", "ONLINE"], "Способ оплаты необходим"),
		customerPhone: customerPhoneSchema,
		recipient: recipientSchema.optional(),
		orderItems: orderItemsSchema,

		delivery: z.never("Данные доставки не нужны для самовывоза").optional()
	}),

	z.strictObject({
		obtainingMethod: z.literal("DELIVERY"),
		paymentMethod: z.literal("ONLINE", "При доставке доступна только онлайн-оплата"),
		customerPhone: customerPhoneSchema,
		recipient: recipientSchema.optional(),
		orderItems: orderItemsSchema,

		delivery: deliveryDetailsSchema
	})
]);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
