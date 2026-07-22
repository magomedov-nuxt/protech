import {
  getCategoryOptions,
  getPaidSalesFilters,
  parseAnalyticsQuery,
  toNumber
} from "~~/server/utils/analytics";

type SalesTotalsRow = {
  orders: number | bigint;
  quantity: number | bigint;
  revenue: unknown;
  cost: unknown;
};

type BreakdownRow = {
  key: string;
  orders: number | bigint;
  revenue?: unknown;
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = parseAnalyticsQuery(event);
  const filters = getPaidSalesFilters(query);

  const [salesRows, paymentMethodRows, obtainingMethodRows, categoryOptions] = await Promise.all([
    prisma.$queryRaw<SalesTotalsRow[]>`
      SELECT
        COUNT(DISTINCT o."id")::int AS "orders",
        COALESCE(SUM(oi."quantity"), 0)::int AS "quantity",
        COALESCE(SUM(oi."line_total"), 0)::numeric AS "revenue",
        COALESCE(SUM(COALESCE(oi."cost_price", 0) * oi."quantity"), 0)::numeric AS "cost"
      FROM "payment" p
      JOIN "order" o ON o."id" = p."order_id"
      JOIN "order_item" oi ON oi."order_id" = o."id"
      WHERE ${filters}
    `,
    prisma.$queryRaw<BreakdownRow[]>`
      SELECT
        o."payment_method"::text AS "key",
        COUNT(DISTINCT o."id")::int AS "orders",
        COALESCE(SUM(p."amount"), 0)::numeric AS "revenue"
      FROM "order" o
      LEFT JOIN "payment" p ON p."order_id" = o."id" AND p."payment_status" = 'PAID'
      WHERE o."created_at" >= ${query.startDate}
        AND o."created_at" <= ${query.endDate}
      GROUP BY 1
      ORDER BY 2 DESC
    `,
    prisma.$queryRaw<BreakdownRow[]>`
      SELECT
        o."obtaining_method"::text AS "key",
        COUNT(DISTINCT o."id")::int AS "orders",
        COALESCE(SUM(p."amount"), 0)::numeric AS "revenue"
      FROM "order" o
      LEFT JOIN "payment" p ON p."order_id" = o."id" AND p."payment_status" = 'PAID'
      WHERE o."created_at" >= ${query.startDate}
        AND o."created_at" <= ${query.endDate}
      GROUP BY 1
      ORDER BY 2 DESC
    `,
    getCategoryOptions()
  ]);

  const totalsRow = salesRows[0];
  const orders = toNumber(totalsRow?.orders);
  const quantity = toNumber(totalsRow?.quantity);
  const revenue = toNumber(totalsRow?.revenue);
  const cost = toNumber(totalsRow?.cost);
  const grossProfit = revenue - cost;

  return {
    totals: {
      orders,
      quantity,
      revenue,
      grossProfit,
      averageOrderValue: orders ? revenue / orders : 0,
      grossMargin: revenue ? grossProfit / revenue : 0
    },
    breakdowns: {
      paymentMethod: paymentMethodRows.map((row) => ({
        paymentMethod: row.key,
        orders: toNumber(row.orders),
        revenue: toNumber(row.revenue)
      })),
      obtainingMethod: obtainingMethodRows.map((row) => ({
        obtainingMethod: row.key,
        orders: toNumber(row.orders)
      }))
    },
    categoryOptions
  };
});
