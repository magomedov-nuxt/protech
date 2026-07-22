export default defineEventHandler(async () => {
  const products = await prisma.product.findMany({
    orderBy: [
      { updatedAt: "desc" },
      { id: "asc" }
    ],
    where: {
      isActive: true
    },
    select: {
      id: true,
      name: true,
      description: true,
      mainImage: true,
      updatedAt: true,
      productImages: {
        select: {
          url: true
        }
      }
    }
  });

  return products.map((product) => {
    const imageUrls = [
      product.mainImage,
      ...product.productImages.map((image) => image.url)
    ].filter(Boolean);

    return {
      loc: `/product/${product.id}`,
      lastmod: product.updatedAt.toISOString(),
      changefreq: "weekly",
      priority: 0.8,
      images: imageUrls.map((url) => ({
        loc: url,
        title: product.name,
        caption: product.description?.slice(0, 180)
      }))
    };
  });
});
