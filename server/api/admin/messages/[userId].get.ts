import { MessageSenderRole } from "@prisma/client";
import { broadcastMessageToAdmins, broadcastMessageToUser } from "~~/server/utils/messageRealtime";
import { adminMessageSelect } from "~~/server/utils/messageDto";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const userId = getRouterParam(event, "userId");
  const query = getQuery(event);
  const limit = getBoundedPositiveIntQueryParam(query.limit, 200, 500);

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID пользователя"
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true
    }
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      message: "Пользователь не найден"
    });
  }

  const unreadIncoming = await prisma.message.findMany({
    where: {
      userId,
      senderRole: MessageSenderRole.USER,
      readAt: null
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
        senderRole: MessageSenderRole.USER,
        readAt: null
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

    broadcastMessageToAdmins(adminEventPayload);
    broadcastMessageToUser(userId, userEventPayload);
  }

  const fetchedMessages = await prisma.message.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    },
    select: adminMessageSelect,
    take: limit + 1
  });
  const messages = fetchedMessages.slice(0, limit).reverse();

  return {
    user,
    messages,
    pagination: {
      limit,
      hasMore: fetchedMessages.length > limit
    }
  };
});
