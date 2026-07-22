import { createError, getRouterParam, type H3Event } from "h3";

const DEFAULT_MAX_PAGE = 1000;

function toPositiveInteger(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getPositiveIntRouterParam(
  event: H3Event,
  name: string,
  message = "Некорректный ID"
) {
  const parsed = toPositiveInteger(getRouterParam(event, name));

  if (parsed === null) {
    throw createError({
      statusCode: 400,
      message
    });
  }

  return parsed;
}

export function getPageQueryParam(value: unknown, max = DEFAULT_MAX_PAGE) {
  return Math.min(toPositiveInteger(value) ?? 1, max);
}

export function getOptionalPositiveIntQueryParam(value: unknown) {
  return toPositiveInteger(value) ?? undefined;
}

export function getBoundedPositiveIntQueryParam(
  value: unknown,
  fallback: number,
  max: number
) {
  const parsed = toPositiveInteger(value) ?? fallback;

  return Math.min(parsed, max);
}
