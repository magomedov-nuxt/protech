import type { Prisma } from "@prisma/client";

export const publicMessageSelect = {
  id: true,
  senderRole: true,
  message: true,
  readAt: true,
  createdAt: true
} satisfies Prisma.MessageSelect;

export const adminMessageSelect = {
  ...publicMessageSelect,
  userId: true
} satisfies Prisma.MessageSelect;

export type AdminMessageRecord = Prisma.MessageGetPayload<{
  select: typeof adminMessageSelect;
}>;

export function toPublicMessageDto(message: AdminMessageRecord) {
  return {
    id: message.id,
    senderRole: message.senderRole,
    message: message.message,
    readAt: message.readAt,
    createdAt: message.createdAt
  };
}
