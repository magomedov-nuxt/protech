import {
  isBrandAttribute,
  isColorAttribute
} from "~~/app/shared/lib/catalogProductHelpers";
import type { ProductDetails } from "~~/app/shared/types/shop";

export type ProductAttribute = ProductDetails["productAttributes"][number];
export type ProductSizeOption = {
  caption: string;
  label: string;
  value: string;
};

export function formatProductAttribute(attribute: ProductAttribute) {
  return `${attribute.value}${attribute.attribute.unit ? ` ${attribute.attribute.unit}` : ""}`;
}

export function isVariantAttribute(attribute: ProductAttribute) {
  if (isBrandAttribute(attribute.attribute) || isColorAttribute(attribute.attribute)) {
    return false;
  }

  const name = attribute.attribute.name.trim().toLowerCase();
  const variantTokens = ["размер", "size", "объем", "объём", "длина", "диагональ", "вязкость", "температура"];

  return variantTokens.some((token) => name.includes(token));
}

export function findProductAttributeValue(attributes: ProductAttribute[], tokens: string[]) {
  const attribute = attributes.find((item) => {
    const name = item.attribute.name.trim().toLowerCase();
    return tokens.some((token) => name.includes(token));
  });

  return attribute ? formatProductAttribute(attribute) : "";
}