import { readFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import {
  createError,
  defineEventHandler,
  getRouterParam,
} from "h3";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function getUploadDir() {
  const configuredDir = process.env.UPLOAD_DIR?.trim();

  return configuredDir
    ? resolve(configuredDir)
    : resolve("data/uploads");
}

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, "filename", {
    decode: true,
  });

  if (
    !filename ||
    filename !== basename(filename) ||
    !/^[0-9a-f-]+\.(jpg|jpeg|png|webp|gif)$/i.test(filename)
  ) {
    throw createError({
      statusCode: 404,
      message: "Файл не найден",
    });
  }

  const extension = extname(filename).toLowerCase();
  const contentType = MIME_BY_EXT[extension];

  if (!contentType) {
    throw createError({
      statusCode: 404,
      message: "Файл не найден",
    });
  }

  const filePath = join(getUploadDir(), filename);

  let data: Buffer;

  try {
    data = await readFile(filePath);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw createError({
        statusCode: 404,
        message: "Файл не найден",
      });
    }

    throw error;
  }

  setResponseHeaders(event, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  return data;
});