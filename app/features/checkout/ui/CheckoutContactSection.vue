<template>
  <section class="rounded-[1.75rem] bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.06)] sm:p-5  ">
    <div class="flex items-center gap-3">
      <span class="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-700  ">
        <UIcon name="i-lucide-phone"
          class="size-4.5"
        />
      </span>
      <div>
        <h2 class="text-base font-semibold tracking-normal text-zinc-950">Контакты</h2>
        <p class="mt-0.5 text-xs text-zinc-500">Телефон нужен для подтверждения и связи по заказу.</p>
      </div>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-end">
      <UFormField label="Телефон"
        :error="customerPhoneError"
        required
      >
        <UInput :model-value="phone"
          autocomplete="tel"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          inputmode="tel"
          placeholder="+7 900 000-00-00"
          size="md"
          type="tel"
          variant="none"
          :ui="inputUi"
          @update:model-value="emit('updatePhone', String($event ?? ''))"
        />
      </UFormField>
      <p class="text-xs leading-5 text-zinc-500 ">
        Для подтверждения заказа и уточнений по получению.
      </p>
    </div>

    <label class="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-[1.25rem] bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5 transition duration-300 hover:bg-white">
      <span class="flex min-w-0 items-center gap-3">
        <span class="grid size-9 shrink-0 place-items-center rounded-full bg-white text-zinc-600 shadow-sm shadow-zinc-950/5">
          <UIcon name="i-lucide-user-round-check"
            class="size-4.5"
          />
        </span>
        <span>
          <span class="block text-sm font-semibold text-zinc-950">Заказ получит другой человек</span>
          <span class="mt-0.5 block text-xs leading-5 text-zinc-500">Укажем отдельные имя и телефон получателя.</span>
        </span>
      </span>
      <input :checked="recipientIsAnotherPerson"
        class="size-5 shrink-0 rounded border-zinc-300 accent-emerald-600"
        type="checkbox"
        @change="updateRecipientToggle"
      >
    </label>

    <div v-if="recipientIsAnotherPerson"
      class="mt-3 grid gap-3 sm:grid-cols-2"
    >
      <UFormField label="Имя получателя"
        :error="recipientNameError"
        required
      >
        <UInput :model-value="recipientName"
          autocomplete="name"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          placeholder="Имя и фамилия"
          size="md"
          type="text"
          variant="none"
          :ui="inputUi"
          @update:model-value="emit('updateRecipientName', String($event ?? ''))"
        />
      </UFormField>

      <UFormField label="Телефон получателя"
        :error="recipientPhoneError"
        required
      >
        <UInput :model-value="recipientPhone"
          autocomplete="tel"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          inputmode="tel"
          placeholder="+7 900 000-00-00"
          size="md"
          type="tel"
          variant="none"
          :ui="inputUi"
          @update:model-value="emit('updateRecipientPhone', String($event ?? ''))"
        />
      </UFormField>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  customerPhoneError?: string;
  phone: string;
  recipientIsAnotherPerson: boolean;
  recipientName: string;
  recipientNameError?: string;
  recipientPhone: string;
  recipientPhoneError?: string;
}>();

const emit = defineEmits<{
  updatePhone: [value: string];
  updateRecipientIsAnotherPerson: [value: boolean];
  updateRecipientName: [value: string];
  updateRecipientPhone: [value: string];
}>();

const inputUi = { base: "h-11 rounded-[1.1rem] bg-transparent text-sm" };

function updateRecipientToggle(event: Event) {
  emit("updateRecipientIsAnotherPerson", (event.target as HTMLInputElement | null)?.checked ?? false);
}
</script>
