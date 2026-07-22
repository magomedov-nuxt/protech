export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const [reviewsPending, lowStock] = await Promise.all([
    prisma.review.count({ where: { OR: [{ isAnswered: false }, { isAnswered: null }] } }),
    prisma.productStock.count({ where: { quantity: { lte: 5 } } })
  ]);

  return {
    stats: {
      reviewsPending,
      lowStock
    }
  };
});
