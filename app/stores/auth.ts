import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ShopUser } from "~~/app/shared/types/shop";

type LoginPayload = {
  callbackURL?: string;
  email: string;
  password: string;
  rememberMe: boolean;
};

type RegisterPayload = LoginPayload & {
  name: string;
};

export const useAuthStore = defineStore("shop-auth", {
  state: () => ({
    user: null as ShopUser | null,
    pending: false,
    initialized: false,
    lastEmail: ""
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    initials: (state) => {
      const source = state.user?.name || state.user?.email || "U";
      return source.slice(0, 2).toUpperCase();
    }
  },
  actions: {
    async fetchMe() {
      this.pending = true;

      try {
        const data = await shopFetch<{ user: ShopUser | null }>("/api/public/auth/me");
        this.user = data.user;
        return data.user;
      } catch {
        this.user = null;
        return null;
      } finally {
        this.pending = false;
        this.initialized = true;
      }
    },
    async login(payload: LoginPayload) {
      this.pending = true;

      try {
        await $fetch("/api/auth/sign-in/email", {
          method: "POST",
          credentials: "include",
          body: payload
        });

        this.lastEmail = payload.email;
        await this.fetchMe();
      } finally {
        this.pending = false;
      }
    },
    async register(payload: RegisterPayload) {
      this.pending = true;

      try {
        await $fetch("/api/auth/sign-up/email", {
          method: "POST",
          credentials: "include",
          body: {
            callbackURL: payload.callbackURL,
            email: payload.email,
            password: payload.password,
            name: payload.name
          }
        });

        this.lastEmail = payload.email;
      } finally {
        this.pending = false;
      }
    },
    async logout() {
      this.pending = true;

      try {
        await $fetch("/api/auth/sign-out", {
          method: "POST",
          credentials: "include",
          body: {}
        });
      } finally {
        this.user = null;
        this.pending = false;
        this.initialized = true;
      }
    }
  },
  persist: {
    pick: ["lastEmail"],
    storage: piniaPluginPersistedstate.localStorage()
  }
});
