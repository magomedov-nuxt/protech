import { MessageSenderRole, MessageType } from "@prisma/client";
import { sendMessageSchema } from "~~/shared/schemas/messages/message";
import { broadcastMessageToAdmins, broadcastMessageToUser } from "~~/server/utils/messageRealtime";
import { adminMessageSelect, toPublicMessageDto } from "~~/server/utils/messageDto";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const userId = getRouterParam(event, "userId");

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID пользователя"
    });
  }

  const body = await validateBody(event, sendMessageSchema);
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true
    }
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      message: "Пользователь не найден"
    });
  }

  const message = await prisma.message.create({
    data: {
      userId,
      messageType: MessageType.SUPPORT,
      senderRole: MessageSenderRole.ADMIN,
      message: body.message
    },
    select: adminMessageSelect
  });

  const payload = {
    type: "message.created" as const,
    message
  };

  broadcastMessageToAdmins(payload);
  broadcastMessageToUser(userId, {
    type: "message.created",
    message: toPublicMessageDto(message)
  });

  return { message };
});
