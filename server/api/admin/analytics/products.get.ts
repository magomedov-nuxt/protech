import { Prisma } from "@prisma/client";
import {
  getPaidSalesFilters,
  parseAnalyticsQuery,
  toNumber
} from "~~/server/utils/analytics";

type ProductAnalyticsRow = {
  name: string;
  orders: number | bigint;
  quantity: number | bigint;
  revenue: unknown;
  cost: unknown;
};

const sortSqlByKey = {
  revenue: Prisma.sql`"revenue" DESC`,
  quantity: Prisma.sql`"quantity" DESC`,
  orders: Prisma.sql`"orders" DESC`,
  profit: Prisma.sql`("revenue" - "cost") DESC`
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = parseAnalyticsQuery(event);
  const filters = getPaidSalesFilters(query);
  const orderBy = sortSqlByKey[query.sortBy];

  const rows = await prisma.$queryRaw<ProductAnalyticsRow[]>`
    SELECT
      oi."product_name" AS "name",
      COUNT(DISTINCT o."id")::int AS "orders",
      COALESCE(SUM(oi."quantity"), 0)::int AS "quantity",
      COALESCE(SUM(oi."line_total"), 0)::numeric AS "revenue",
      COALESCE(SUM(COALESCE(oi."cost_price", 0) * oi."quantity"), 0)::numeric AS "cost"
    FROM "payment" p
    JOIN "order" o ON o."id" = p."order_id"
    JOIN "order_item" oi ON oi."order_id" = o."id"
    WHERE ${filters}
    GROUP BY oi."product_id", oi."product_name"
    ORDER BY ${orderBy}
    LIMIT ${query.limit}
  `;

  return {
    items: rows.map((row) => ({
      name: row.name,
      quantity: toNumber(row.quantity),
      revenue: toNumber(row.revenue)
    }))
  };
});
