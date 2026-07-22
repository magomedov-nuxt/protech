import { shiftDateKey, todayDateKey } from "~~/app/shared/lib/adminFormatters";
import type { OrderStatus } from "~~/app/shared/types/admin";

export const useAdminFiltersStore = defineStore("admin-filters", {
  state: () => ({
    analytics: {
      preset: "30",
      startDate: shiftDateKey(-29),
      endDate: todayDateKey(),
      categoryId: null as number | null,
      limit: 12
    },
    products: {
      search: "",
      categoryId: null as number | null,
      isActive: "all" as "all" | "true" | "false"
    },
    orders: {
      status: "all" as OrderStatus | "all"
    },
    reviews: {
      pendingOnly: true
    },
  }),
  actions: {
    setAnalyticsPreset(value: "7" | "30" | "custom") {
      this.analytics.preset = value;

      if (value !== "custom") {
        const days = Number(value);
        this.analytics.endDate = todayDateKey();
        this.analytics.startDate = shiftDateKey(-(days - 1));
      }
    },
    resetAnalyticsFilters() {
      this.analytics.preset = "30";
      this.analytics.startDate = shiftDateKey(-29);
      this.analytics.endDate = todayDateKey();
      this.analytics.categoryId = null;
      this.analytics.limit = 12;
    }
  }
});
