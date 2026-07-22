<template>
  <section class="space-y-5 rounded-3xl bg-white p-4 shadow-sm shadow-zinc-950/5 ring-1 ring-zinc-200/70 sm:p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-start gap-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-700">
          <UIcon name="i-lucide-list-checks"
            class="size-5"
          />
        </span>
        <div>
          <h3 class="text-lg font-semibold text-zinc-950">
            Характеристики
          </h3>
          <p class="mt-1 text-sm leading-6 text-zinc-500">
            Значения будут заменены при сохранении товара.
          </p>
        </div>
      </div>
      <UButton color="primary"
        variant="soft"
        type="button"
        size="lg"
        class="min-h-11 rounded-full px-5"
        @click="emit('add')"
      >
        <Plus class="size-4" />
        Добавить
      </UButton>
    </div>

    <UAlert v-if="error"
      color="error"
      variant="soft"
      :description="error"
      class="rounded-2xl"
    />

    <div class="space-y-4">
      <div v-for="(attribute, index) in attributes"
        :key="index"
        class="rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-zinc-500">
            Характеристика {{ index + 1 }}
          </p>
          <UTooltip text="Удалить характеристику">
            <UButton color="error"
              variant="ghost"
              type="button"
              size="md"
              square
              class="admin-touch-icon rounded-full bg-white shadow-sm shadow-zinc-950/5"
              aria-label="Удалить характеристику"
              @click="emit('remove', index)"
            >
              <Trash2 class="size-4" />
            </UButton>
          </UTooltip>
        </div>
        <div class="grid gap-3 lg:grid-cols-2">
          <UFormField label="Характеристика">
            <USelect :model-value="attribute.attributeId"
              class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
              size="xl"
              color="neutral"
              variant="none"
              :content="selectContent"
              :items="attributeItems"
              placeholder="Выберите характеристику"
              :ui="selectUi"
              @update:model-value="emit('select', index, $event)"
            />
          </UFormField>
          <UFormField label="Значение">
            <UInput :model-value="attribute.value"
              class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
              size="xl"
              variant="none"
              placeholder="Значение"
              :ui="inputUi"
              @update:model-value="emit('updateValue', index, String($event ?? ''))"
            />
          </UFormField>
        </div>
      </div>

      <div v-if="!attributes.length"
        class="grid min-h-24 place-items-center rounded-2xl bg-[#f9fafb] px-4 text-center text-sm leading-6 text-zinc-500"
      >
        Добавьте характеристику или создайте новую через селектор.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from "@lucide/vue";
import type { ProductFormState } from "~~/app/shared/types/admin";

type SelectValue = number | string | null | undefined;
type SelectItem = {
  class?: string;
  label?: string;
  type?: "separator";
  value?: number | string;
};

defineProps<{
  attributeItems: SelectItem[];
  attributes: ProductFormState["productAttributes"];
  error?: string;
}>();

const inputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-900"
};
const selectContent = {
  bodyLock: false,
  collisionPadding: 12
};
const selectUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-900",
  content: "max-w-[min(30rem,calc(100vw-1rem))] rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0",
  item: "rounded-xl",
  itemLabel: "truncate",
  value: "truncate",
  viewport: "max-h-72 p-1"
};

const emit = defineEmits<{
  add: [];
  remove: [index: number];
  select: [index: number, value: SelectValue];
  updateValue: [index: number, value: string];
}>();
</script>
