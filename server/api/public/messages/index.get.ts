import { MessageSenderRole } from "@prisma/client";
import { broadcastMessageToAdmins, broadcastMessageToUser } from "~~/server/utils/messageRealtime";
import { publicMessageSelect } from "~~/server/utils/messageDto";

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const query = getQuery(event);
  const limit = getBoundedPositiveIntQueryParam(query.limit, 200, 500);

  const unreadIncoming = await prisma.message.findMany({
    where: {
      userId,
      readAt: null,
      senderRole: {
        in: [MessageSenderRole.ADMIN, MessageSenderRole.SYSTEM]
      }
    },
    select: {
      id: true
    },
    take: 500
  });

  if (unreadIncoming.length) {
    const messageIds = unreadIncoming.map((message) => message.id);

    await prisma.message.updateMany({
      where: {
        userId,
        readAt: null,
        senderRole: {
          in: [MessageSenderRole.ADMIN, MessageSenderRole.SYSTEM]
        }
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
  }

  const fetchedMessages = await prisma.message.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    },
    select: publicMessageSelect,
    take: limit + 1
  });
  const messages = fetchedMessages.slice(0, limit).reverse();

  return {
    messages,
    pagination: {
      limit,
      hasMore: fetchedMessages.length > limit
    }
  };
});
