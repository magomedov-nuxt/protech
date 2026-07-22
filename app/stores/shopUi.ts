export type ShopCatalogAttributeFilter = {
  attributeId: number;
  value: string;
};

export const useShopUiStore = defineStore("shop-ui", {
  state: () => ({
    catalog: {
      search: "",
      categoryId: null as number | null,
      sort: "newest" as "newest" | "price_asc" | "price_desc" | "oldest",
      minPrice: null as number | null,
      maxPrice: null as number | null,
      discountOnly: false,
      inStockOnly: false,
      attributes: [] as ShopCatalogAttributeFilter[]
    }
  }),
  actions: {
    resetCatalogFilters() {
      this.catalog.search = "";
      this.catalog.categoryId = null;
      this.catalog.sort = "newest";
      this.catalog.minPrice = null;
      this.catalog.maxPrice = null;
      this.catalog.discountOnly = false;
      this.catalog.inStockOnly = false;
      this.catalog.attributes = [];
    },
    isCatalogAttributeSelected(attributeId: number, value: string) {
      return this.catalog.attributes.some((item) =>
        item.attributeId === attributeId && item.value === value
      );
    },
    toggleCatalogAttribute(attributeId: number, value: string) {
      if (this.isCatalogAttributeSelected(attributeId, value)) {
        this.catalog.attributes = this.catalog.attributes.filter((item) =>
          item.attributeId !== attributeId || item.value !== value
        );
        return;
      }

      this.catalog.attributes = [
        ...this.catalog.attributes,
        { attributeId, value }
      ];
    },
    clearCatalogAttributeFilters() {
      this.catalog.attributes = [];
    }
  }
});
