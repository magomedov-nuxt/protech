<template>
  <div class="shop-shell min-h-screen bg-(--shop-surface-muted) text-(--shop-text)">
    <a href="#main-content"
      class="sr-only fixed left-4 top-4 z-[100] rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-xl focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-emerald-300">
      К основному содержимому
    </a>

    <PublicHeader />

    <main id="main-content" class="min-h-[calc(100dvh-9rem)]" tabindex="-1">
      <slot />
    </main>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";
import { useMessageNotificationsStore } from "~~/app/stores/messageNotifications";

const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const messageNotifications = useMessageNotificationsStore();

onMounted(async () => {
  const user = await auth.fetchMe();

  if (user) {
    await Promise.all([
      cart.fetchCart(),
      favorites.fetchFavorites(),
      messageNotifications.initialize(user.id)
    ]);
  }
});

onBeforeUnmount(() => {
  messageNotifications.disconnect();
});

watch(
  () => auth.user?.id,
  async (userId) => {
    if (userId) {
      await Promise.all([
        cart.fetchCart(),
        favorites.fetchFavorites(),
        messageNotifications.initialize(userId)
      ]);
      return;
    }

    cart.items = [];
    favorites.clearLocal();
    messageNotifications.reset();
  }
);
</script>
