<template>
  <section class="relative min-h-[380px] overflow-hidden rounded-[2rem] bg-zinc-900 shadow-[0_28px_90px_rgba(15,23,42,0.16)] sm:min-h-[760px] ">
    <iframe :src="mapSrc"
      class="absolute inset-0 size-full border-0"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      :title="mapTitle"
    />

    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.34),rgba(9,9,11,0.02)_38%,rgba(9,9,11,0.48))]" />

    <div class="absolute left-4 right-4 top-4 flex flex-wrap items-start justify-between gap-3">
      <div class="w-full max-w-md rounded-[1.5rem] bg-white/90 px-4 py-3 shadow-xl shadow-zinc-950/15 backdrop-blur-xl ">
        <div class="flex items-center gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-950/20">
            <UIcon :name="isPickup ? 'i-lucide-store' : 'i-lucide-map-pin'"
              class="size-5 shrink-0"
            />
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-zinc-950">{{ panelTitle }}</p>
            <p class="mt-0.5 line-clamp-2 text-xs leading-5 text-zinc-500">{{ statusText }}</p>
          </div>
        </div>
      </div>

      <UBadge :color="badgeColor"
        variant="soft"
        class="rounded-full bg-white/90 px-3 py-1.5 shadow-lg shadow-zinc-950/10 backdrop-blur "
      >
        {{ badgeText }}
      </UBadge>
    </div>

    <div class="absolute inset-x-4 bottom-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div class="rounded-[1.5rem] bg-white/90 p-4 shadow-xl shadow-zinc-950/15 backdrop-blur-xl ">
        <p class="text-xs font-semibold uppercase text-zinc-400">Точка на карте</p>
        <p class="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-zinc-950 ">
          {{ locationLabel }}
        </p>
      </div>

      <div v-if="pending || error"
        class="rounded-[1.5rem] px-4 py-3 text-sm shadow-xl backdrop-blur-xl"
        :class="error ? 'bg-red-50/95 text-red-700 shadow-red-950/10' : 'bg-white/90 text-zinc-500 shadow-zinc-950/10  '"
      >
        <span class="inline-flex items-center gap-2">
          <UIcon :name="error ? 'i-lucide-circle-alert' : 'i-lucide-loader-circle'"
            class="size-4"
            :class="{ 'animate-spin': pending && !error }"
          />
          {{ error || "Ищу адрес на карте..." }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { ObtainingMethod } from "~~/app/shared/types/shop";

const props = defineProps<{
  city: string;
  obtainingMethod: ObtainingMethod;
  street: string;
  house: string;
}>();

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

const pending = ref(false);
const error = ref("");
const deliveryFallbackPosition = {
  lat: 55.751244,
  lon: 37.618423,
  label: "Москва"
};
const pickupPosition = {
  lat: 57.650391,
  lon: 39.858221,
  label: "Ярославль, пр.-т Октября, д. 78д"
};
const position = ref({
  ...deliveryFallbackPosition
});

const isPickup = computed(() => props.obtainingMethod === "PICKUP");
const addressQuery = computed(() => [props.city, props.street, props.house]
  .map((part) => part.trim())
  .filter(Boolean)
  .join(", "));

const statusText = computed(() => {
  if (isPickup.value) return "По предварительной записи 89201309744";
  if (!props.city.trim()) return "Введите город, затем улицу и дом";
  if (!props.street.trim()) return "Город найден, добавьте улицу";
  if (!props.house.trim()) return "Улица найдена, добавьте номер дома";
  return position.value.label;
});
const panelTitle = computed(() => isPickup.value ? "Карта самовывоза" : "Карта доставки");
const locationLabel = computed(() => {
  if (isPickup.value) return pickupPosition.label;
  return addressQuery.value || "Адрес доставки пока не указан";
});
const badgeColor = computed(() => {
  if (isPickup.value || props.house.trim()) return "primary";
  return "neutral";
});
const badgeText = computed(() => {
  if (isPickup.value) return "Самовывоз";
  return props.house.trim() ? "Доставка OZON" : "Уточняется";
});
const mapTitle = computed(() => isPickup.value ? "Карта пункта самовывоза" : "Карта адреса доставки");

const geocodeAddress = useDebounceFn(async () => {
  if (isPickup.value) {
    position.value = { ...pickupPosition };
    pending.value = false;
    error.value = "";
    return;
  }

  if (!props.city.trim()) {
    position.value = { ...deliveryFallbackPosition };
    pending.value = false;
    error.value = "";
    return;
  }

  if (!import.meta.client) {
    return;
  }

  pending.value = true;
  error.value = "";

  try {
    const params = new URLSearchParams({
      format: "json",
      limit: "1",
      q: addressQuery.value
    });
    const result = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    const data = await result.json() as NominatimResult[];
    const first = data[0];

    if (!first) {
      error.value = "Не удалось найти адрес. Проверьте город, улицу и номер дома.";
      return;
    }

    position.value = {
      lat: Number(first.lat),
      lon: Number(first.lon),
      label: first.display_name
    };
  } catch {
    error.value = "Карта временно не смогла уточнить адрес.";
  } finally {
    pending.value = false;
  }
}, 700);

watch([addressQuery, isPickup], () => {
  void geocodeAddress();
}, { immediate: true });

const mapSrc = computed(() => {
  const span = isPickup.value ? 0.018 : props.house.trim() ? 0.008 : props.street.trim() ? 0.035 : 0.18;
  const lat = position.value.lat;
  const lon = position.value.lon;
  const bbox = [
    lon - span,
    lat - span * 0.65,
    lon + span,
    lat + span * 0.65
  ].join(",");
  const marker = isPickup.value || props.house.trim() ? `&marker=${lat},${lon}` : "";

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik${marker}`;
});
</script>
