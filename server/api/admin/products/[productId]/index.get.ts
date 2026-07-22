export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  if (!Number.isInteger(productId) || productId <= 0) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID товара",
    });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      description: true,
      currentPrice: true,
      costPrice: true,
      oldPrice: true,
      article: true,
      mainImage: true,
      ozonLink: true,
      isActive: true,
      categoryId: true,
      productImages: {
        select: {
          url: true,
        },
      },
      productAttributes: {
        select: {
          value: true,
          attributeId: true,
        },
      },
    },
  });

  if (!product) {
    throw createError({
      statusCode: 404,
      message: "Товар не найден",
    });
  }

  return product;
});
