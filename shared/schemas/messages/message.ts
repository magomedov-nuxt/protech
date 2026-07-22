import { z } from "zod";

export const sendMessageSchema = z.strictObject({
  message: z
    .string("Сообщение необходимо")
    .trim()
    .min(1, "Введите сообщение")
    .max(2000, "Сообщение должно быть не длиннее 2000 символов")
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
