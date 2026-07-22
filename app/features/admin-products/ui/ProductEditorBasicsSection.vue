<template>
  <div class="space-y-5">
    <UFormField label="Название"
      required
      :error="fieldErrors.name"
    >
      <UInput :model-value="form.name"
        class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5"
        size="xl"
        variant="none"
        placeholder="Например, Аккумулятор ProTech X"
        :ui="inputUi"
        @update:model-value="emit('updateField', 'name', String($event ?? ''))"
      />
    </UFormField>

    <div class="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <UFormField label="Артикул"
        required
        :error="fieldErrors.article"
      >
        <UInput :model-value="form.article"
          class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5"
          size="xl"
          variant="none"
          placeholder="PT-X-001"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'article', String($event ?? ''))"
        />
      </UFormField>

      <UFormField label="Категория"
        required
        :error="fieldErrors.categoryId"
      >
        <USelect :model-value="form.categoryId"
          class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5"
          size="xl"
          color="neutral"
          variant="none"
          :content="selectContent"
          :items="categoryItems"
          placeholder="Выберите категорию"
          :ui="selectUi"
          @update:model-value="emit('selectCategory', $event)"
        />
      </UFormField>
    </div>

    <UFormField label="Описание"
      required
      :error="fieldErrors.description"
    >
      <UTextarea :model-value="form.description"
        class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5"
        size="xl"
        variant="none"
        autoresize
        :rows="5"
        :maxrows="14"
        :ui="textareaUi"
        placeholder="Коротко опишите свойства, комплектацию и назначение товара"
        @update:model-value="emit('updateField', 'description', String($event ?? ''))"
      />
    </UFormField>

    <div class="grid gap-5 lg:grid-cols-3">
      <UFormField label="Цена"
        required
        :error="fieldErrors.currentPrice"
      >
        <UInput :model-value="form.currentPrice"
          class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5"
          size="xl"
          variant="none"
          type="number"
          min="0"
          step="0.01"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'currentPrice', toNumberValue($event))"
        />
      </UFormField>

      <UFormField label="Себестоимость"
        :error="fieldErrors.costPrice"
      >
        <UInput :model-value="form.costPrice"
          class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5"
          size="xl"
          variant="none"
          type="number"
          min="0"
          step="0.01"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'costPrice', toNumberValue($event))"
        />
      </UFormField>

      <UFormField label="Старая цена"
        :error="fieldErrors.oldPrice"
      >
        <UInput :model-value="form.oldPrice"
          class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5"
          size="xl"
          variant="none"
          type="number"
          min="0"
          step="0.01"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'oldPrice', toNumberValue($event))"
        />
      </UFormField>
    </div>

    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
      <UFormField label="Ссылка OZON"
        :error="fieldErrors.ozonLink"
      >
        <UInput :model-value="form.ozonLink"
          class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5"
          size="xl"
          variant="none"
          placeholder="https://www.ozon.ru/..."
          :ui="inputUi"
          @update:model-value="emit('updateField', 'ozonLink', String($event ?? ''))"
        />
      </UFormField>

      <div class="rounded-2xl bg-[#f9fafb] p-4 shadow-inner shadow-zinc-950/5 sm:p-5">
        <USwitch :model-value="form.isActive"
          label="Товар активен"
          description="Показывать товар в публичном каталоге"
          @update:model-value="emit('updateField', 'isActive', Boolean($event))"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductFormState } from "~~/app/shared/types/admin";

export type ProductEditorField =
  | "name"
  | "article"
  | "description"
  | "currentPrice"
  | "costPrice"
  | "oldPrice"
  | "ozonLink"
  | "isActive";

export type ProductEditorFieldValue = ProductFormState[ProductEditorField];
type SelectValue = number | string | null | undefined;
type SelectItem = {
  class?: string;
  label?: string;
  type?: "separator";
  value?: number | string;
};

defineProps<{
  categoryItems: SelectItem[];
  fieldErrors: Record<string, string | undefined>;
  form: ProductFormState;
}>();

const inputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-900"
};
const textareaUi = {
  base: "min-h-32 rounded-2xl bg-transparent text-base leading-7 text-zinc-900"
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
  selectCategory: [value: SelectValue];
  updateField: [field: ProductEditorField, value: ProductEditorFieldValue];
}>();

function toNumberValue(value: string | number | null | undefined) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}
</script>
