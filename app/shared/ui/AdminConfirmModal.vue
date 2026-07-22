<template>
  <UModal v-model:open="open" :title="title" :description="description" :ui="confirmModalUi">
    <template #body>
      <div class="flex gap-4">
        <div :class="[
          'grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm',
          color === 'error'
            ? 'bg-red-100 text-red-600'
            : 'bg-(--admin-accent-soft) text-(--admin-accent)'
        ]">
          <AlertTriangle v-if="color === 'error'" class="size-6" />
          <CheckCircle2 v-else class="size-6" />
        </div>
        <div class="min-w-0 space-y-2">
          <p class="text-base leading-7 text-zinc-900">
            {{ message }}
          </p>
          <p v-if="hint" class="text-sm leading-6 text-zinc-500">
            {{ hint }}
          </p>
        </div>
      </div>

      <div v-if="requiresVerification" class="mt-5 rounded-2xl bg-red-50/80 p-4 ring-1 ring-red-100">
        <p class="text-sm font-semibold text-red-700">
          Защита от случайного удаления
        </p>
        <p class="mt-1 text-sm leading-6 text-red-700/80">
          {{ verificationLabel }}
        </p>
        <div class="mt-3 rounded-xl bg-white p-1.5 shadow-sm shadow-red-950/5">
          <UInput v-model="verificationValue" class="w-full" size="lg" variant="none"
            :placeholder="verificationPlaceholder || verificationText"
            :ui="{ base: 'h-11 rounded-xl bg-transparent font-medium text-zinc-900' }" />
        </div>
        <p v-if="verificationValue && !verificationMatches" class="mt-2 text-xs font-medium text-red-600">
          Контрольный текст пока не совпадает.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton color="neutral" variant="ghost" class="min-h-11 justify-center rounded-full px-5" :disabled="loading"
          @click="close">
          {{ cancelLabel }}
        </UButton>
        <UButton :color="color" class="min-h-11 justify-center rounded-full px-5" :loading="loading"
          :disabled="verificationBlocked" @click="$emit('confirm')">
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { AlertTriangle, CheckCircle2 } from "@lucide/vue";

const open = defineModel<boolean>("open", { default: false });

const props = withDefaults(defineProps<{
  title: string;
  description?: string;
  message: string;
  hint?: string;
  verificationLabel?: string;
  verificationPlaceholder?: string;
  verificationText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  color?: "primary" | "error";
  loading?: boolean;
}>(), {
  description: undefined,
  hint: undefined,
  verificationLabel: "Введите контрольный текст",
  verificationPlaceholder: undefined,
  verificationText: "",
  confirmLabel: "Подтвердить",
  cancelLabel: "Отмена",
  color: "primary",
  loading: false
});

defineEmits<{
  confirm: [];
}>();

function close() {
  open.value = false;
}

const confirmModalUi = {
  content: "max-h-[calc(100dvh-2rem)] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-zinc-950/20 ring-0",
  header: "shrink-0 px-5 pb-3 pt-5 sm:px-6",
  body: "min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6",
  footer: "shrink-0 border-t border-zinc-100 bg-[#f9fafb] px-5 py-4 sm:px-6"
};
const verificationValue = ref("");
const requiresVerification = computed(() => props.verificationText.trim().length > 0);
const verificationMatches = computed(() =>
  !requiresVerification.value ||
  verificationValue.value.trim() === props.verificationText.trim()
);
const verificationBlocked = computed(() => requiresVerification.value && !verificationMatches.value);

watch(
  () => [open.value, props.verificationText],
  () => {
    verificationValue.value = "";
  }
);
</script>
