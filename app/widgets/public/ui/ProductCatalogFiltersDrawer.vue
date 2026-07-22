<template>
  <UDrawer v-model:open="open" direction="right" :handle="false" :handle-only="true" :ui="drawerUi">
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs font-medium uppercase text-zinc-400">Расширенные</p>
          <h2 class="text-2xl font-semibold tracking-normal text-zinc-950 ">
            Фильтры
          </h2>
        </div>

        <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="lg" square
          class="!h-11 !w-11 rounded-full bg-zinc-100 hover:bg-zinc-200  " aria-label="Закрыть фильтры" @click="closeDrawer" />
      </div>
    </template>

    <template #body>
      <div class="space-y-8">
        <section class="rounded-[1.75rem] bg-[#f9fafb] p-4 shadow-sm shadow-zinc-950/5  ">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="font-semibold text-zinc-950">Цена</h3>
              <p class="mt-1 text-xs font-medium text-zinc-400 ">
                {{ availablePriceRangeLabel }}
              </p>
            </div>

            <div
              class="flex h-8 min-w-32 shrink-0 items-center justify-center rounded-full bg-white px-3 text-xs font-semibold text-zinc-700 shadow-sm shadow-zinc-950/5  ">
              <UIcon v-if="priceRangePending" name="i-lucide-loader-circle"
                class="size-3.5 animate-spin text-zinc-400" />
              <span v-else>{{ selectedPriceRangeLabel }}</span>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2.5">
            <label
              class="rounded-[1.25rem] bg-white px-3 py-2.5 shadow-sm shadow-zinc-950/5 transition-colors focus-within:bg-white ">
              <span class="text-[11px] font-semibold uppercase text-zinc-400">От</span>
              <UInput :model-value="priceMin" type="text" inputmode="numeric" :disabled="priceRangePending"
                variant="none" class="mt-1 w-full" :ui="priceInputUi"
                @update:model-value="$emit('setMinPrice', $event)" />
            </label>

            <label
              class="rounded-[1.25rem] bg-white px-3 py-2.5 shadow-sm shadow-zinc-950/5 transition-colors focus-within:bg-white ">
              <span class="text-[11px] font-semibold uppercase text-zinc-400">До</span>
              <UInput :model-value="priceMax" type="text" inputmode="numeric" :disabled="priceRangePending"
                variant="none" class="mt-1 w-full" :ui="priceInputUi"
                @update:model-value="$emit('setMaxPrice', $event)" />
            </label>
          </div>

          <div class="mt-4 rounded-[1.35rem] bg-white/80 px-4 py-4 shadow-sm shadow-zinc-950/5 ">
            <USlider v-model="priceRange" :disabled="priceRangePending || !hasPriceRange" :min="priceRangeMin"
              :max="sliderMax" :step="PRICE_FILTER_STEP" :min-steps-between-thumbs="0" color="primary" />

            <div class="mt-3 flex items-center justify-between text-xs font-medium text-zinc-400">
              <span>{{ formatCurrency(priceRangeMin) }}</span>
              <span>{{ formatCurrency(priceRangeMax) }}</span>
            </div>
          </div>
        </section>

        <div v-if="attributesPending" class="space-y-3">
          <USkeleton v-for="item in 4" :key="item" class="h-16 rounded-3xl" />
        </div>

        <template v-else>
          <section v-for="attribute in attributes" :key="attribute.id">
            <h3 class="font-semibold text-zinc-950 ">
              {{ attribute.name }}<span v-if="attribute.unit" class="text-zinc-400">, {{ attribute.unit }}</span>
            </h3>
            <div v-auto-animate class="mt-4 grid gap-3">
              <UCheckbox v-for="option in visibleAttributeValues(attribute)" :key="`${attribute.id}-${option.value}`"
                :label="option.value" :model-value="isAttributeSelected(attribute.id, option.value)" color="primary"
                class="rounded-2xl bg-[#f9fafb] p-4 "
                @update:model-value="$emit('toggleAttribute', attribute.id, option.value)">
                <template #label>
                  <span class="flex w-full items-center justify-between gap-3">
                    <span class="flex min-w-0 items-center gap-2">
                      <span v-if="isColorAttribute(attribute)" class="size-4 shrink-0 rounded-full ring-2 ring-white "
                        :style="{ backgroundColor: colorToCss(option.value) }" />
                      <span class="truncate">{{ option.value }}</span>
                    </span>
                    <span class="shrink-0 text-xs text-zinc-400">{{ option.count }}</span>
                  </span>
                </template>
              </UCheckbox>
            </div>

            <UButton v-if="attribute.values.length > PRODUCT_CATALOG_VISIBLE_FILTER_OPTIONS" color="neutral"
              variant="ghost" size="sm" class="mt-3 min-h-11 rounded-full px-3 text-zinc-500"
              :icon="isAttributeExpanded(attribute.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              @click="toggleAttributeExpanded(attribute.id)">
              {{ isAttributeExpanded(attribute.id) ? "Свернуть" : `Показать все (${attribute.values.length})` }}
            </UButton>
          </section>

          <p v-if="!attributes.length" class="rounded-3xl bg-[#f9fafb] p-5 text-sm leading-6 text-zinc-500  ">
            Для текущей категории пока нет дополнительных характеристик.
          </p>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center gap-3">
        <UButton color="neutral" variant="link" size="lg"
          class="min-h-11 shrink-0 rounded-full px-2 text-zinc-500 whitespace-nowrap" @click="$emit('clear')">
          Очистить
        </UButton>
        <UButton color="neutral" variant="solid" size="lg" icon="i-lucide-check" block class="min-h-12 rounded-full"
          @click="closeDrawer">
          Применить
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import {
  PRODUCT_CATALOG_VISIBLE_FILTER_OPTIONS,
  colorToCss,
  isColorAttribute
} from "~~/app/shared/lib/catalogProductHelpers";
import { formatCurrency } from "~~/app/shared/lib/shopFormatters";
import type { AttributeFilter } from "~~/app/shared/types/shop";
import type { ShopCatalogAttributeFilter } from "~~/app/stores/shopUi";

const props = defineProps<{
  attributes: AttributeFilter[];
  attributesPending: boolean;
  priceMax: number;
  priceMin: number;
  priceRangeMax: number;
  priceRangeMin: number;
  priceRangePending: boolean;
  selectedAttributes: ShopCatalogAttributeFilter[];
}>();

defineEmits<{
  clear: [];
  setMaxPrice: [value: string | number | null | undefined];
  setMinPrice: [value: string | number | null | undefined];
  toggleAttribute: [attributeId: number, value: string];
}>();

const open = defineModel<boolean>("open", { required: true });
const priceRange = defineModel<number[]>("priceRange", { required: true });
const expandedAttributeIds = ref<number[]>([]);
const PRICE_FILTER_STEP = 100;

const drawerUi = {
  overlay: "bg-zinc-950/25 backdrop-blur-sm",
  content: "w-[min(440px,calc(100vw-1rem))] max-w-none rounded-l-[2rem] bg-white shadow-2xl shadow-zinc-950/20 ring-0 ",
  container: "h-full gap-0 overflow-hidden p-0",
  header: "px-6 pb-4 pt-6",
  body: "min-h-0 flex-1 overflow-y-auto px-6 pb-8",
  footer: "bg-white/95 px-6 py-5 shadow-[0_-18px_40px_rgba(24,24,27,0.06)] backdrop-blur ",
};
const priceInputUi = {
  base: "h-7 rounded-none bg-transparent px-0 text-base font-semibold text-zinc-950 disabled:opacity-60 ",
};

const hasPriceRange = computed(() => props.priceRangeMax > props.priceRangeMin);
const sliderMax = computed(() =>
  hasPriceRange.value ? props.priceRangeMax : props.priceRangeMin + PRICE_FILTER_STEP
);
const selectedPriceRangeLabel = computed(() =>
  `${formatCurrency(props.priceMin)} - ${formatCurrency(props.priceMax)}`
);
const availablePriceRangeLabel = computed(() =>
  `${formatCurrency(props.priceRangeMin)} - ${formatCurrency(props.priceRangeMax)}`
);

function visibleAttributeValues(attribute: AttributeFilter) {
  return isAttributeExpanded(attribute.id)
    ? attribute.values
    : attribute.values.slice(0, PRODUCT_CATALOG_VISIBLE_FILTER_OPTIONS);
}

function isAttributeExpanded(attributeId: number) {
  return expandedAttributeIds.value.includes(attributeId);
}

function toggleAttributeExpanded(attributeId: number) {
  expandedAttributeIds.value = isAttributeExpanded(attributeId)
    ? expandedAttributeIds.value.filter((id) => id !== attributeId)
    : [...expandedAttributeIds.value, attributeId];
}

function isAttributeSelected(attributeId: number, value: string) {
  return props.selectedAttributes.some((item) =>
    item.attributeId === attributeId && item.value === value
  );
}

function closeDrawer() {
  open.value = false;
}
</script>
