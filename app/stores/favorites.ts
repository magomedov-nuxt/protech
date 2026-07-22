import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { FavoriteItem } from "~~/app/shared/types/shop";

export const useFavoritesStore = defineStore("shop-favorites", {
  state: () => ({
    items: [] as FavoriteItem[],
    pending: false,
    syncingProductId: null as number | null
  }),
  getters: {
    count: (state) => state.items.length,
    productIds: (state) => state.items.map((item) => item.product.id)
  },
  actions: {
    isFavorite(productId: number) {
      return this.items.some((item) => item.product.id === productId);
    },
    async fetchFavorites() {
      this.pending = true;

      try {
        this.items = await shopFetch<FavoriteItem[]>("/api/public/product/favorites");
      } catch {
        this.items = [];
      } finally {
        this.pending = false;
      }
    },
    async toggle(productId: number) {
      this.syncingProductId = productId;

      try {
        const endpoint = this.isFavorite(productId)
          ? `/api/public/product/favorites/delete/${productId}`
          : `/api/public/product/favorites/add/${productId}`;

        await shopFetch(endpoint, {
          method: "POST"
        });
        await this.fetchFavorites();
      } finally {
        this.syncingProductId = null;
      }
    },
    clearLocal() {
      this.items = [];
    }
  }
});