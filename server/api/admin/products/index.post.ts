import { createProductSchema } from "~~/shared/schemas/admin/products/createProduct";
import { AuditAction } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const body = await validateBody(event, createProductSchema);

  const category = await prisma.category.findUnique({
    where: { id: body.categoryId },
    select: { id: true }
  });

  if (!category) {
    throw createError({
      statusCode: 400,
      message: "Категория не найдена"
    });
  }

  try {
    const currentPriceCreatedAt = new Date();
    const productPrices = body.oldPrice == null
      ? [{ value: body.currentPrice, createdAt: currentPriceCreatedAt }]
      : [
        {
          value: body.oldPrice,
          createdAt: new Date(currentPriceCreatedAt.getTime() - 1_000)
        },
        { value: body.currentPrice, createdAt: currentPriceCreatedAt }
      ];

    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        currentPrice: body.currentPrice,
        costPrice: body.costPrice,
        oldPrice: body.oldPrice,
        article: body.article,
        mainImage: body.mainImage,
        ozonLink: body.ozonLink,
        categoryId: body.categoryId,
        isActive: body.isActive,

        productPrices: {
          create: productPrices
        },

        productStocks: {
          create: { quantity: 0 }
        },

        ...(body.productImages?.length
          ? {
            productImages: {
              create: body.productImages.map((image) => ({ url: image.url }))
            }
          }
          : {}),

        ...(body.productAttributes?.length
          ? {
            productAttributes: {
              create: body.productAttributes.map((attr) => ({
                attributeId: attr.attributeId,
                value: attr.value
              }))
            }
          }
          : {})
      },
      select: {
        id: true,
        name: true,
        article: true,
        categoryId: true
      }
    });

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.CREATE,
      entityType: "product",
      entityId: product.id,
      summary: `Created product ${product.name}`,
      metadata: {
        article: product.article,
        categoryId: product.categoryId
      }
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2002: "Товар с таким артикулом уже существует",
      P2003: "Указана несуществующая характеристика"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при создании товара"
    });
  }
});
