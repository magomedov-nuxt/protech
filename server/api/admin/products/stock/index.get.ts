export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const stocks = await prisma.productStock.findMany({
    select: {
      quantity: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          article: true
        }
      }
    },
    orderBy: {
      productId: "asc"
    }
  });

  return stocks;
});
