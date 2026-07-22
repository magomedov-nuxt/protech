import { MessageSenderRole } from "@prisma/client";
import z from "zod";
import { broadcastMessageToAdmins, broadcastMessageToUser } from "~~/server/utils/messageRealtime";

const markMessagesReadSchema = z.strictObject({
  messageIds: z.array(z.number().int().positive()).optional()
});

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const body = await validateBody(event, markMessagesReadSchema);

  const unreadIncoming = await prisma.message.findMany({
    where: {
      userId,
      readAt: null,
      senderRole: {
        in: [MessageSenderRole.ADMIN, MessageSenderRole.SYSTEM]
      },
      ...(body.messageIds?.length ? { id: { in: body.messageIds } } : {})
    },
    select: {
      id: true
    }
  });

  if (!unreadIncoming.length) {
    return { messageIds: [] };
  }

  const messageIds = unreadIncoming.map((message) => message.id);

  await prisma.message.updateMany({
    where: {
      id: { in: messageIds }
    },
    data: {
      readAt: new Date()
    }
  });

  const adminEventPayload = {
    type: "message.read" as const,
    messageIds,
    userId
  };
  const userEventPayload = {
    type: "message.read" as const,
    messageIds
  };

  broadcastMessageToUser(userId, userEventPayload);
  broadcastMessageToAdmins(adminEventPayload);

  return { messageIds };
});
