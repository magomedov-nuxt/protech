import type { Prisma } from "@prisma/client";
import { createError } from "h3";

const MAX_SEARCH_LENGTH = 120;
const MAX_ATTRIBUTES_QUERY_LENGTH = 5000;
const MAX_ATTRIBUTE_FILTERS = 50;
const MAX_ATTRIBUTE_VALUE_LENGTH = 255;

export type PublicProductQueryValue = string | string[] | undefined;

export interface PublicProductFilterQuery {
  search?: PublicProductQueryValue;
  minPrice?: PublicProductQueryValue;
  maxPrice?: PublicProductQueryValue;
  categoryId?: PublicProductQueryValue;
  discountOnly?: PublicProductQueryValue;
  inStockOnly?: PublicProductQueryValue;
  attributes?: PublicProductQueryValue;
}

interface AttributeFilter {
  attributeId: number;
  value: string;
}

export function getPublicProductQueryValue(value: PublicProductQueryValue) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  return typeof firstValue === "string" ? firstValue : undefined;
}

function parseAttributes(attributes?: PublicProductQueryValue): AttributeFilter[] {
  const rawAttributes = getPublicProductQueryValue(attributes);

  if (!rawAttributes) return [];

  if (rawAttributes.length > MAX_ATTRIBUTES_QUERY_LENGTH) {
    throw createError({
      statusCode: 400,
      message: "Слишком длинный фильтр attributes"
    });
  }

  try {
    const parsed = JSON.parse(rawAttributes);

    if (!Array.isArray(parsed)) return [];

    if (parsed.length > MAX_ATTRIBUTE_FILTERS) {
      throw createError({
        statusCode: 400,
        message: "Слишком много фильтров attributes"
      });
    }

    return parsed
      .map((item) => ({
        attributeId: Number(item.attributeId),
        value: String(item.value ?? "").trim()
      }))
      .filter((item) =>
        Number.isInteger(item.attributeId) &&
        item.attributeId > 0 &&
        item.value.length > 0 &&
        item.value.length <= MAX_ATTRIBUTE_VALUE_LENGTH
      );
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 400,
      message: "Некорректный формат attributes"
    });
  }
}

function toFiniteNumber(value?: PublicProductQueryValue) {
  const parsed = Number(getPublicProductQueryValue(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toPositiveInteger(value?: PublicProductQueryValue) {
  const parsed = Number(getPublicProductQueryValue(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function buildPublicProductWhere(
  query: PublicProductFilterQuery,
  options: { includePriceFilter?: boolean } = {}
): Prisma.ProductWhereInput {
  const includePriceFilter = options.includePriceFilter ?? true;
  const search = getPublicProductQueryValue(query.search)?.trim();
  const minPrice = toFiniteNumber(query.minPrice);
  const maxPrice = toFiniteNumber(query.maxPrice);
  const categoryId = toPositiveInteger(query.categoryId);
  const discountOnly = ["1", "true"].includes(getPublicProductQueryValue(query.discountOnly) ?? "");
  const inStockOnly = ["1", "true"].includes(getPublicProductQueryValue(query.inStockOnly) ?? "");
  const attributes = parseAttributes(query.attributes);
  const groupedAttributes = new Map<number, Set<string>>();

  if (search && search.length > MAX_SEARCH_LENGTH) {
    throw createError({
      statusCode: 400,
      message: "Слишком длинная поисковая строка"
    });
  }

  for (const attribute of attributes) {
    if (!groupedAttributes.has(attribute.attributeId)) {
      groupedAttributes.set(attribute.attributeId, new Set());
    }

    groupedAttributes.get(attribute.attributeId)!.add(attribute.value);
  }

  const attributeFilters: Prisma.ProductWhereInput[] = Array.from(groupedAttributes.entries()).map(
    ([attributeId, values]) => ({
      productAttributes: {
        some: {
          attributeId,
          value: {
            in: Array.from(values)
          }
        }
      }
    })
  );

  return {
    isActive: true,

    ...(search
      ? {
        OR: [
          {
            name: {
              contains: search
            }
          },
          {
            description: {
              contains: search
            }
          }
        ]
      }
      : {}),

    ...(includePriceFilter && (minPrice !== undefined || maxPrice !== undefined)
      ? {
        currentPrice: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {})
        }
      }
      : {}),

    ...(categoryId !== undefined
      ? {
        categoryId
      }
      : {}),

    ...(discountOnly
      ? {
        oldPrice: {
          not: null
        }
      }
      : {}),

    ...(inStockOnly
      ? {
        productStocks: {
          some: {
            quantity: {
              gt: 0
            }
          }
        }
      }
      : {}),

    ...(attributeFilters.length > 0
      ? {
        AND: attributeFilters
      }
      : {})
  };
}
