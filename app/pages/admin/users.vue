<template>
  <div class="users-shop-page space-y-5">
    <AdminPageHeader title="Пользователи" kicker="Доступ"
      description="Роли зарегистрированных аккаунтов, активность покупателей и быстрый доступ к правам администратора.">
      <template #actions>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="pending" @click="refresh()">
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <section class="rounded-3xl bg-white/90 p-4 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur sm:p-5">
      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,18rem)]">
        <label class="block min-w-0 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
          <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Поиск</span>
          <UInput v-model="search" class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5" size="lg"
            variant="none" :ui="usersInputUi" placeholder="Имя или email">
            <template #leading>
              <Search class="size-4 text-zinc-400" />
            </template>
          </UInput>
        </label>
        <label class="block min-w-0 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
          <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Роль</span>
          <USelect v-model="role" class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5" size="lg"
            color="neutral" variant="none" icon="i-lucide-shield-check" :content="usersSelectContent"
            :items="roleFilterItems" :ui="usersSelectUi" />
        </label>
      </div>
    </section>

    <UAlert v-if="error" color="error" variant="soft" title="Не удалось загрузить пользователей"
      :description="getErrorMessage(error)" class="rounded-2xl" />

    <section class="admin-list-card">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <p class="admin-section-heading">
            Аккаунты и роли
          </p>
          <p class="admin-section-copy">
            Управляйте правами доступа и быстро оценивайте активность покупателей.
          </p>
        </div>
        <UBadge color="neutral" variant="soft" class="rounded-full px-3 py-1">
          {{ users.length }} на странице
        </UBadge>
      </div>

      <div v-if="users.length" class="grid gap-3 bg-[#f9fafb] p-3 sm:p-4 xl:grid-cols-2 2xl:grid-cols-3">
        <article v-for="user in users" :key="user.id"
          class="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_50px_rgba(24,24,27,0.08)] ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(24,24,27,0.12)]">
          <div class="flex items-start gap-3">
            <img v-if="user.image" :src="user.image" alt="" class="size-12 rounded-2xl object-cover">
            <div v-else class="admin-avatar size-12 shrink-0 text-sm">
              {{ getInitials(user.name || user.email) }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate font-semibold text-zinc-950">
                  {{ user.name || "Без имени" }}
                </p>
                <UBadge :color="roleColor(user.role)" variant="soft" class="rounded-full px-3 py-1">
                  {{ roleLabels[user.role] }}
                </UBadge>
              </div>
              <p class="mt-1 truncate text-sm text-zinc-500">
                {{ user.email }}
              </p>
            </div>
          </div>

          <div class="mt-4 grid gap-3">
            <label class="block rounded-2xl bg-[#f9fafb] p-3">
              <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">Роль</span>
              <USelect :model-value="user.role" class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
                size="lg" color="neutral" variant="none" :content="usersSelectContent" :items="roleItems"
                :ui="usersSelectUi" :disabled="savingUserId === user.id"
                @update:model-value="(value) => updateRole(user, value)" />
            </label>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div class="rounded-2xl bg-[#f9fafb] p-3">
                <p class="text-xs font-semibold uppercase text-zinc-400">
                  Подтверждение
                </p>
                <div class="mt-2">
                  <AdminStatusBadge type="boolean" :value="user.emailVerified" true-label="Подтвержден"
                    false-label="Не подтвержден" />
                </div>
              </div>

              <div class="rounded-2xl bg-[#f9fafb] p-3">
                <p class="text-xs font-semibold uppercase text-zinc-400">
                  Активность
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm shadow-zinc-950/5">
                    {{ user._count.orders }} заказов
                  </span>
                  <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm shadow-zinc-950/5">
                    {{ user._count.message }} сообщений
                  </span>
                  <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm shadow-zinc-950/5">
                    {{ user._count.reviews }} отзывов
                  </span>
                </div>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div class="rounded-2xl bg-[#f9fafb] p-3">
                <p class="text-xs font-semibold uppercase text-zinc-400">
                  Создан
                </p>
                <p class="mt-2 text-sm font-medium text-zinc-700">
                  {{ formatDate(user.createdAt) }}
                </p>
              </div>
              <div class="rounded-2xl bg-[#f9fafb] p-3">
                <p class="text-xs font-semibold uppercase text-zinc-400">
                  Обновлён
                </p>
                <p class="mt-2 text-sm font-medium text-zinc-700">
                  {{ formatDate(user.updatedAt) }}
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>

      <AdminEmptyState v-if="!users.length && !pending" title="Пользователи не найдены"
        description="Измените фильтры или поисковый запрос.">
        <template #icon>
          <Users class="size-6" />
        </template>
      </AdminEmptyState>

      <AdminPagination v-if="usersData?.pagination" :pagination="usersData.pagination" :loading="pending"
        @update:page="page = $event" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { Search, Users } from "@lucide/vue";
import { watchDebounced } from "@vueuse/core";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { buildQuery, formatDate, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { getZodFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { AdminUserListItem, PaginatedResponse, UserRole } from "~~/app/shared/types/admin";
import { updateUserRoleSchema } from "~~/shared/schemas/admin/users/updateUserRole";

definePageMeta({
  layout: "admin"
});

type RoleFilter = UserRole | "all";

const roleLabels: Record<UserRole, string> = {
  USER: "Пользователь",
  ADMIN: "Администратор"
};

const page = ref(1);
const search = ref("");
const debouncedSearch = ref("");
const role = ref<RoleFilter>("all");
const savingUserId = ref<string | null>(null);

const usersSelectContent = {
  bodyLock: false,
  collisionPadding: 12
};
const usersSelectUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-700",
  content: "max-w-[min(28rem,calc(100vw-1rem))] rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0",
  item: "rounded-xl",
  itemLabel: "truncate",
  value: "truncate",
  viewport: "max-h-72 p-1"
};
const usersInputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-700"
};

watchDebounced(search, (value) => {
  debouncedSearch.value = value;
  page.value = 1;
}, { debounce: 350, maxWait: 1000 });

watch(role, () => {
  page.value = 1;
});

const query = computed(() => buildQuery({
  page: page.value,
  search: debouncedSearch.value,
  role: role.value === "all" ? null : role.value
}));

const { data: usersData, pending, error, refresh } = await useAsyncData(
  "admin-users-list",
  () => adminFetch<PaginatedResponse<AdminUserListItem>>(`/api/admin/users${query.value}`),
  { watch: [query] }
);

const users = computed(() => usersData.value?.items ?? []);

const roleItems = Object.entries(roleLabels).map(([value, label]) => ({ value, label }));
const roleFilterItems = [
  { value: "all", label: "Все" },
  ...roleItems
];

function roleColor(userRole: UserRole) {
  return userRole === "ADMIN" ? "primary" : "neutral";
}

function getInitials(value: string) {
  return value
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function updateRole(user: AdminUserListItem, value: unknown) {
  const roleValue = value as UserRole;

  if (!roleValue || roleValue === user.role) {
    return;
  }

  const parsed = updateUserRoleSchema.safeParse({ role: roleValue });

  if (!parsed.success) {
    toast.error(getZodFieldErrors(parsed.error).role ?? "Проверьте роль пользователя");
    return;
  }

  savingUserId.value = user.id;

  try {
    await adminFetch(`/api/admin/users/${user.id}/role`, {
      method: "POST",
      body: parsed.data
    });
    toast.success("Роль пользователя обновлена");
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить роль пользователя"));
  } finally {
    savingUserId.value = null;
  }
}
</script>
