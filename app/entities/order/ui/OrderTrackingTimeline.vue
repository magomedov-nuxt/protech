<template>
  <section class="relative z-0 rounded-lg border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold tracking-normal text-zinc-950">История статусов</h3>
        <p class="mt-1 text-sm text-zinc-500 ">
          Этапы обновляются по мере обработки заказа.
        </p>
      </div>
      <UIcon name="i-lucide-route" class="size-5 text-zinc-400" />
    </div>

    <ol class="mt-4">
      <li v-for="(step, index) in steps" :key="step.status" class="grid grid-cols-[36px_minmax(0,1fr)] gap-3">
        <div class="relative flex justify-center">
          <span v-if="index < steps.length - 1" class="absolute -bottom-3 top-9 w-px"
            :class="getConnectorClass(step, steps[index + 1])" />
          <span class="relative z-1 grid size-9 place-items-center rounded-full"
            :class="getStepIconClass(step.state)">
            <UIcon :name="step.icon" class="size-4" />
          </span>
        </div>

        <div class="pb-4" :class="index === steps.length - 1 ? 'pb-0' : ''">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <p class="text-sm font-semibold" :class="getStepTextClass(step.state)">
              {{ step.label }}
            </p>
            <time v-if="step.date" class="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-medium text-zinc-500  ">
              {{ formatDateTime(step.date) }}
            </time>
          </div>
          <p class="mt-1 text-sm leading-5 text-zinc-500 ">
            {{ step.description }}
          </p>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { formatDateTime } from "~~/app/shared/lib/shopFormatters";
import type { OrderStatus } from "~~/app/shared/types/shop";

type TrackingState = "done" | "current" | "todo" | "cancelled";
type TrackingStep = {
  date?: string;
  description: string;
  icon: string;
  label: string;
  state: TrackingState;
  status: OrderStatus;
};

defineProps<{
  steps: TrackingStep[];
}>();

function getStepIconClass(state: TrackingState) {
  const classes: Record<TrackingState, string> = {
    cancelled: "bg-red-50 text-red-700  ",
    current: "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20",
    done: "bg-emerald-50 text-emerald-700  ",
    todo: "bg-zinc-100 text-zinc-400  "
  };

  return classes[state];
}

function getStepTextClass(state: TrackingState) {
  const classes: Record<TrackingState, string> = {
    cancelled: "text-red-700",
    current: "text-emerald-700",
    done: "text-zinc-950",
    todo: "text-zinc-400"
  };

  return classes[state];
}

function getConnectorClass(current: TrackingStep, next?: TrackingStep) {
  if (current.state === "cancelled" || next?.state === "cancelled") {
    return "bg-red-200";
  }

  if (current.state === "done" && next?.state !== "todo") {
    return "bg-emerald-200";
  }

  return "bg-zinc-200";
}
</script>
