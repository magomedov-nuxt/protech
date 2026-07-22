import {
  getPaidSalesFilters,
  parseAnalyticsQuery,
  toNumber
} from "~~/server/utils/analytics";

type CategoryAnalyticsRow = {
  categoryName: string | null;
  revenue: unknown;
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = parseAnalyticsQuery(event);
  const filters = getPaidSalesFilters(query);

  const rows = await prisma.$queryRaw<CategoryAnalyticsRow[]>`
    SELECT
      oi."category_name" AS "categoryName",
      COALESCE(SUM(oi."line_total"), 0) AS "revenue"
    FROM "payment" p
    JOIN "order" o ON o."id" = p."order_id"
    JOIN "order_item" oi ON oi."order_id" = o."id"
    WHERE ${filters}
    GROUP BY oi."category_id", oi."category_name"
    ORDER BY "revenue" DESC
    LIMIT ${query.limit}
  `;

  return {
    items: rows.map((row) => ({
      categoryName: row.categoryName ?? "Без категории",
      revenue: toNumber(row.revenue)
    }))
  };
});
