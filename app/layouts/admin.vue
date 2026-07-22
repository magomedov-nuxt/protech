<template>
  <div class="admin-shell min-h-screen" data-admin-theme>
    <div v-if="pending" class="grid min-h-screen place-items-center p-6">
      <UCard class="admin-card w-full max-w-md" :ui="{ body: 'p-6' }">
        <div class="flex items-center gap-4">
          <div class="admin-icon-tile-soft size-12">
            <LoaderCircle class="size-6 animate-spin" />
          </div>
          <div>
            <p class="font-semibold text-(--admin-text)">
              Загружаю админ-панель
            </p>
            <p class="mt-1 text-sm text-(--admin-text-muted)">
              Проверяю сессию администратора.
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div v-else-if="error" class="grid min-h-screen place-items-center p-6">
      <UCard class="admin-card w-full max-w-lg" :ui="{ body: 'p-7 sm:p-8' }">
        <div class="space-y-5 text-center">
          <div class="mx-auto grid size-14 place-items-center rounded-[1.35rem] bg-red-100 text-red-600">
            <LockKeyhole class="size-7" />
          </div>
          <div>
            <h1 class="text-xl font-semibold text-(--admin-text)">
              Доступ к админ-панели закрыт
            </h1>
            <p class="mt-2 text-sm leading-6 text-(--admin-text-muted)">
              Нужна активная сессия пользователя с ролью ADMIN. Backend уже защищает все admin endpoints, поэтому
              интерфейс не показывает данные без разрешения.
            </p>
          </div>
          <UButton color="primary" variant="solid" @click="refresh()">
            Повторить проверку
          </UButton>
        </div>
      </UCard>
    </div>

    <div v-else class="admin-layout" :class="{ 'is-sidebar-collapsed': ui.sidebarCollapsed }">
      <div class="hidden shrink-0 lg:block">
        <AdminSidebar :collapsed="ui.sidebarCollapsed" />
      </div>

      <div v-if="mobileMenuOpen" class="fixed inset-0 z-40 lg:hidden">
        <button class="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" aria-label="Закрыть навигацию"
          @click="mobileMenuOpen = false" />
        <div ref="mobileAdminPanel" aria-label="Административная навигация" aria-modal="true" role="dialog"
          tabindex="-1" class="relative h-full w-full max-w-76" @keydown.esc.prevent="mobileMenuOpen = false"
          @keydown.tab="trapMobileAdminFocus">
          <AdminSidebar fluid :show-collapse="false" @navigate="mobileMenuOpen = false" />
        </div>
      </div>

      <div class="admin-content">
        <AdminTopbar :user="data?.user" @open-menu="mobileMenuOpen = true" />
        <main class="admin-main">
          <div class="admin-container">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LoaderCircle, LockKeyhole } from "@lucide/vue";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { useAdminUiStore } from "~~/app/stores/adminUi";
import type { AdminUser } from "~~/app/shared/types/admin";

const ui = useAdminUiStore();
const mobileMenuOpen = ref(false);
const mobileAdminPanel = ref<HTMLElement | null>(null);
let lastAdminFocusedElement: HTMLElement | null = null;

const { data, pending, error, refresh } = await useAsyncData("admin-me", () =>
  adminFetch<{ user: AdminUser }>("/api/admin/me")
);

watch(mobileMenuOpen, async (open) => {
  if (!import.meta.client) {
    return;
  }

  if (open) {
    lastAdminFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    await nextTick();
    const focusable = getMobileAdminFocusableElements();
    (focusable[0] ?? mobileAdminPanel.value)?.focus();
    return;
  }

  lastAdminFocusedElement?.focus();
});

function getMobileAdminFocusableElements() {
  if (!mobileAdminPanel.value || !import.meta.client) {
    return [];
  }

  return Array.from(
    mobileAdminPanel.value.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )
  ).filter((element) =>
    !element.hasAttribute("disabled") &&
    element.tabIndex !== -1 &&
    window.getComputedStyle(element).visibility !== "hidden"
  );
}

function trapMobileAdminFocus(event: KeyboardEvent) {
  if (event.key !== "Tab") {
    return;
  }

  const focusable = getMobileAdminFocusableElements();

  if (!focusable.length) {
    event.preventDefault();
    mobileAdminPanel.value?.focus();
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
