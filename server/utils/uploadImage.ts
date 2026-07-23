import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { Buffer } from "node:buffer";
import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const DEFAULT_KEY_PREFIX = "uploads";

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

type S3Config = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

let s3Client: S3Client | null = null;

function getS3Config(): S3Config {
  const region = process.env.AWS_REGION?.trim();
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw createError({
      statusCode: 500,
      message: "S3-хранилище не настроено",
    });
  }

  return { region, bucket, accessKeyId, secretAccessKey };
}

function getS3Client() {
  if (!s3Client) {
    const { region, accessKeyId, secretAccessKey } = getS3Config();

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return s3Client;
}

function getKeyPrefix() {
  const prefix = process.env.S3_KEY_PREFIX?.trim() || DEFAULT_KEY_PREFIX;
  const normalized = prefix.replace(/^\/+|\/+$/g, "");

  return normalized || DEFAULT_KEY_PREFIX;
}

function getPublicBaseUrl() {
  const customUrl = process.env.S3_PUBLIC_URL?.trim();

  if (customUrl) {
    return customUrl.replace(/\/+$/, "");
  }

  const { bucket, region } = getS3Config();

  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

function buildPublicUrl(key: string) {
  return `${getPublicBaseUrl()}/${key}`;
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

export function getStorageKeyFromUrl(url: string): string | null {
  const trimmed = url.trim();

  if (!trimmed) {
    return null;
  }

  const publicBase = getPublicBaseUrl();

  if (trimmed.startsWith(`${publicBase}/`)) {
    return trimmed.slice(publicBase.length + 1);
  }

  const { bucket, region } = getS3Config();
  const standardBase = `https://${bucket}.s3.${region}.amazonaws.com`;

  if (trimmed.startsWith(`${standardBase}/`)) {
    return trimmed.slice(standardBase.length + 1);
  }

  const prefix = getKeyPrefix();
  const localPattern = new RegExp(`^/${prefix}/(.+)$`, "i");

  if (localPattern.test(trimmed)) {
    return trimmed.replace(/^\//, "");
  }

  return null;
}

export function getRemovedImageUrls(oldUrls: string[], newUrls: string[]) {
  const next = new Set(newUrls.filter(Boolean));

  return oldUrls.filter((url) => url && !next.has(url));
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

  const ext =
    EXT_BY_MIME[mime] ||
    extname(file.filename ?? "").toLowerCase() ||
    ".jpg";
  const key = `${getKeyPrefix()}/${randomUUID()}${ext}`;
  const { bucket } = getS3Config();

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.data,
      ContentType: mime,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return buildPublicUrl(key);
}

export async function deleteStoredImages(urls: string[]) {
  const keys = [
    ...new Set(
      urls
        .map((url) => getStorageKeyFromUrl(url))
        .filter((key): key is string => Boolean(key)),
    ),
  ];

  if (!keys.length) {
    return;
  }

  const { bucket } = getS3Config();

  try {
    await getS3Client().send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: keys.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
  } catch (error) {
    console.error("Failed to delete images from S3", error);
  }
}
