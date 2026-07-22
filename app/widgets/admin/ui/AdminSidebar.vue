<template>
  <aside :class="[
    'admin-sidebar flex flex-col overflow-hidden transition-[width] duration-200',
    fluid
      ? 'h-full w-full'
      : collapsed
        ? 'fixed inset-y-0 left-0 z-40 hidden w-(--admin-sidebar-collapsed-width) lg:flex'
        : 'fixed inset-y-0 left-0 z-40 hidden w-(--admin-sidebar-width) lg:flex'
  ]">
    <div :class="[
      'flex min-h-20 items-center gap-3 border-b border-zinc-100 px-3 py-3',
      collapsed ? 'justify-center' : 'justify-between'
    ]">
      <NuxtLink to="/admin" :class="[
        'group flex min-w-0 items-center gap-3 rounded-2xl p-1.5 transition hover:bg-emerald-50',
        collapsed ? 'justify-center' : ''
      ]" aria-label="ПроТех76 - Панель администратора" @click="$emit('navigate')">
        <span class="grid size-11 place-items-center overflow-hidden rounded-[1.35rem] shadow-xl shadow-emerald-900/20 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
          <img src="/logo.png" alt="Логотип ПроТех76" class="size-full object-contain">
        </span>
        <span v-if="!collapsed" class="min-w-0 leading-tight">
          <span class="block truncate text-base font-semibold tracking-normal text-(--admin-text)">
            ПроТех76
          </span>
          <span class="block truncate text-[0.7rem] uppercase text-(--admin-text-muted)">
            Панель администратора
          </span>
        </span>
      </NuxtLink>

      <UTooltip v-if="!collapsed && showCollapse" text="Свернуть меню">
        <UButton color="neutral" variant="ghost" icon="i-lucide-panel-left-close" square
          class="admin-touch-icon rounded-full bg-[#f9fafb] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
          aria-label="Свернуть навигацию" @click="ui.toggleSidebar()" />
      </UTooltip>
    </div>

    <div v-if="!collapsed" class="px-3 py-3">
      <div class="rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
        <p class="text-xs font-semibold uppercase text-emerald-700">
          Рабочее пространство
        </p>
        <p class="mt-1 text-xs leading-5 text-zinc-500">
          Каталог, склад, продажи и поддержка.
        </p>
      </div>
    </div>

    <nav aria-label="Навигация администратора" :class="[
      'admin-muted-scroll flex-1 overflow-y-auto',
      collapsed ? 'px-2 py-3' : 'px-3 pb-4'
    ]">
      <div v-for="group in navGroups" :key="group.label" :class="[
        'mb-3 last:mb-0',
        collapsed ? '' : 'rounded-2xl bg-[#f9fafb]/70 p-2'
      ]">
        <p v-if="!collapsed" class="mb-1 px-2 text-[0.68rem] font-semibold uppercase text-zinc-400">
          {{ group.label }}
        </p>

        <div class="space-y-1.5">
          <UTooltip v-for="item in group.items" :key="item.to" :text="collapsed ? item.label : undefined"
            :content="{ side: 'right' }">
            <NuxtLink :to="item.to" :class="[
              'admin-sidebar-link group',
              isActive(item.to) ? 'is-active' : '',
              collapsed ? 'justify-center px-2' : ''
            ]" :aria-current="isActive(item.to) ? 'page' : undefined" @click="$emit('navigate')">
              <span :class="[
                'grid size-9 shrink-0 place-items-center rounded-xl transition',
                isActive(item.to)
                  ? 'bg-(--admin-accent) text-white shadow-lg shadow-emerald-950/15'
                  : 'bg-white text-zinc-400 shadow-sm shadow-zinc-950/5 group-hover:text-emerald-700'
              ]">
                <component :is="item.icon" class="size-4" />
              </span>
              <span v-if="!collapsed" class="truncate">
                {{ item.label }}
              </span>
            </NuxtLink>
          </UTooltip>
        </div>
      </div>
    </nav>

    <div v-if="showCollapse" :class="[
      'border-t border-zinc-100 p-3',
      collapsed ? 'space-y-2' : 'space-y-3'
    ]">
      <NuxtLink v-if="!collapsed" to="/"
        class="flex items-center gap-3 rounded-2xl bg-[#f9fafb] p-3 text-sm font-semibold text-zinc-700 shadow-inner shadow-zinc-950/5 transition hover:bg-emerald-50 hover:text-emerald-700"
        @click="$emit('navigate')">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm shadow-zinc-950/5">
          <Store class="size-5" />
        </span>
        <span class="min-w-0">
          <span class="block truncate">В магазин</span>
          <span class="block truncate text-xs font-medium text-zinc-400">Публичная витрина</span>
        </span>
      </NuxtLink>

      <div v-if="collapsed" class="flex flex-col items-center gap-2">
        <UTooltip text="В магазин">
          <UButton color="neutral" variant="ghost" icon="i-lucide-store" to="/" square
            class="admin-touch-icon rounded-full bg-[#f9fafb] text-zinc-500 hover:bg-zinc-100 hover:text-emerald-700"
            aria-label="В магазин" @click="$emit('navigate')" />
        </UTooltip>

        <UTooltip text="Развернуть меню">
          <UButton color="neutral" variant="ghost" icon="i-lucide-panel-left-open" square
            class="admin-touch-icon rounded-full bg-[#f9fafb] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
            aria-label="Развернуть навигацию" @click="ui.toggleSidebar()" />
        </UTooltip>
      </div>

      <button v-if="!collapsed" type="button"
        class="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
        @click="ui.toggleSidebar()">
        <PanelLeftClose class="size-4" />
        <span>Свернуть навигацию</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  BarChart3,
  ClipboardList,
  Layers3,
  MessageSquareText,
  MessagesSquare,
  PackageSearch,
  PanelLeftClose,
  Store,
  Users,
  Warehouse,
} from "@lucide/vue";
import { useAdminUiStore } from "~~/app/stores/adminUi";

const props = defineProps<{
  collapsed?: boolean;
  fluid?: boolean;
  showCollapse?: boolean;
}>();

defineEmits<{
  navigate: [];
}>();

const route = useRoute();
const ui = useAdminUiStore();

const navGroups = [
  {
    label: "Обзор",
    items: [
      { label: "Аналитика", to: "/admin", icon: BarChart3 }
    ]
  },
  {
    label: "Каталог",
    items: [
      { label: "Товары", to: "/admin/products", icon: PackageSearch },
      { label: "Остатки", to: "/admin/stock", icon: Warehouse },
      { label: "Справочники", to: "/admin/catalog", icon: Layers3 }
    ]
  },
  {
    label: "Операции",
    items: [
      { label: "Заказы", to: "/admin/orders", icon: ClipboardList },
      { label: "Сообщения", to: "/admin/messages", icon: MessagesSquare }
    ]
  },
  {
    label: "Контент",
    items: [
      { label: "Отзывы", to: "/admin/reviews", icon: MessageSquareText }
    ]
  },
  {
    label: "Система",
    items: [
      { label: "Пользователи", to: "/admin/users", icon: Users }
    ]
  }
];

function isActive(path: string) {
  if (path === "/admin") {
    return route.path === path;
  }

  return route.path.startsWith(path);
}

const collapsed = computed(() => props.collapsed ?? false);
const fluid = computed(() => props.fluid ?? false);
const showCollapse = computed(() => props.showCollapse ?? true);
</script>
