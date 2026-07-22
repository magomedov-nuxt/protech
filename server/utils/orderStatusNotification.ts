import {
  MessageSenderRole,
  MessageType,
  OrderStatus,
  type Message,
  type Prisma
} from "@prisma/client";
import { broadcastMessageToAdmins, broadcastMessageToUser } from "./messageRealtime";

type OrderStatusMessageClient = Pick<Prisma.TransactionClient, "message">;

type OrderStatusChangeMessageInput = {
  orderId: number;
  userId: string | null;
  previousStatus: OrderStatus;
  nextStatus: OrderStatus;
};

const orderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: "\u041d\u043e\u0432\u044b\u0439",
  [OrderStatus.CONFIRMED]: "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d",
  [OrderStatus.PROCESSING]: "\u0412 \u0440\u0430\u0431\u043e\u0442\u0435",
  [OrderStatus.SHIPPED]: "\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d",
  [OrderStatus.COMPLETED]: "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d",
  [OrderStatus.CANCELLED]: "\u041e\u0442\u043c\u0435\u043d\u0435\u043d"
};

function buildOrderStatusChangeText(orderId: number, nextStatus: OrderStatus) {
  return `\u0421\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u043a\u0430\u0437\u0430 \u2116${orderId} \u0438\u0437\u043c\u0435\u043d\u0435\u043d: ${orderStatusLabels[nextStatus]}.`;
}

export async function createOrderStatusChangeMessage(
  db: OrderStatusMessageClient,
  input: OrderStatusChangeMessageInput
) {
  if (!input.userId || input.previousStatus === input.nextStatus) {
    return null;
  }

  return await db.message.create({
    data: {
      userId: input.userId,
      messageType: MessageType.DELIVERY,
      senderRole: MessageSenderRole.SYSTEM,
      message: buildOrderStatusChangeText(input.orderId, input.nextStatus)
    }
  });
}

export function broadcastOrderStatusChangeMessage(message: Message | null) {
  if (!message) {
    return;
  }

  const payload = {
    type: "message.created" as const,
    message
  };

  broadcastMessageToAdmins(payload);
  broadcastMessageToUser(message.userId, payload);
}
