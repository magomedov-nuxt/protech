export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true
    }
  });

  return { user };
});
