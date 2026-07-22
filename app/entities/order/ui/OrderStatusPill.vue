<template>
  <span class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" :class="statusMeta.class">
    <span class="size-2 rounded-full" :class="statusMeta.dotClass" />
    <UIcon :name="statusMeta.icon" class="size-3.5" />
    {{ statusMeta.label }}
  </span>
</template>

<script setup lang="ts">
import { getStatusMeta } from "~~/app/entities/order/lib/orderDisplay";
import type { OrderStatus, PaymentStatus } from "~~/app/shared/types/shop";

const props = defineProps<{
  type: "order" | "payment";
  value: OrderStatus | PaymentStatus;
}>();

const statusMeta = computed(() => props.type === "order"
  ? getStatusMeta("order", props.value as OrderStatus)
  : getStatusMeta("payment", props.value as PaymentStatus));
</script>