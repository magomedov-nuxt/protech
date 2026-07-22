import {
  buildPublicProductWhere,
  type PublicProductFilterQuery
} from "~~/server/utils/publicProductFilters";

export default defineEventHandler(async (event) => {
  const query = getQuery<PublicProductFilterQuery>(event);
  const where = buildPublicProductWhere(query, {
    includePriceFilter: false
  });

  try {
    const range = await prisma.product.aggregate({
      where,
      _min: {
        currentPrice: true
      },
      _max: {
        currentPrice: true
      }
    });

    const minPrice = range._min.currentPrice === null ? 0 : Number(range._min.currentPrice);
    const maxPrice = range._max.currentPrice === null ? minPrice : Number(range._max.currentPrice);

    return {
      minPrice,
      maxPrice
    };
  } catch {
    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении диапазона цен"
    });
  }
});
