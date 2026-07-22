import { Prisma } from "@prisma/client";
import {
  buildPublicProductWhere,
  getPublicProductQueryValue,
  type PublicProductFilterQuery,
  type PublicProductQueryValue
} from "~~/server/utils/publicProductFilters";

interface ProductQuery extends PublicProductFilterQuery {
  page?: PublicProductQueryValue;
  sort?: PublicProductQueryValue;
}

export default defineEventHandler(async (event) => {
  const query = getQuery<ProductQuery>(event);

  const currentPage = getPageQueryParam(getPublicProductQueryValue(query.page));
  const sort = getPublicProductQueryValue(query.sort);
  const limit = 20;

  try {
    const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
      switch (sort) {
        case "price_asc":
          return [
            { currentPrice: "asc" },
            { id: "asc" }
          ];

        case "price_desc":
          return [
            { currentPrice: "desc" },
            { id: "asc" }
          ];

        case "newest":
          return [
            { createdAt: "desc" },
            { id: "asc" }
          ];

        case "oldest":
          return [
            { createdAt: "asc" },
            { id: "asc" }
          ];

        default:
          return [
            { id: "asc" }
          ];
      }
    })();

    const where = buildPublicProductWhere(query);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip: (currentPage - 1) * limit,
        take: limit,
        orderBy,
        where,
        select: {
          id: true,
          name: true,
          currentPrice: true,
          oldPrice: true,
          mainImage: true,
          category: {
            select: {
              name: true
            }
          },
          productStocks: {
            select: {
              quantity: true
            }
          },
          productAttributes: {
            select: {
              value: true,
              attribute: {
                select: {
                  name: true,
                  unit: true
                }
              }
            }
          },

          _count: {
            select: {
              reviews: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    const productIds = products.map((product) => product.id);

    const ratings = await prisma.review.groupBy({
      by: ["productId"],
      where: {
        productId: {
          in: productIds
        }
      },
      _avg: {
        rating: true
      }
    });

    const ratingByProductId = new Map(
      ratings.map((item) => [
        item.productId,
        item._avg.rating === null ? null : Number(item._avg.rating.toFixed(1))
      ])
    );

    return {
      items: products.map((product) => ({
        id: product.id,
        name: product.name,
        currentPrice: product.currentPrice,
        oldPrice: product.oldPrice,
        mainImage: product.mainImage,
        category: product.category,
        stockQuantity: product.productStocks[0]?.quantity ?? 0,
        reviewsCount: product._count.reviews,
        averageRating: ratingByProductId.get(product.id) ?? null,
        productAttributes: product.productAttributes
      })),
      pagination: {
        page: currentPage,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении товаров"
    });
  }
});
