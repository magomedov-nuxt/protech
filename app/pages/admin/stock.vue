<template>
  <div class="stock-shop-page space-y-5">
    <AdminPageHeader title="Остатки" kicker="Склад"
      description="Контроль доступности товаров, быстрые корректировки и подсветка критических остатков.">
      <template #actions>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="pending" @click="refresh()">
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <UCard class="admin-list-card" :ui="{ body: 'p-0' }">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <p class="admin-section-heading">
            Приход на склад
          </p>
          <p class="admin-section-copy">
            Быстро соберите поставку из нескольких товаров и примените остатки одной операцией.
          </p>
        </div>
        <UBadge color="neutral" variant="soft" class="rounded-full px-3 py-1">
          {{ arrivalItems.length }} в приходе
        </UBadge>
      </div>

      <div class="space-y-5 bg-[#f9fafb] p-4 sm:p-5">
        <div class="grid gap-4 xl:items-end">
          <div class="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <UButton color="neutral" variant="ghost" size="lg"
              class="h-12 justify-center rounded-full bg-white px-5 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
              @click="addArrivalItem">
              <Plus class="size-4" />
              Добавить товар
            </UButton>
            <UButton color="primary" size="lg"
              class="h-12 justify-center rounded-full px-5 shadow-lg shadow-emerald-950/10"
              :disabled="!arrivalItems.length" :loading="arrivalSubmitting" @click="submitArrival">
              <PackagePlus class="size-4" />
              Принять приход
            </UButton>
          </div>
        </div>

        <div v-if="arrivalItems.length" class="space-y-3">
          <div v-for="item in arrivalItems" :key="item.id"
            class="grid gap-3 rounded-[1.5rem] bg-white p-4 shadow-[0_18px_50px_rgba(24,24,27,0.08)] ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(24,24,27,0.12)] lg:grid-cols-[minmax(0,1fr)_160px_180px_auto] lg:items-end">
            <UFormField label="Товар">
              <USelect :model-value="item.productId"
                class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5" size="lg" color="neutral"
                variant="none" icon="i-lucide-package-search" :content="stockSelectContent" :items="arrivalProductItems"
                placeholder="Выберите товар" :ui="stockSelectUi"
                @update:model-value="(value) => updateArrivalProduct(item.id, value)" />
            </UFormField>
            <UFormField label="Количество">
              <UInput v-model.number="item.quantityDelta" size="lg" type="number" min="1"
                class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5" variant="none"
                :ui="stockInputUi" />
            </UFormField>

            <div class="min-w-0">
              <p :id="`arrival-result-label-${item.id}`" class="mb-1.5 block text-sm font-medium text-zinc-700">
                Сейчас / будет
              </p>

              <div class="flex h-12 items-center rounded-2xl bg-[#f9fafb] px-4
             shadow-inner shadow-zinc-950/5" role="status" :aria-labelledby="`arrival-result-label-${item.id}`"
                aria-live="polite">
                <p class="truncate text-sm font-semibold text-zinc-950">
                  {{ getArrivalCurrentQuantity(item.productId) }}

                  <span class="mx-1 text-zinc-300" aria-hidden="true">
                    →
                  </span>

                  <span class="text-emerald-600">
                    {{ getArrivalNextQuantity(item) }} шт.
                  </span>
                </p>
              </div>
            </div>

            <UTooltip text="Убрать из прихода">
              <UButton size="xl" color="error" variant="ghost" class="admin-touch-icon rounded-2xl bg-[#f9fafb]" type="button" square
                aria-label="Убрать товар из прихода" @click="removeArrivalItem(item.id)">
                <Trash2 class="size-5" />
              </UButton>
            </UTooltip>
          </div>
        </div>

        <div v-else
          class="grid min-h-24 place-items-center rounded-2xl bg-white px-4 text-center text-sm leading-6 text-(--admin-text-muted) shadow-sm shadow-zinc-950/5">
          Нажмите «Добавить товар», чтобы создать строку прихода.
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-(--admin-text-muted)">
          <span>Товаров в приходе: {{ arrivalItems.length }}</span>
          <span>Всего будет добавлено: {{ formatNumber(arrivalTotalQuantity) }} шт.</span>
        </div>
      </div>
    </UCard>

    <section class="rounded-3xl bg-white/90 p-4 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur sm:p-5">
      <label class="block rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
        <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Поиск по остаткам</span>
        <UInput v-model="search" class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5" size="lg"
          variant="none" :ui="stockInputUi" placeholder="Название или артикул">
          <template #leading>
            <Search class="size-4 text-zinc-400" />
          </template>
        </UInput>
      </label>
    </section>

    <UAlert v-if="error" color="error" variant="soft" title="Не удалось загрузить остатки"
      :description="getErrorMessage(error)" class="rounded-2xl" />

    <UCard class="admin-list-card" :ui="{ body: 'p-0' }">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <p class="admin-section-heading">
            Остатки товаров
          </p>
          <p class="admin-section-copy">
            Редактирование текущего количества без перехода в карточку товара.
          </p>
        </div>
        <UBadge color="neutral" variant="soft" class="rounded-full px-3 py-1">
          {{ filteredStocks.length }} позиций
        </UBadge>
      </div>

      <div v-if="filteredStocks.length" class="grid gap-3 bg-[#f9fafb] p-3 sm:grid-cols-2 sm:p-4 2xl:grid-cols-4">
        <article v-for="stock in filteredStocks" :key="stock.product.id"
          class="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_50px_rgba(24,24,27,0.08)] ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(24,24,27,0.12)]">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="line-clamp-2 font-semibold leading-6 text-zinc-950">
                {{ stock.product.name }}
              </p>
              <p class="mt-1 truncate text-xs font-medium uppercase text-zinc-400">
                {{ stock.product.article }}
              </p>
            </div>
            <AdminStatusBadge type="stock" :value="stock.quantity" class="shrink-0" />
          </div>

          <div class="mt-4 grid gap-3">
            <div class="rounded-2xl bg-[#f9fafb] p-3">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Текущий остаток
              </p>
              <p class="mt-2 text-lg font-semibold text-zinc-950">
                {{ stock.quantity }} шт.
              </p>
            </div>

            <label class="block rounded-2xl bg-[#f9fafb] p-3">
              <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">Новый остаток (укажите актуальный
                остаток)</span>
              <UInput v-model.number="draftQuantities[stock.product.id]" size="lg" type="number" min="0"
                class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5" variant="none" :ui="stockInputUi" />
            </label>

            <div class="rounded-2xl bg-[#f9fafb] p-3">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Обновлено
              </p>
              <p class="mt-2 text-sm font-medium text-zinc-700">
                {{ formatDate(stock.updatedAt) }}
              </p>
            </div>
          </div>

          <UButton color="primary" variant="soft" icon="i-lucide-save"
            class="mt-4 min-h-11 w-full justify-center rounded-full" :loading="savingId === stock.product.id"
            :disabled="draftQuantities[stock.product.id] === stock.quantity" @click="saveStock(stock)">
            Сохранить
          </UButton>
        </article>
      </div>

      <AdminEmptyState v-if="!filteredStocks.length && !pending" title="Остатки не найдены"
        description="Попробуйте изменить поисковый запрос.">
        <template #icon>
          <Warehouse class="size-6" />
        </template>
      </AdminEmptyState>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { PackagePlus, Plus, Search, Trash2, Warehouse } from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { formatDate, formatNumber, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { getZodFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { ProductStock } from "~~/app/shared/types/admin";
import { bulkStockArrivalSchema } from "~~/shared/schemas/admin/products/bulkStockArrival";
import { updateProductStockSchema } from "~~/shared/schemas/admin/products/updateProductStock";

type ArrivalDraftItem = {
  id: number;
  productId: number | undefined;
  quantityDelta: number | null;
};

definePageMeta({
  layout: "admin"
});

const search = ref("");
const arrivalReason = ref("");
const arrivalSubmitting = ref(false);
const arrivalItems = ref<ArrivalDraftItem[]>([]);
const savingId = ref<number | null>(null);
const draftQuantities = reactive<Record<number, number>>({});
let arrivalDraftId = 0;

const stockInputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-700"
};
const stockSelectContent = {
  bodyLock: false,
  collisionPadding: 12
};
const stockSelectUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-700",
  content: "max-w-[min(34rem,calc(100vw-1rem))] rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0",
  item: "rounded-xl",
  itemLabel: "truncate",
  value: "truncate",
  viewport: "max-h-80 p-1"
};

const { data, pending, error, refresh } = await useAsyncData("admin-product-stocks", () => adminFetch<ProductStock[]>("/api/admin/products/stock"));

const stocks = computed(() => data.value ?? []);

const filteredStocks = computed(() => {
  const query = search.value.trim().toLowerCase();

  if (!query) {
    return stocks.value;
  }

  return stocks.value.filter((stock) =>
    stock.product.name.toLowerCase().includes(query) ||
    stock.product.article.toLowerCase().includes(query)
  );
});
const arrivalProductItems = computed(() =>
  stocks.value.map((stock) => ({
    label: `${stock.product.name} · ${stock.product.article}`,
    value: stock.product.id
  }))
);
const stockByProductId = computed(() => new Map(stocks.value.map((stock) => [stock.product.id, stock])));
const arrivalTotalQuantity = computed(() =>
  arrivalItems.value.reduce((total, item) => total + Math.max(0, Number(item.quantityDelta ?? 0)), 0)
);

watch(stocks, (items) => {
  const nextStockByProductId = new Map(items.map((stock) => [stock.product.id, stock]));

  for (const stock of items) {
    draftQuantities[stock.product.id] = stock.quantity;
  }

  arrivalItems.value = arrivalItems.value.filter((item) =>
    !item.productId || nextStockByProductId.has(item.productId)
  );
}, { immediate: true });

function toPositiveInt(value: unknown) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : undefined;
}

function addArrivalItem() {
  arrivalItems.value.push({
    id: ++arrivalDraftId,
    productId: undefined,
    quantityDelta: 1
  });
}

function updateArrivalProduct(itemId: number, value: unknown) {
  const productId = toPositiveInt(value);
  const target = arrivalItems.value.find((item) => item.id === itemId);

  if (!target) {
    return;
  }

  if (productId && arrivalItems.value.some((item) => item.id !== itemId && item.productId === productId)) {
    toast.error("Этот товар уже добавлен в приход");
    return;
  }

  target.productId = productId;
}

function removeArrivalItem(itemId: number) {
  arrivalItems.value = arrivalItems.value.filter((item) => item.id !== itemId);
}

function getArrivalCurrentQuantity(productId: number | undefined) {
  return productId ? stockByProductId.value.get(productId)?.quantity ?? 0 : 0;
}

function getArrivalNextQuantity(item: ArrivalDraftItem) {
  return getArrivalCurrentQuantity(item.productId) + Math.max(0, Number(item.quantityDelta ?? 0));
}

async function submitArrival() {
  if (arrivalItems.value.some((item) => !item.productId)) {
    toast.error("Выберите товар в каждой строке прихода");
    return;
  }

  const arrivals = arrivalItems.value.map((item) => ({
    productId: item.productId,
    quantityDelta: item.quantityDelta
  }));
  const parsed = bulkStockArrivalSchema.safeParse({
    arrivals,
    reason: arrivalReason.value.trim() || undefined
  });

  if (!parsed.success) {
    const errors = getZodFieldErrors(parsed.error);
    toast.error(errors.arrivals ?? errors.quantityDelta ?? errors.reason ?? "Проверьте товары и количество прихода");
    return;
  }

  arrivalSubmitting.value = true;

  try {
    const result = await adminFetch<{ count: number; quantityDeltaTotal: number }>("/api/admin/products/stock/bulk", {
      method: "POST",
      body: parsed.data
    });
    toast.success(`Приход принят: ${result.count} позиций, ${formatNumber(result.quantityDeltaTotal)} шт.`);
    arrivalItems.value = [];
    arrivalReason.value = "";
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось принять приход"));
  } finally {
    arrivalSubmitting.value = false;
  }
}

async function saveStock(stock: ProductStock) {
  const nextQuantity = Number(draftQuantities[stock.product.id] ?? 0);
  const parsed = updateProductStockSchema.safeParse({ quantity: nextQuantity });

  if (!parsed.success) {
    toast.error(getZodFieldErrors(parsed.error).quantity ?? "Проверьте остаток");
    return;
  }

  savingId.value = stock.product.id;

  try {
    await adminFetch(`/api/admin/products/stock/update/${stock.product.id}`, {
      method: "POST",
      body: parsed.data
    });
    toast.success("Остаток обновлён");
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить остаток"));
  } finally {
    savingId.value = null;
  }
}
</script>
