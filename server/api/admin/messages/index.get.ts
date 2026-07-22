import type { MessageSenderRole, Role } from "@prisma/client";

type ConversationRow = {
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  lastMessageId: number;
  lastSenderRole: MessageSenderRole;
  lastMessageText: string;
  lastReadAt: Date | null;
  lastCreatedAt: Date;
  unreadCount: number | bigint;
  totalMessages: number | bigint;
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const query = getQuery(event);
  const limit = getBoundedPositiveIntQueryParam(query.limit, 100, 200);

  const rows = await prisma.$queryRaw<ConversationRow[]>`
    WITH last_messages AS (
      SELECT DISTINCT ON (m."user_id")
        m."id",
        m."user_id",
        m."sender_role",
        m."message",
        m."read_at",
        m."createdAt"
      FROM "message" m
      ORDER BY m."user_id", m."createdAt" DESC
    ),
    message_counts AS (
      SELECT m."user_id", COUNT(*)::int AS "totalMessages"
      FROM "message" m
      GROUP BY m."user_id"
    ),
    unread_counts AS (
      SELECT m."user_id", COUNT(*)::int AS "unreadCount"
      FROM "message" m
      WHERE m."sender_role" = 'USER' AND m."read_at" IS NULL
      GROUP BY m."user_id"
    )
    SELECT
      u."id" AS "userId",
      u."email",
      u."name",
      u."image",
      u."role",
      lm."id" AS "lastMessageId",
      lm."sender_role" AS "lastSenderRole",
      lm."message" AS "lastMessageText",
      lm."read_at" AS "lastReadAt",
      lm."createdAt" AS "lastCreatedAt",
      COALESCE(uc."unreadCount", 0)::int AS "unreadCount",
      COALESCE(mc."totalMessages", 0)::int AS "totalMessages"
    FROM last_messages lm
    JOIN "user" u ON u."id" = lm."user_id"
    LEFT JOIN message_counts mc ON mc."user_id" = u."id"
    LEFT JOIN unread_counts uc ON uc."user_id" = u."id"
    ORDER BY lm."createdAt" DESC, LOWER(COALESCE(u."name", u."email")) ASC
    LIMIT ${limit + 1}
  `;
  const conversations = rows.slice(0, limit).map((row) => ({
    user: {
      id: row.userId,
      email: row.email,
      name: row.name,
      image: row.image,
      role: row.role
    },
    lastMessage: {
      id: row.lastMessageId,
      userId: row.userId,
      senderRole: row.lastSenderRole,
      message: row.lastMessageText,
      readAt: row.lastReadAt,
      createdAt: row.lastCreatedAt
    },
    unreadCount: Number(row.unreadCount),
    totalMessages: Number(row.totalMessages)
  }));

  return {
    conversations,
    pagination: {
      limit,
      hasMore: rows.length > limit
    }
  };
});
