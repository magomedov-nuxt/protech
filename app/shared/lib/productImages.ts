const OZON_IMAGE_HOST = "ir.ozone.ru";
const OZON_SIZE_SEGMENT_PATTERN = /^c\d+$/i;

const ozonImageSizeByVariant = {
  card: "c500",
  detail: "c1000",
  thumbnail: "c300"
} as const;

export type ProductImageVariant = keyof typeof ozonImageSizeByVariant;

export function isOzonProductImage(source: string) {
  try {
    return new URL(source).hostname === OZON_IMAGE_HOST;
  } catch {
    return false;
  }
}

export function productImageUrl(source: string, variant: ProductImageVariant = "card") {
  if (!source || source.startsWith("/")) {
    return source;
  }

  try {
    const url = new URL(source);

    if (url.hostname !== OZON_IMAGE_HOST) {
      return source;
    }

    const pathParts = url.pathname.split("/");
    const targetSize = ozonImageSizeByVariant[variant];
    const sizeIndex = pathParts.findIndex((part) => OZON_SIZE_SEGMENT_PATTERN.test(part));

    if (sizeIndex >= 0) {
      pathParts[sizeIndex] = targetSize;
    } else if (pathParts.length > 2) {
      pathParts.splice(pathParts.length - 1, 0, targetSize);
    }

    url.pathname = pathParts.join("/");
    return url.toString();
  } catch {
    return source;
  }
}

export function productImageCrossorigin(source: string) {
  return isOzonProductImage(source) ? "anonymous" : undefined;
}

export function productImageSrcset(source: string, variant: ProductImageVariant = "card") {
  if (!isOzonProductImage(source)) {
    return undefined;
  }

  const candidates: Array<[ProductImageVariant, string]> = variant === "detail"
    ? [
      ["card", "1x"],
      ["detail", "2x"]
    ]
    : [
      ["thumbnail", "1x"],
      ["card", "2x"]
    ];

  return candidates
    .map(([candidateVariant, descriptor]) =>
      `${productImageUrl(source, candidateVariant)} ${descriptor}`
    )
    .join(", ");
}
