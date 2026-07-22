interface AttributeQuery {
  categoryId?: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery<AttributeQuery>(event);
  const parsedCategoryId = Number(query.categoryId);
  const categoryId = Number.isInteger(parsedCategoryId) && parsedCategoryId > 0
    ? parsedCategoryId
    : undefined;

  const productWhere = {
    isActive: true,
    ...(categoryId ? { categoryId } : {})
  };

  const attributes = await prisma.attribute.findMany({
    where: {
      productAttributes: {
        some: {
          product: productWhere
        }
      }
    },
    select: {
      id: true,
      name: true,
      unit: true,
      productAttributes: {
        where: {
          product: productWhere
        },
        select: {
          value: true
        }
      }
    },
    orderBy: [
      { name: "asc" },
      { unit: "asc" }
    ]
  });

  return attributes.map((attribute) => {
    const valueCounts = new Map<string, number>();

    for (const item of attribute.productAttributes) {
      const value = item.value.trim();
      if (!value) continue;

      valueCounts.set(value, (valueCounts.get(value) ?? 0) + 1);
    }

    return {
      id: attribute.id,
      name: attribute.name,
      unit: attribute.unit,
      values: Array.from(valueCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value, "ru", { numeric: true }))
    };
  }).filter((attribute) => attribute.values.length > 0);
});
