<template>
  <form class="rounded-2xl bg-[#f9fafb] p-4 shadow-inner shadow-zinc-950/5"
    @submit.prevent="$emit('submit')"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-base font-semibold text-zinc-950">
          {{ title }}
        </p>
        <p v-if="hint"
          class="mt-1 text-sm leading-6 text-zinc-500"
        >
          {{ hint }}
        </p>
      </div>
      <UBadge color="primary"
        variant="soft"
        class="w-fit rounded-full px-3 py-1"
      >
        {{ badgeLabel }}
      </UBadge>
    </div>

    <div class="mt-4 rounded-2xl bg-white p-1.5 shadow-sm shadow-zinc-950/5">
      <UTextarea :model-value="modelValue"
        class="w-full"
        size="lg"
        :placeholder="placeholder"
        autoresize
        :rows="rows"
        variant="none"
        :ui="textareaUi"
        @update:model-value="$emit('update:modelValue', String($event ?? ''))"
      />
    </div>

    <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-xs leading-5 text-zinc-500">
        {{ footerHint }}
      </p>
      <UButton color="primary"
        icon="i-lucide-send"
        type="submit"
        class="min-h-11 justify-center rounded-full px-5 shadow-lg shadow-emerald-950/10"
        :loading="loading"
        :disabled="!(modelValue ?? '').trim()"
      >
        {{ buttonLabel }}
      </UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string;
  loading?: boolean;
  placeholder?: string;
  buttonLabel?: string;
  title?: string;
  hint?: string;
  badgeLabel?: string;
  footerHint?: string;
  rows?: number;
}>(), {
  modelValue: "",
  placeholder: "Введите ответ",
  buttonLabel: "Ответить",
  title: "Ответ пользователю",
  hint: "",
  badgeLabel: "Публичный ответ",
  footerHint: "Ответ сохранится в карточке обращения и будет виден пользователю.",
  rows: 4
});

defineEmits<{
  "update:modelValue": [value: string];
  submit: [];
}>();

const textareaUi = {
  base: "min-h-32 resize-y rounded-2xl bg-transparent text-sm leading-6 text-zinc-900"
};
</script>
