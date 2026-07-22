import { MessageSenderRole, MessageType } from "@prisma/client";
import { sendMessageSchema } from "~~/shared/schemas/messages/message";
import { broadcastMessageToAdmins, broadcastMessageToUser } from "~~/server/utils/messageRealtime";
import { adminMessageSelect, toPublicMessageDto } from "~~/server/utils/messageDto";

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const body = await validateBody(event, sendMessageSchema);

  const message = await prisma.message.create({
    data: {
      userId,
      messageType: MessageType.SUPPORT,
      senderRole: MessageSenderRole.USER,
      message: body.message
    },
    select: adminMessageSelect
  });

  const publicPayload = {
    type: "message.created" as const,
    message: toPublicMessageDto(message)
  };
  const adminPayload = {
    type: "message.created" as const,
    message
  };

  broadcastMessageToUser(userId, publicPayload);
  broadcastMessageToAdmins(adminPayload);

  return { message: publicPayload.message };
});
