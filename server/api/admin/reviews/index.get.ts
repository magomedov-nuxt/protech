import type { Prisma } from "@prisma/client";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const page = getPageQueryParam(query.page);
  const pending = query.pending === "true";
  const limit = 20;

  const where: Prisma.ReviewWhereInput = pending
    ? { OR: [{ isAnswered: false }, { isAnswered: null }] }
    : {};

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        advantages: true,
        disadvantages: true,
        comment: true,
        isAnswered: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        product: { select: { name: true, mainImage: true } },
        reviewPhotos: {
          select: {
            id: true,
            url: true
          }
        },
        reviewAnswers: {
          select: {
            id: true,
            text: true,
            createdAt: true,
            user: { select: { name: true } }
          }
        }
      }
    }),
    prisma.review.count({ where })
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
});
