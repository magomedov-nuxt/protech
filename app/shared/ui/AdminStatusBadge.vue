<template>
  <UBadge :color="color" variant="soft" class="whitespace-nowrap rounded-full px-3 py-1 font-medium">
    {{ label }}
  </UBadge>
</template>

<script setup lang="ts">
import {
  orderStatusColor,
  orderStatusLabels,
  paymentStatusColor,
  paymentStatusLabels
} from "~~/app/shared/lib/adminFormatters";
import type { OrderStatus, PaymentStatus } from "~~/app/shared/types/admin";

const props = defineProps<{
  type: "order" | "payment" | "boolean" | "stock";
  value: OrderStatus | PaymentStatus | boolean | number | null | undefined;
  trueLabel?: string;
  falseLabel?: string;
}>();

const label = computed(() => {
  if (props.type === "order") {
    return orderStatusLabels[props.value as OrderStatus] ?? "Неизвестно";
  }

  if (props.type === "payment") {
    return paymentStatusLabels[props.value as PaymentStatus] ?? "Неизвестно";
  }

  if (props.type === "stock") {
    const quantity = Number(props.value ?? 0);
    return quantity <= 0 ? "Нет в наличии" : quantity <= 5 ? "Мало" : "В наличии";
  }

  return props.value ? (props.trueLabel ?? "Активно") : (props.falseLabel ?? "Выключено");
});

const color = computed(() => {
  if (props.type === "order") {
    return orderStatusColor[props.value as OrderStatus] ?? "neutral";
  }

  if (props.type === "payment") {
    return paymentStatusColor[props.value as PaymentStatus] ?? "neutral";
  }

  if (props.type === "stock") {
    const quantity = Number(props.value ?? 0);
    return quantity <= 0 ? "error" : quantity <= 5 ? "warning" : "success";
  }

  return props.value ? "success" : "neutral";
});
</script>
