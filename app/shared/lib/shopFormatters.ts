import type { MoneyLike } from "~~/app/shared/types/shop";

export function toNumber(value: MoneyLike) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  return Number(value);
}

export function formatCurrency(value: MoneyLike) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(toNumber(value));
}

export function formatNumber(value: number | string | null | undefined) {
  return new Intl.NumberFormat("ru-RU").format(Number(value ?? 0));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function getErrorMessage(error: unknown, fallback = "Не удалось выполнить действие") {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { message?: string; data?: Record<string, string[]> } }).data;

    if (data?.message) {
      return data.message;
    }

    const firstFieldError = data?.data ? Object.values(data.data).flat()[0] : undefined;

    if (firstFieldError) {
      return firstFieldError;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function buildQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}