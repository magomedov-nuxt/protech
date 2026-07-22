import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { Buffer } from "node:buffer";

const DEFAULT_UPLOAD_PUBLIC_PATH = "/uploads";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_BYTES = 5 * 1024 * 1024;

type UploadPart = {
  data?: Buffer;
  type?: string;
  filename?: string;
};

function getUploadDir() {
  const configuredDir = process.env.UPLOAD_DIR?.trim();

  return configuredDir ? resolve(configuredDir) : join(process.cwd(), "public", "uploads");
}

function getUploadPublicPath() {
  const value = process.env.UPLOAD_PUBLIC_PATH?.trim() || DEFAULT_UPLOAD_PUBLIC_PATH;
  const normalized = value.replace(/^\/+|\/+$/g, "");

  if (!normalized || normalized.includes("..") || !/^[a-z0-9/_-]+$/i.test(normalized)) {
    return DEFAULT_UPLOAD_PUBLIC_PATH;
  }

  return `/${normalized}`;
}

function hasValidImageSignature(mime: string, data: Buffer) {
  switch (mime) {
    case "image/jpeg":
      return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;

    case "image/png":
      return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    case "image/webp":
      return data.length >= 12 && data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP";

    case "image/gif":
      return data.length >= 6 && ["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString("ascii"));

    default:
      return false;
  }
}

export async function saveUploadedImage(file: UploadPart): Promise<string> {
  if (!file.data?.length) {
    throw createError({ statusCode: 400, message: "Файл пуст" });
  }

  if (file.data.length > MAX_BYTES) {
    throw createError({
      statusCode: 400,
      message: "Файл слишком большой. Максимум — 5 МБ",
    });
  }

  const mime = file.type?.toLowerCase() ?? "";
  if (!ALLOWED_MIME.has(mime)) {
    throw createError({
      statusCode: 400,
      message: "Допустимы только JPEG, PNG, WebP и GIF",
    });
  }

  if (!hasValidImageSignature(mime, file.data)) {
    throw createError({
      statusCode: 400,
      message: "Файл не похож на корректное изображение",
    });
  }

  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const ext =
    EXT_BY_MIME[mime] ||
    extname(file.filename ?? "").toLowerCase() ||
    ".jpg";
  const filename = `${randomUUID()}${ext}`;
  await writeFile(join(uploadDir, filename), file.data);

  return `${getUploadPublicPath()}/${filename}`;
}
