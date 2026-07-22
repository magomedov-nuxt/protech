export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const attributes = await prisma.attribute.findMany({
    select: {
      id: true,
      name: true,
      unit: true,
      _count: {
        select: { productAttributes: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return attributes;
});
