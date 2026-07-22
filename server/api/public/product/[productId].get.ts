export default defineEventHandler(async (event) => {
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  try {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        currentPrice: true,
        oldPrice: true,
        article: true,
        mainImage: true,
        ozonLink: true,

        category: {
          select: {
            id: true,
            name: true,
          },
        },

        productImages: {
          select: {
            id: true,
            url: true,
          },
        },

        productAttributes: {
          select: {
            id: true,
            value: true,
            attributeId: true,
            attribute: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },

        productPrices: {
          select: {
            id: true,
            value: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        productStocks: {
          select: {
            quantity: true
          },
        },

        reviews: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            rating: true,
            advantages: true,
            disadvantages: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                image: true
              }
            },

            reviewPhotos: {
              select: {
                id: true,
                url: true
              }
            },

            reviewAnswers: {
              select: {
                text: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      throw createError({
        statusCode: 404,
        message: "Товар не найден",
      });
    }

    return product;
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении деталей товара",
    });
  }
});
