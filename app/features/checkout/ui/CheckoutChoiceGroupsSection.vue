<template>
  <section class="rounded-[1.75rem] bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.06)] sm:p-5  ">
    <div class="grid gap-5 xl:grid-cols-2">
      <div>
        <div class="flex items-center gap-2">
          <span class="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-700  ">
            <UIcon name="i-lucide-truck"
              class="size-4.5"
            />
          </span>
          <h2 id="checkout-obtaining-heading" class="text-base font-semibold tracking-normal text-zinc-950">Получение</h2>
        </div>

        <div class="mt-3 grid gap-2" role="radiogroup" aria-labelledby="checkout-obtaining-heading">
          <button v-for="option in obtainingOptions"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="obtainingMethod === option.value"
            :class="choiceButtonClass(obtainingMethod === option.value)"
            @click="emit('selectObtaining', option.value)"
          >
            <span :class="choiceIconClass(obtainingMethod === option.value)">
              <UIcon :name="option.icon"
                class="size-4.5"
              />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-zinc-950">{{ option.title }}</span>
              <span class="mt-0.5 block text-xs leading-4 text-zinc-500">{{ option.description }}</span>
            </span>
            <UIcon v-if="obtainingMethod === option.value"
              name="i-lucide-check"
              class="absolute right-3 top-3 size-4 text-emerald-600"
            />
          </button>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2">
          <span class="grid size-9 place-items-center rounded-full bg-zinc-100 text-zinc-700  ">
            <UIcon name="i-lucide-credit-card"
              class="size-4.5"
            />
          </span>
          <h2 id="checkout-payment-heading" class="text-base font-semibold tracking-normal text-zinc-950">Оплата</h2>
        </div>

        <div class="mt-3 grid gap-2" role="radiogroup" aria-labelledby="checkout-payment-heading">
          <button v-for="option in paymentOptions"
            :key="option.value"
            type="button"
            :disabled="option.disabled"
            role="radio"
            :aria-checked="paymentMethod === option.value"
            :aria-disabled="option.disabled || undefined"
            :class="choiceButtonClass(paymentMethod === option.value, option.disabled)"
            @click="emit('selectPayment', option.value)"
          >
            <span :class="choiceIconClass(paymentMethod === option.value, option.disabled)">
              <UIcon :name="option.icon"
                class="size-4.5"
              />
            </span>
            <span class="min-w-0">
              <span class="flex items-center gap-2">
                <span class="text-sm font-semibold text-zinc-950">{{ option.title }}</span>
                <span v-if="option.badge"
                  class="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-500 shadow-sm shadow-zinc-950/5  "
                >
                  {{ option.badge }}
                </span>
              </span>
              <span class="mt-0.5 block text-xs leading-4 text-zinc-500">{{ option.description }}</span>
            </span>
            <UIcon v-if="paymentMethod === option.value"
              name="i-lucide-check"
              class="absolute right-3 top-3 size-4 text-emerald-600"
            />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ObtainingMethod, PaymentMethod } from "~~/app/shared/types/shop";

type CheckoutChoice<TValue extends string> = {
  badge?: string;
  description: string;
  disabled?: boolean;
  icon: string;
  title: string;
  value: TValue;
};

defineProps<{
  obtainingMethod: ObtainingMethod;
  obtainingOptions: Array<CheckoutChoice<ObtainingMethod>>;
  paymentMethod: PaymentMethod;
  paymentOptions: Array<CheckoutChoice<PaymentMethod>>;
}>();

const emit = defineEmits<{
  selectObtaining: [value: ObtainingMethod];
  selectPayment: [value: PaymentMethod];
}>();

function choiceButtonClass(active: boolean, disabled = false) {
  return [
    "group relative flex min-h-[5rem] gap-2.5 rounded-[1.25rem] p-3 text-left shadow-sm transition duration-300",
    active
      ? "bg-emerald-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.24),0_18px_50px_rgba(16,185,129,0.08)] "
      : "bg-[#f9fafb] shadow-zinc-950/5 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-zinc-950/10",
    disabled ? "cursor-not-allowed opacity-50 hover:translate-y-0 hover:shadow-sm" : ""
  ];
}

function choiceIconClass(active: boolean, disabled = false) {
  return [
    "grid size-9 shrink-0 place-items-center rounded-full transition duration-300",
    active
      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20"
      : "bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 group-hover:text-emerald-700",
    disabled ? "group-hover:text-zinc-500" : ""
  ];
}
</script>
