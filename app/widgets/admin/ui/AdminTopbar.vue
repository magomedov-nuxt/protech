<template>
  <header class="admin-topbar">
    <div class="admin-container px-3 sm:px-4 lg:px-6 2xl:px-8">
      <div class="admin-topbar-panel flex min-h-16 items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <UButton color="neutral" variant="ghost" icon="i-lucide-menu" square
            class="admin-touch-icon rounded-full bg-[#f9fafb] text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 lg:hidden"
            aria-label="Открыть навигацию" @click="$emit('open-menu')" />

          <div class="hidden size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 sm:grid">
            <component :is="currentIcon" class="size-5" />
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="truncate text-base font-semibold tracking-normal text-zinc-950 sm:text-lg">
                {{ currentTitle }}
              </p>
              <span class="hidden rounded-full bg-[#f9fafb] px-2.5 py-1 text-[0.68rem] font-semibold uppercase text-zinc-400 md:inline-flex">
                ПроТех76
              </span>
            </div>
            <p class="hidden truncate text-xs text-zinc-500 sm:block">
              {{ subtitle }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <div class="hidden h-11 items-center gap-2 rounded-full bg-[#f9fafb] px-4 text-xs font-medium text-zinc-500 shadow-sm shadow-zinc-950/5 xl:flex">
            <CalendarDays class="size-4" />
            {{ todayLabel }}
          </div>

          <UButton color="neutral" variant="ghost" icon="i-lucide-store" to="/"
            class="hidden h-11 rounded-full bg-[#f9fafb] px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 md:inline-flex">
            Магазин
          </UButton>

          <div class="flex size-12 items-center justify-center rounded-full bg-[#f9fafb] p-1 shadow-sm shadow-zinc-950/5 md:h-12 md:w-auto md:justify-start md:gap-2 md:py-1 md:pl-1 md:pr-3">
            <img v-if="user?.image" :src="user.image" :alt="user.name ?? user.email"
              class="size-10 rounded-full object-cover">
            <div v-else
              class="grid size-10 place-items-center rounded-full bg-white text-xs font-semibold text-emerald-700 shadow-sm shadow-zinc-950/5">
              {{ initials }}
            </div>
            <div class="hidden min-w-0 md:block">
              <p class="max-w-40 truncate text-xs font-semibold text-zinc-950">
                {{ user?.name || "Администратор" }}
              </p>
              <p class="max-w-40 truncate text-[0.68rem] text-zinc-500">
                {{ user?.email }}
              </p>
            </div>
          </div>

          <UTooltip text="Выйти">
            <UButton color="neutral" variant="ghost" icon="i-lucide-log-out" square
              class="admin-touch-icon rounded-full bg-[#f9fafb] text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-red-50 hover:text-red-600"
              :loading="loggingOut" aria-label="Выйти" @click="logout" />
          </UTooltip>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Layers3,
  MessageSquareText,
  MessagesSquare,
  PackageSearch,
  Users,
  Warehouse
} from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import type { AdminUser } from "~~/app/shared/types/admin";

const props = defineProps<{
  user: AdminUser | null | undefined;
}>();

defineEmits<{
  "open-menu": [];
}>();

const route = useRoute();
const loggingOut = ref(false);

const pageMeta = {
  "/admin": {
    icon: BarChart3,
    title: "Аналитика",
    subtitle: "Финансы, заказы и складские сигналы"
  },
  "/admin/products": {
    icon: PackageSearch,
    title: "Товары",
    subtitle: "Карточки, цены, медиа и видимость"
  },
  "/admin/stock": {
    icon: Warehouse,
    title: "Остатки",
    subtitle: "Доступность и приходы на склад"
  },
  "/admin/catalog": {
    icon: Layers3,
    title: "Справочники",
    subtitle: "Категории и характеристики каталога"
  },
  "/admin/orders": {
    icon: ClipboardList,
    title: "Заказы",
    subtitle: "Статусы, оплата и доставка"
  },
  "/admin/messages": {
    icon: MessagesSquare,
    title: "Сообщения",
    subtitle: "Диалоги с пользователями"
  },
  "/admin/users": {
    icon: Users,
    title: "Пользователи",
    subtitle: "Аккаунты и роли"
  },
  "/admin/reviews": {
    icon: MessageSquareText,
    title: "Отзывы",
    subtitle: "Модерация и ответы"
  }
};

const currentMeta = computed(() => {
  const entries = Object.entries(pageMeta);
  const match = entries.find(([path]) => (path === "/admin" ? route.path === path : route.path.startsWith(path)));

  return match?.[1] ?? {
    icon: BarChart3,
    title: "Админ-панель",
    subtitle: "Операционная панель магазина ПроТех76"
  };
});
const currentIcon = computed(() => currentMeta.value.icon);
const currentTitle = computed(() => currentMeta.value.title);
const subtitle = computed(() => currentMeta.value.subtitle);
const todayLabel = computed(() => new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric"
}).format(new Date()));
const initials = computed(() => {
  const source = props.user?.name || props.user?.email || "A";
  return source.slice(0, 2).toUpperCase();
});

async function logout() {
  if (loggingOut.value) {
    return;
  }

  loggingOut.value = true;

  try {
    await adminFetch("/api/admin/auth/logout-audit", { method: "POST" }).catch(() => undefined);
    await $fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
      body: {}
    });
    clearNuxtData("admin-me");
    toast.success("Вы вышли из админ-панели");
    await navigateTo("/admin/login", { replace: true });
  } catch {
    toast.error("Не удалось завершить сессию");
  } finally {
    loggingOut.value = false;
  }
}
</script>
