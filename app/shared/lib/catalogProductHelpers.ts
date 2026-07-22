import { toNumber } from "~~/app/shared/lib/shopFormatters";
import type { AttributeFilter, ProductCardItem } from "~~/app/shared/types/shop";

export const PRODUCT_CATALOG_PAGE_SIZE = 20;
export const PRODUCT_CATALOG_PRICE_MIN = 0;
export const PRODUCT_CATALOG_PRICE_MAX = 500000;
export const PRODUCT_CATALOG_VISIBLE_FILTER_OPTIONS = 5;

export type ProductCatalogSort = "newest" | "price_asc" | "price_desc" | "oldest";

export type ProductCatalogSortOption = {
  label: string;
  value: ProductCatalogSort;
};

export type ProductCatalogCategoryItem = {
  id: number | null;
  name: string;
};

export type ProductCatalogAttributeLabel = {
  key: string;
  label: string;
};

export const productCatalogSortOptions: ProductCatalogSortOption[] = [
  { label: "Сначала новые", value: "newest" },
  { label: "Сначала дешевле", value: "price_asc" },
  { label: "Сначала дороже", value: "price_desc" },
  { label: "Сначала старые", value: "oldest" }
];

const colorTokens: Record<string, string> = {
  бел: "#f8fafc",
  white: "#f8fafc",
  черн: "#18181b",
  black: "#18181b",
  сер: "#a1a1aa",
  gray: "#a1a1aa",
  grey: "#a1a1aa",
  сереб: "#d4d4d8",
  silver: "#d4d4d8",
  син: "#2563eb",
  blue: "#2563eb",
  голуб: "#38bdf8",
  крас: "#ef4444",
  red: "#ef4444",
  зелен: "#16a34a",
  green: "#16a34a",
  желт: "#facc15",
  yellow: "#facc15",
  оранж: "#f97316",
  orange: "#f97316",
  фиолет: "#7c3aed",
  purple: "#7c3aed",
  роз: "#ec4899",
  pink: "#ec4899",
  корич: "#92400e",
  brown: "#92400e"
};

export function normalizeCatalogName(value: string) {
  return value.trim().toLowerCase();
}

export function isBrandAttribute(attribute: Pick<AttributeFilter, "name">) {
  const name = normalizeCatalogName(attribute.name);
  return ["бренд", "brand", "производитель", "марка"].some((token) => name.includes(token));
}

export function isColorAttribute(attribute: Pick<AttributeFilter, "name">) {
  const name = normalizeCatalogName(attribute.name);
  return ["цвет", "color"].some((token) => name.includes(token));
}

export function productAttributeValue(
  product: ProductCardItem,
  predicate: (attribute: Pick<AttributeFilter, "name" | "unit">) => boolean
) {
  const item = product.productAttributes?.find((attributeValue) => predicate({
    name: attributeValue.attribute.name,
    unit: attributeValue.attribute.unit
  }));

  return item?.value?.trim() || "";
}

export function productBrand(product: ProductCardItem) {
  return productAttributeValue(product, isBrandAttribute) || product.category?.name || "ПроТех76";
}

export function splitAttributeValues(value: string) {
  return value
    .split(/[;,/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function productColorValues(product: ProductCardItem) {
  return splitAttributeValues(productAttributeValue(product, isColorAttribute));
}

export function colorToCss(value: string) {
  const normalized = normalizeCatalogName(value);
  const token = Object.entries(colorTokens).find(([key]) => normalized.includes(key));

  if (token) {
    return token[1];
  }

  const hue = Array.from(normalized).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return `hsl(${hue} 64% 52%)`;
}

export function isOutOfStock(product: ProductCardItem) {
  return product.stockQuantity !== undefined && product.stockQuantity <= 0;
}

export function stockLabel(product: ProductCardItem) {
  if (product.stockQuantity === undefined) {
    return "в наличии";
  }

  return product.stockQuantity > 0 ? `${product.stockQuantity} шт.` : "нет в наличии";
}

export function discountPercent(product: ProductCardItem) {
  const oldPrice = toNumber(product.oldPrice);
  const currentPrice = toNumber(product.currentPrice);

  if (oldPrice <= currentPrice || oldPrice <= 0) {
    return 0;
  }

  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
}
