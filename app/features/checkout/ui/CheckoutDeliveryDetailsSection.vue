<template>
  <section v-if="isDelivery"
    class="rounded-[1.75rem] bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.06)] sm:p-5  "
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="grid size-9 place-items-center rounded-full bg-sky-50 text-sky-700  ">
          <UIcon name="i-lucide-map-pin"
            class="size-4.5"
          />
        </span>
        <div>
          <h2 class="text-base font-semibold tracking-normal text-zinc-950">Адрес доставки OZON</h2>
          <p class="mt-0.5 text-xs text-zinc-500">Служба доставки OZON привезет заказ по этому адресу.</p>
        </div>
      </div>

      <UBadge color="neutral"
        variant="soft"
        class="rounded-full bg-sky-50 px-3 py-1 text-sky-700"
      >
        Служба доставки OZON
      </UBadge>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <UFormField label="Город"
        required
        :error="fieldErrors.city"
      >
        <UInput :model-value="draft.city"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          size="md"
          variant="none"
          placeholder="Москва"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'city', String($event ?? ''))"
        />
      </UFormField>
      <UFormField label="Улица"
        required
        :error="fieldErrors.street"
      >
        <UInput :model-value="draft.street"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          size="md"
          variant="none"
          placeholder="Тверская"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'street', String($event ?? ''))"
        />
      </UFormField>
      <UFormField label="Дом"
        required
        :error="fieldErrors.house"
      >
        <UInput :model-value="draft.house"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          size="md"
          variant="none"
          placeholder="10"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'house', String($event ?? ''))"
        />
      </UFormField>
      <UFormField label="Квартира">
        <UInput :model-value="draft.apartment"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          size="md"
          variant="none"
          placeholder="45"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'apartment', String($event ?? ''))"
        />
      </UFormField>
      <UFormField label="Подъезд">
        <UInput :model-value="draft.entrance"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          size="md"
          variant="none"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'entrance', String($event ?? ''))"
        />
      </UFormField>
      <UFormField label="Этаж">
        <UInput :model-value="draft.floor"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          size="md"
          variant="none"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'floor', String($event ?? ''))"
        />
      </UFormField>
    </div>

    <div class="mt-3 grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
      <UFormField label="Домофон">
        <UInput :model-value="draft.intercom"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          size="md"
          variant="none"
          :ui="inputUi"
          @update:model-value="emit('updateField', 'intercom', String($event ?? ''))"
        />
      </UFormField>
      <UFormField label="Комментарий курьеру">
        <UTextarea :model-value="draft.comment"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          :rows="2"
          variant="none"
          placeholder="Например, позвонить за 10 минут"
          :ui="textareaUi"
          @update:model-value="emit('updateField', 'comment', String($event ?? ''))"
        />
      </UFormField>
    </div>
  </section>

  <section v-else
    class="rounded-[1.75rem] bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.06)] sm:p-5  "
  >
    <div class="flex items-center gap-3">
      <span class="grid size-9 place-items-center rounded-full bg-sky-50 text-sky-700  ">
        <UIcon name="i-lucide-store"
          class="size-4.5"
        />
      </span>
      <div>
        <h2 class="text-base font-semibold tracking-normal text-zinc-950">Самовывоз</h2>
        <p class="mt-0.5 text-xs text-zinc-500">Самовывоз производится по предварительной записи.</p>
      </div>
    </div>

    <div class="mt-4">
      <div class="rounded-[1.25rem] bg-[#f9fafb] p-4 shadow-inner shadow-zinc-950/5">
        <p class="text-xs font-semibold uppercase text-zinc-400">Адрес самовывоза</p>
        <p class="mt-1 text-base font-semibold leading-6 text-zinc-950">
          Ярославль, пр.-т Октября, д. 78д
        </p>
      </div>
    </div>

    <p class="mt-3 rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
      Самовывоз производится по предварительной записи по номеру: 89201309744.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { CheckoutDraft } from "~~/app/stores/cart";

type CheckoutDraftField = keyof Pick<
  CheckoutDraft,
  "city" | "street" | "house" | "apartment" | "entrance" | "floor" | "intercom" | "comment"
>;

defineProps<{
  draft: CheckoutDraft;
  fieldErrors: Record<string, string | undefined>;
  isDelivery: boolean;
}>();

const emit = defineEmits<{
  updateField: [field: CheckoutDraftField, value: string];
}>();

const inputUi = { base: "h-11 rounded-[1.1rem] bg-transparent text-sm" };
const textareaUi = { base: "min-h-16 rounded-[1.1rem] bg-transparent text-sm" };
</script>
