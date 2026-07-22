import { getAuthSession } from "~~/server/utils/request";
import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event);

  if (!session) {
    return { user: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true
    }
  });

  return { user };
});
