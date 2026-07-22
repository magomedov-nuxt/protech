<template>
  <header class="sticky top-0 z-40 px-3 py-3 sm:px-4">
    <div class="mx-auto w-full max-w-370">
      <div
        class="relative flex min-h-18 items-center gap-3 rounded-4xl bg-white/90 p-2 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl  ">
        <NuxtLink to="/"
          class="group flex shrink-0 items-center gap-3 rounded-[1.5rem] px-2 py-1.5 transition duration-300 hover:scale-[1.01] hover:bg-[#f9fafb]"
          aria-label="На главную ПроТех76">
          <span
            class="grid size-11 place-items-center overflow-hidden rounded-[1.35rem] shadow-xl shadow-emerald-900/20 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
            <img src="/logo.png" alt="Логотип ПроТех76" class="size-full object-contain">
          </span>

          <span class="min-w-0 leading-tight">
            <span class="block truncate text-base font-semibold tracking-normal text-zinc-950 sm:text-lg">
              ПроТех76
            </span>

            <span class="hidden text-xs text-zinc-500 sm:block">
              Запчасти и навесное оборудование
            </span>
          </span>
        </NuxtLink>

        <nav aria-label="Основная навигация"
          class="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[#f3f4f6] p-1 xl:flex ">
          <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
            class="relative inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition duration-300 hover:scale-[1.02]"
            :aria-current="isNavActive(item) ? 'page' : undefined"
            :class="isNavActive(item) ? 'bg-white text-zinc-950 shadow-sm shadow-zinc-950/5' : 'text-zinc-500 hover:text-zinc-950  '">
            <UIcon :name="item.icon" class="size-4" />
            {{ item.label }}
            <span v-if="item.count"
              class="grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white shadow-lg"
              :class="getBadgeClass(item)">
              {{ item.count }}
            </span>
          </NuxtLink>

        </nav>

        <div class="ml-auto flex items-center gap-1 pr-2 sm:gap-2 sm:pr-3">
          <div class="hidden items-center gap-2 md:flex">
            <template v-if="auth.user">
              <UButton color="neutral" variant="soft" to="/orders"
                class="rounded-full bg-[#f3f4f6] transition duration-300 hover:scale-[1.02] ">
                <span v-if="!auth.user.image"
                  class="grid size-7 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700  ">
                  {{ auth.initials }}
                </span>
                <img v-else :src="auth.user.image" :alt="auth.user.name ?? auth.user.email"
                  class="size-7 rounded-full object-cover">
                <span class="max-w-36 truncate">{{ auth.user.name || auth.user.email }}</span>
              </UButton>
              <UTooltip text="Выйти">
                <UButton color="neutral" variant="ghost" icon="i-lucide-log-out" square
                  class="rounded-full transition duration-300 hover:scale-105" :loading="auth.pending"
                  aria-label="Выйти" @click="logout" />
              </UTooltip>
            </template>
            <UButton v-else color="primary" variant="solid" icon="i-lucide-user-round" to="/auth"
              class="rounded-full px-5 shadow-lg shadow-emerald-800/15 transition duration-300 hover:scale-[1.02]">
              Войти
            </UButton>
          </div>

          <UButton color="neutral" variant="soft" icon="i-lucide-menu" square
            class="relative !h-11 !w-11 rounded-full bg-[#f3f4f6] transition duration-300 hover:scale-105 xl:hidden "
            aria-label="Открыть меню" @click="openMobileMenu">
            <span v-if="messageNotifications.unreadCount"
              class="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-emerald-600 px-1 text-[11px] font-semibold text-white shadow-lg shadow-emerald-950/20">
              {{ messageNotifications.unreadCount }}
            </span>
          </UButton>
        </div>
      </div>
    </div>

    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="mobileOpen" class="fixed inset-0 z-50 xl:hidden">
        <button class="absolute inset-0 bg-zinc-950/45 backdrop-blur-sm" aria-label="Закрыть меню"
          @click="closeMobileMenu" />

        <aside ref="mobilePanel"
          aria-labelledby="mobile-menu-title"
          aria-modal="true"
          role="dialog"
          tabindex="-1"
          @keydown.esc.prevent="closeMobileMenu"
          @keydown.tab="trapMobileFocus"
          class="absolute inset-y-3 right-3 flex w-[min(390px,calc(100vw-1.5rem))] flex-col rounded-4xl bg-white p-4 shadow-2xl shadow-zinc-950/25 ">
          <div class="flex items-center justify-between gap-4">
            <NuxtLink to="/" class="flex items-center gap-3 rounded-3xl" aria-label="На главную ПроТех76"
              @click="closeMobileMenu">
              <span
                class="grid size-11 place-items-center overflow-hidden rounded-[1.35rem] shadow-xl shadow-emerald-900/20 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
                <img src="/logo.png" alt="Логотип ПроТех76" class="size-full object-contain">
              </span>
              <span>
                <span id="mobile-menu-title" class="block font-semibold text-zinc-950">ПроТех76</span>
                <span class="block text-xs text-zinc-500">Магазин запчастей и навесного оборудования</span>
              </span>
            </NuxtLink>

            <UButton color="neutral" variant="soft" icon="i-lucide-x" square class="!h-11 !w-11 shrink-0 rounded-full bg-[#f3f4f6] "
              aria-label="Закрыть меню" @click="closeMobileMenu" />
          </div>

          <div v-auto-animate class="mt-6 grid gap-2">
            <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
              class="flex items-center justify-between gap-3 rounded-[1.35rem] bg-[#f9fafb] px-4 py-3 text-sm font-medium text-zinc-700 transition duration-300 hover:scale-[1.01] hover:bg-zinc-100   "
              :aria-current="isNavActive(item) ? 'page' : undefined"
              :class="isNavActive(item) ? 'text-emerald-700' : ''" @click="closeMobileMenu">
              <span class="flex items-center gap-3">
                <span
                  class="grid size-10 place-items-center rounded-full bg-white text-zinc-500 shadow-sm shadow-zinc-950/5  ">
                  <UIcon :name="item.icon" class="size-5" />
                </span>
                {{ item.label }}
              </span>
              <span v-if="item.count"
                class="grid min-w-6 place-items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                :class="getBadgeClass(item)">
                {{ item.count }}
              </span>
            </NuxtLink>

          </div>

          <div class="mt-auto space-y-3 pt-6 mr-7">
            <div v-if="auth.user" class="rounded-[1.75rem] bg-[#f9fafb] p-4 ">
              <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Аккаунт</p>
              <p class="mt-2 truncate font-semibold text-zinc-950 ">
                {{ auth.user.name || auth.user.email }}
              </p>
              <UButton color="neutral" variant="soft" icon="i-lucide-log-out" block class="mt-4 min-h-11 rounded-full"
                :loading="auth.pending" @click="logout">
                Выйти
              </UButton>
            </div>
            <UButton v-else color="primary" icon="i-lucide-user-round" block to="/auth" size="lg" class="rounded-full"
              @click="closeMobileMenu">
              Войти или создать аккаунт
            </UButton>
          </div>
        </aside>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";
import { useMessageNotificationsStore } from "~~/app/stores/messageNotifications";

type NavItem = {
  count?: number;
  icon: string;
  label: string;
  match: (path: string) => boolean;
  to: string;
};

const route = useRoute();
const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const messageNotifications = useMessageNotificationsStore();
const mobileOpen = ref(false);
const mobilePanel = ref<HTMLElement | null>(null);
let lastFocusedElement: HTMLElement | null = null;
const navItems = computed<NavItem[]>(() => [
  {
    icon: "i-lucide-layout-grid",
    label: "Каталог",
    match: (path) => path === "/" || path.startsWith("/product"),
    to: "/"
  },
  {
    icon: "i-lucide-package-check",
    label: "Заказы",
    match: (path) => path.startsWith("/orders"),
    to: "/orders"
  },
  {
    count: messageNotifications.unreadCount,
    icon: "i-lucide-message-circle",
    label: "Сообщения",
    match: (path) => path.startsWith("/messages"),
    to: "/messages"
  },
  {
    count: favorites.count,
    icon: "i-lucide-heart",
    label: "Избранное",
    match: (path) => path.startsWith("/favorites"),
    to: "/favorites"
  },
  {
    count: cart.totalItems,
    icon: "i-lucide-shopping-bag",
    label: "Корзина",
    match: (path) => path.startsWith("/cart") || path.startsWith("/checkout"),
    to: "/cart"
  },
  ...(auth.user?.role === "ADMIN"
    ? [{
      icon: "i-lucide-shield-check",
      label: "Админка",
      match: (path: string) => path.startsWith("/admin"),
      to: "/admin"
    }]
    : [])
]);
watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
  }
);

watch(mobileOpen, (open) => {
  if (import.meta.client) {
    document.documentElement.style.overflow = open ? "hidden" : "";

    if (open) {
      lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      nextTick(() => {
        const focusable = getMobileFocusableElements();
        (focusable[0] ?? mobilePanel.value)?.focus();
      });
      return;
    }

    lastFocusedElement?.focus();
  }
});

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.documentElement.style.overflow = "";
  }
});

async function logout() {
  try {
    await auth.logout();
    cart.items = [];
    favorites.clearLocal();
    toast.success("Вы вышли из аккаунта");
    mobileOpen.value = false;

    if (["/cart", "/checkout", "/favorites", "/messages"].includes(route.path) || route.path.startsWith("/orders")) {
      await navigateTo("/");
    }
  } catch {
    toast.error("Не удалось завершить сессию");
  }
}

function isNavActive(item: NavItem) {
  return item.match(route.path);
}

function getBadgeClass(item: NavItem) {
  if (item.to === "/favorites") {
    return "bg-rose-500 shadow-rose-950/20";
  }

  if (item.to === "/messages") {
    return "bg-emerald-600 shadow-emerald-950/20";
  }

  return "bg-emerald-600 shadow-emerald-950/20";
}

function openMobileMenu() {
  mobileOpen.value = true;
}

function closeMobileMenu() {
  mobileOpen.value = false;
}

function getMobileFocusableElements() {
  if (!mobilePanel.value || !import.meta.client) {
    return [];
  }

  return Array.from(
    mobilePanel.value.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )
  ).filter((element) =>
    !element.hasAttribute("disabled") &&
    element.tabIndex !== -1 &&
    window.getComputedStyle(element).visibility !== "hidden"
  );
}

function trapMobileFocus(event: KeyboardEvent) {
  if (!mobileOpen.value || !event.key || event.key !== "Tab") {
    return;
  }

  const focusable = getMobileFocusableElements();

  if (!focusable.length) {
    event.preventDefault();
    mobilePanel.value?.focus();
    return;
  }

  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>
