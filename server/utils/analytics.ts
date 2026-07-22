import { Prisma } from "@prisma/client";
import { getQuery, type H3Event } from "h3";
import { prisma } from "./prisma";
import { getPositiveIntegerEnv } from "./env";

export type AnalyticsSortBy = "revenue" | "quantity" | "orders" | "profit";

export type AnalyticsQuery = {
  startDate: Date;
  endDate: Date;
  categoryId?: number;
  limit: number;
  sortBy: AnalyticsSortBy;
};

const sortBySet = new Set<AnalyticsSortBy>(["revenue", "quantity", "orders", "profit"]);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value: unknown) {
  if (!value) return null;

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function toPositiveInt(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function clampLimit(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 200) : 20;
}

function getInclusiveDayCount(startDate: Date, endDate: Date) {
  return Math.floor((startOfDay(endDate).getTime() - startOfDay(startDate).getTime()) / MS_PER_DAY) + 1;
}

export function getAnalyticsMaxDays() {
  return getPositiveIntegerEnv("ANALYTICS_MAX_DAYS", 366, {
    min: 1,
    max: 3660
  });
}

export function clampAnalyticsDateRange(startDate: Date, endDate: Date) {
  let normalizedStartDate = startOfDay(startDate);
  let normalizedEndDate = endOfDay(endDate);

  if (normalizedStartDate > normalizedEndDate) {
    [normalizedStartDate, normalizedEndDate] = [
      startOfDay(normalizedEndDate),
      endOfDay(normalizedStartDate)
    ];
  }

  const maxDays = getAnalyticsMaxDays();

  if (getInclusiveDayCount(normalizedStartDate, normalizedEndDate) > maxDays) {
    normalizedStartDate = startOfDay(normalizedEndDate);
    normalizedStartDate.setDate(normalizedStartDate.getDate() - maxDays + 1);
  }

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate
  };
}

export function parseAnalyticsQuery(event: H3Event): AnalyticsQuery {
  const query = getQuery(event);
  const endDate = endOfDay(parseDate(query.endDate) ?? new Date());
  const defaultStartDate = new Date(endDate);
  defaultStartDate.setDate(defaultStartDate.getDate() - 29);

  const startDate = startOfDay(parseDate(query.startDate) ?? defaultStartDate);
  const sortBy = sortBySet.has(String(query.sortBy) as AnalyticsSortBy)
    ? String(query.sortBy) as AnalyticsSortBy
    : "revenue";

  const range = clampAnalyticsDateRange(startDate, endDate);

  return {
    startDate: range.startDate,
    endDate: range.endDate,
    categoryId: toPositiveInt(query.categoryId),
    limit: clampLimit(query.limit),
    sortBy
  };
}

export function toNumber(value: unknown) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

export function getPaidSalesFilters(query: AnalyticsQuery) {
  const filters: Prisma.Sql[] = [
    Prisma.sql`p."payment_status" = 'PAID'`,
    Prisma.sql`p."paid_at" IS NOT NULL`,
    Prisma.sql`p."paid_at" >= ${query.startDate}`,
    Prisma.sql`p."paid_at" <= ${query.endDate}`,
    Prisma.sql`o."order_status" <> 'CANCELLED'`
  ];

  if (query.categoryId) {
    filters.push(Prisma.sql`oi."category_id" = ${query.categoryId}`);
  }

  return Prisma.join(filters, " AND ");
}

export async function getCategoryOptions() {
  return await prisma.category.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: "asc"
    }
  });
}
