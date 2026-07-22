export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  return await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
});
