import { z } from "zod";
import { getYooKassaPayment } from "~~/server/utils/yookassa";
import { applyYooKassaPaymentStatus } from "~~/server/utils/yookassaPaymentStatus";

const yookassaWebhookSchema = z
  .object({
    type: z.literal("notification"),
    event: z.enum([
      "payment.succeeded",
      "payment.canceled",
      "payment.waiting_for_capture"
    ]),
    object: z
      .object({
        id: z.string().min(1),
        status: z.enum([
          "pending",
          "waiting_for_capture",
          "succeeded",
          "canceled"
        ]),
        paid: z.boolean().optional(),
        metadata: z.record(z.string(), z.string()).optional()
      })
      .passthrough()
  })
  .passthrough();

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, yookassaWebhookSchema);
  const payment = await getYooKassaPayment(event, body.object.id);

  return applyYooKassaPaymentStatus(payment);
});
