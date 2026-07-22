<template>
  <div class="admin-card h-full min-h-96 p-5">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="admin-section-heading">
          {{ title }}
        </p>
        <p v-if="description" class="admin-section-copy">
          {{ description }}
        </p>
      </div>
      <div class="flex items-center gap-4 text-sm text-(--admin-text-muted)">
        <span class="inline-flex items-center gap-1.5">
          <span class="size-3 rounded-full bg-(--admin-chart-green)" />
          {{ valueLabel }}
        </span>
        <span v-if="secondaryLabel" class="inline-flex items-center gap-1.5">
          <span class="size-3 rounded-full bg-(--admin-chart-blue)" />
          {{ secondaryLabel }}
        </span>
      </div>
    </div>

    <div class="-mx-2 overflow-x-auto px-2 pb-2">
      <svg :viewBox="`0 0 ${width} ${height}`" class="admin-line-chart-svg h-88 overflow-visible" role="img"
        :aria-label="title">
        <g class="text-(--admin-border)">
          <line v-for="tick in yAxisTicks" :key="tick.key" :x1="leftPadding" :x2="width - rightPadding" :y1="tick.y"
            :y2="tick.y" stroke="currentColor" stroke-width="1" />
        </g>

        <g class="fill-(--admin-text-muted) text-[0.65rem]">
          <text v-for="tick in yAxisTicks" :key="`${tick.key}-label`" :x="leftPadding - 10" :y="tick.y + 4"
            text-anchor="end">
            {{ formatValue(tick.value) }}
          </text>
        </g>

        <path v-if="areaPath" :d="areaPath" fill="url(#line-area)" opacity="0.26" />
        <path v-if="linePath" :d="linePath" fill="none" stroke="var(--admin-chart-green)" stroke-linecap="round"
          stroke-linejoin="round" stroke-width="3" />
        <path v-if="secondaryPath" :d="secondaryPath" fill="none" stroke="var(--admin-chart-blue)"
          stroke-dasharray="6 6" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" />

        <g>
          <circle v-for="point in primaryPoints" :key="`${point.x}-${point.y}`" :cx="point.x" :cy="point.y" r="4"
            fill="var(--admin-chart-green)" />
        </g>

        <g class="fill-(--admin-text) text-[0.65rem] font-semibold">
          <template v-for="annotation in purchaseAnnotations" :key="annotation.key">
            <text :x="annotation.amountX" :y="annotation.amountY" :text-anchor="annotation.amountAnchor">
              {{ annotation.amount }}
            </text>
            <text class="fill-(--admin-text-muted) font-medium" :x="annotation.dateX" :y="annotation.dateY"
              text-anchor="middle">
              {{ annotation.date }}
            </text>
          </template>
        </g>

        <g class="text-xs fill-(--admin-text-muted)">
          <text v-for="label in visibleLabels" :key="label.text" :x="label.x" :y="height - 16" text-anchor="middle">
            {{ label.text }}
          </text>
        </g>

        <defs>
          <linearGradient id="line-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="var(--admin-chart-green)" />
            <stop offset="100%" stop-color="var(--admin-chart-green)" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
export type AdminLinePoint = {
  label: string;
  value: number;
  secondary?: number;
};

const props = withDefaults(defineProps<{
  title: string;
  description?: string;
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
  secondaryLabel?: string;
  items: AdminLinePoint[];
}>(), {
  description: undefined,
  secondaryLabel: undefined,
  valueFormatter: undefined,
  valueLabel: "Значение"
});

const width = 860;
const height = 340;
const leftPadding = 74;
const rightPadding = 108;
const topPadding = 32;
const bottomPadding = 68;
const chartWidth = width - leftPadding - rightPadding;
const chartHeight = height - topPadding - bottomPadding;
const chartBottom = height - bottomPadding;

const formatValue = (value: number) => props.valueFormatter?.(value) ?? new Intl.NumberFormat("ru-RU", {
  compactDisplay: "short",
  currency: "RUB",
  maximumFractionDigits: value >= 100_000 ? 1 : 0,
  notation: "compact",
  style: "currency"
}).format(value);

const maxValue = computed(() => Math.max(
  1,
  ...props.items.flatMap((item) => [item.value, item.secondary ?? 0])
));
const yAxisTicks = computed(() => {
  const tickCount = 5;

  return Array.from({ length: tickCount }, (_, index) => {
    const ratio = index / (tickCount - 1);
    const value = maxValue.value * (1 - ratio);

    return {
      key: `${index}-${Math.round(value)}`,
      value,
      y: topPadding + chartHeight * ratio
    };
  });
});

function createPoints(values: number[]) {
  if (!values.length) {
    return [];
  }

  return values.map((value, index) => {
    const x = leftPadding + (values.length === 1 ? chartWidth / 2 : (chartWidth / (values.length - 1)) * index);
    const y = chartBottom - (value / maxValue.value) * chartHeight;

    return { value, x, y };
  });
}

function createPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) {
    return "";
  }

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

const primaryPoints = computed(() => createPoints(props.items.map((item) => item.value)));
const secondaryPoints = computed(() => createPoints(props.items.map((item) => item.secondary ?? 0)));
const linePath = computed(() => createPath(primaryPoints.value));
const secondaryPath = computed(() => props.items.some((item) => item.secondary !== undefined) ? createPath(secondaryPoints.value) : "");
const areaPath = computed(() => {
  if (!primaryPoints.value.length) {
    return "";
  }

  const first = primaryPoints.value[0]!;
  const last = primaryPoints.value[primaryPoints.value.length - 1]!;

  return `${createPath(primaryPoints.value)} L ${last.x} ${chartBottom} L ${first.x} ${chartBottom} Z`;
});
const purchaseAnnotations = computed(() => primaryPoints.value
  .map((point, index) => ({
    key: `${props.items[index]?.label ?? index}-${point.x}`,
    date: props.items[index]?.label ?? "",
    amount: formatValue(point.value),
    amountAnchor: point.x > width - rightPadding - 96 ? "end" as const : "start" as const,
    amountX: point.x > width - rightPadding - 96 ? point.x - 10 : point.x + 10,
    amountY: Math.max(topPadding + 12, point.y - 10),
    dateX: point.x,
    dateY: Math.min(chartBottom + 18, point.y + 20),
    value: point.value
  }))
  .filter((annotation) => annotation.value > 0));
const visibleLabels = computed(() => {
  const step = Math.max(1, Math.ceil(props.items.length / 6));

  return props.items
    .map((item, index) => ({
      text: item.label,
      x: primaryPoints.value[index]?.x ?? leftPadding
    }))
    .filter((_, index) => index % step === 0 || index === props.items.length - 1);
});
</script>

<style scoped>
.admin-line-chart-svg {
  display: block;
  width: 44rem;
  max-width: none;
}

@media (min-width: 1024px) {
  .admin-line-chart-svg {
    width: 100%;
  }
}
</style>
