import { AuditAction } from "@prisma/client";
import { deleteStoredImages } from "../../../../utils/uploadImage";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        article: true,
        mainImage: true,
        productImages: { select: { url: true } }
      }
    });

    if (!product) {
      throw createError({
        statusCode: 404,
        message: "Товар не найден"
      });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    await deleteStoredImages([
      product.mainImage,
      ...product.productImages.map((image) => image.url)
    ]);

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.DELETE,
      entityType: "product",
      entityId: productId,
      summary: `Deleted product ${product?.name ?? productId}`,
      metadata: {
        article: product?.article
      }
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Товар не найден",
      P2003: {
        statusCode: 409,
        message: "Невозможно удалить товар, связанный с заказами"
      }
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении товара"
    });
  }
});
