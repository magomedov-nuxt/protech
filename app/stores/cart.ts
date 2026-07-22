import { shopFetch } from "~~/app/shared/lib/shopFetch";
import { toNumber } from "~~/app/shared/lib/shopFormatters";
import type { CartItem, ObtainingMethod, PaymentMethod } from "~~/app/shared/types/shop";

export type CheckoutDraft = {
  obtainingMethod: ObtainingMethod;
  paymentMethod: PaymentMethod;
  customerPhone: string;
  recipientIsAnotherPerson: boolean;
  recipientName: string;
  recipientPhone: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
  comment: string;
};

function createCheckoutDraft(): CheckoutDraft {
  return {
    obtainingMethod: "DELIVERY",
    paymentMethod: "ONLINE",
    customerPhone: "",
    recipientIsAnotherPerson: false,
    recipientName: "",
    recipientPhone: "",
    city: "",
    street: "",
    house: "",
    apartment: "",
    entrance: "",
    floor: "",
    intercom: "",
    comment: ""
  };
}

export const useCartStore = defineStore("shop-cart", {
  state: () => ({
    items: [] as CartItem[],
    pending: false,
    syncingProductId: null as number | null,
    checkoutDraft: createCheckoutDraft()
  }),
  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: (state) => state.items.reduce((sum, item) => sum + toNumber(item.product.currentPrice) * item.quantity, 0),
    hasItems: (state) => state.items.length > 0,
    orderItems: (state) => state.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity
    }))
  },
  actions: {
    async fetchCart() {
      this.pending = true;

      try {
        this.items = await shopFetch<CartItem[]>("/api/public/cart");
      } catch {
        this.items = [];
      } finally {
        this.pending = false;
      }
    },
    async add(productId: number) {
      this.syncingProductId = productId;

      try {
        await shopFetch(`/api/public/cart/add/${productId}`, {
          method: "POST"
        });
        await this.fetchCart();
      } finally {
        this.syncingProductId = null;
      }
    },
    async updateQuantity(productId: number, quantity: number) {
      if (quantity <= 0) {
        await this.remove(productId);
        return;
      }

      this.syncingProductId = productId;

      try {
        await shopFetch(`/api/public/cart/update/${productId}`, {
          method: "POST",
          body: { quantity }
        });
        await this.fetchCart();
      } finally {
        this.syncingProductId = null;
      }
    },
    async remove(productId: number) {
      this.syncingProductId = productId;

      try {
        await shopFetch(`/api/public/cart/delete/${productId}`, {
          method: "POST"
        });
        this.items = this.items.filter((item) => item.product.id !== productId);
      } finally {
        this.syncingProductId = null;
      }
    },
    async clear() {
      this.pending = true;

      try {
        await shopFetch("/api/public/cart/delete/all", {
          method: "POST"
        });
        this.items = [];
      } finally {
        this.pending = false;
      }
    },
    resetCheckoutDraft() {
      this.checkoutDraft = createCheckoutDraft();
    }
  },
  persist: {
    pick: ["checkoutDraft"],
    storage: piniaPluginPersistedstate.localStorage()
  }
});
