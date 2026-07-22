import { MessageSenderRole } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);

  const unreadMessages = await prisma.message.findMany({
    where: {
      userId,
      readAt: null,
      senderRole: {
        in: [MessageSenderRole.ADMIN, MessageSenderRole.SYSTEM]
      }
    },
    select: {
      id: true
    }
  });

  const unreadMessageIds = unreadMessages.map((message) => message.id);

  return {
    unreadCount: unreadMessageIds.length,
    unreadMessageIds
  };
});
