import { saveUploadedImage } from "../../../utils/uploadImage";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const formData = await readMultipartFormData(event);
  const filePart = formData?.find((part) => part.name === "file");

  if (!filePart) {
    throw createError({
      statusCode: 400,
      message: "Файл не передан",
    });
  }

  const url = await saveUploadedImage(filePart);

  return { url };
});
