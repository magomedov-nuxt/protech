<template>
  <div class="-mx-4 grid gap-0 sm:mx-0 sm:gap-4 xl:gap-3"
    role="region"
    :aria-label="`Фотографии товара ${alt}`"
    :class="imageItems.length > 1 ? 'xl:grid-cols-[76px_minmax(0,1fr)]' : ''"
  >
    <div v-if="imageItems.length > 1"
      v-auto-animate
      class="hidden gap-2 xl:order-1 xl:flex xl:max-h-160 xl:flex-col xl:overflow-y-auto xl:pr-1"
    >
      <button v-for="(image, index) in imageItems"
        :key="image.url"
        class="shrink-0 rounded-xl bg-[#f9fafb] p-1 shadow-sm shadow-zinc-950/5 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-white hover:shadow-xl hover:shadow-zinc-950/10"
        :class="index === selectedIndex ? 'scale-[1.03] bg-emerald-50 ring-2 ring-emerald-200' : 'ring-2 ring-transparent'"
        type="button"
        :aria-label="`Открыть фото ${index + 1}`"
        :aria-current="index === selectedIndex ? 'true' : undefined"
        :aria-pressed="index === selectedIndex"
        @click="selectImage(index)"
      >
        <img :src="productImageUrl(image.url, 'thumbnail')"
          :alt="alt"
          class="aspect-3/4 w-16 rounded-lg bg-white object-contain sm:w-16.5"
          loading="lazy"
          :srcset="productImageSrcset(image.url, 'thumbnail')"
          :crossorigin="productImageCrossorigin(image.url)"
          decoding="async"
        >
      </button>
    </div>

    <div class="group relative order-1 overflow-hidden bg-white xl:order-2 xl:rounded-2xl xl:bg-[#f9fafb] xl:p-1.5 xl:shadow-[0_16px_50px_rgba(15,23,42,0.07)]">
      <div ref="mobileGallery"
        aria-label="Галерея товара, горизонтальная прокрутка"
        class="mobile-gallery-scrollbar flex aspect-3/4 max-h-[calc(100svh-7rem)] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth bg-white sm:hidden"
        @scroll.passive="syncMobileSelection"
      >
        <div v-for="(image, index) in imageItems"
          :key="`mobile-${image.url}`"
          class="h-full w-full shrink-0 snap-center snap-always"
        >
          <img :src="productImageUrl(image.url, 'detail')"
            :alt="alt"
            class="size-full object-contain"
            :loading="index === 0 ? 'eager' : 'lazy'"
            :fetchpriority="index === 0 ? 'high' : 'auto'"
            :srcset="productImageSrcset(image.url, 'detail')"
            :crossorigin="productImageCrossorigin(image.url)"
            decoding="async"
          >
        </div>
      </div>

      <div v-if="imageItems.length > 1"
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5 sm:hidden"
      >
        <span v-for="(image, index) in imageItems"
          :key="`dot-${image.url}`"
          class="h-1.5 rounded-full bg-white/80 shadow-sm shadow-zinc-950/20 transition-all duration-300"
          :class="index === selectedIndex ? 'w-6' : 'w-1.5 opacity-70'"
        />
      </div>

      <div ref="tabletGallery"
        aria-label="Галерея товара, горизонтальная прокрутка"
        class="tablet-gallery-scrollbar hidden h-[min(58vw,560px)] min-h-105 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth sm:flex xl:hidden"
        @scroll.passive="syncTabletSelection"
      >
        <div v-for="(image, index) in imageItems"
          :key="`tablet-${image.url}`"
          class="h-full shrink-0 snap-start snap-always overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/70"
          :class="imageItems.length > 1 ? 'basis-[calc((100%-0.75rem)/2)]' : 'basis-full'"
        >
          <img :src="productImageUrl(image.url, 'detail')"
            :alt="alt"
            class="size-full object-contain"
            :loading="index < 2 ? 'eager' : 'lazy'"
            :fetchpriority="index === 0 ? 'high' : 'auto'"
            :srcset="productImageSrcset(image.url, 'detail')"
            :crossorigin="productImageCrossorigin(image.url)"
            decoding="async"
          >
        </div>
      </div>

      <div class="relative hidden overflow-hidden rounded-xl bg-white xl:block">
        <Transition mode="out-in"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-[1.015]"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-[0.985]"
        >
          <img :key="activeImage.url"
            :src="productImageUrl(activeImage.url, 'detail')"
            :alt="alt"
            class="aspect-3/4 w-full bg-zinc-100 object-contain"
            fetchpriority="high"
            :srcset="productImageSrcset(activeImage.url, 'detail')"
            :crossorigin="productImageCrossorigin(activeImage.url)"
            decoding="async"
          >
        </Transition>

        <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-zinc-950/18 to-transparent" />

        <div class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-lg shadow-zinc-950/10 backdrop-blur-xl">
          {{ selectedIndex + 1 }} / {{ imageItems.length }}
        </div>

        <UTooltip text="Открыть полноэкранно">
          <UButton color="neutral"
            variant="soft"
            icon="i-lucide-expand"
            size="md"
            square
            class="absolute right-3 top-3 rounded-full bg-white/90 shadow-lg shadow-zinc-950/10 backdrop-blur-xl transition duration-300 hover:scale-105"
            aria-label="Открыть фото полноэкранно"
            @click="openZoom"
          />
        </UTooltip>

        <div v-if="imageItems.length > 1"
          class="absolute bottom-3 right-3 flex gap-2"
        >
          <UTooltip text="Предыдущее фото">
            <UButton color="neutral"
              variant="soft"
              icon="i-lucide-chevron-left"
              size="md"
              square
              class="rounded-full bg-white/90 shadow-lg shadow-zinc-950/10 backdrop-blur-xl transition duration-300 hover:scale-105"
              aria-label="Предыдущее фото"
              @click="previous"
            />
          </UTooltip>

          <UTooltip text="Следующее фото">
            <UButton color="neutral"
              variant="soft"
              icon="i-lucide-chevron-right"
              size="md"
              square
              class="rounded-full bg-white/90 shadow-lg shadow-zinc-950/10 backdrop-blur-xl transition duration-300 hover:scale-105"
              aria-label="Следующее фото"
              @click="next"
            />
          </UTooltip>
        </div>
      </div>
    </div>

    <UModal v-model:open="zoomOpen"
      title="Фото товара"
      :ui="modalUi"
    >
      <template #body>
        <div class="relative overflow-hidden rounded-2xl bg-[#f9fafb]">
          <img :src="productImageUrl(activeImage.url, 'detail')"
            :alt="alt"
            class="mx-auto block aspect-3/4 max-h-[82dvh] max-w-full object-contain"
            :srcset="productImageSrcset(activeImage.url, 'detail')"
            :crossorigin="productImageCrossorigin(activeImage.url)"
            decoding="async"
          >
          <div v-if="imageItems.length > 1"
            class="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4"
          >
            <UButton color="neutral"
              variant="soft"
              icon="i-lucide-chevron-left"
              size="xl"
              square
              class="rounded-full bg-white/90 shadow-xl shadow-black/20 backdrop-blur-xl transition hover:scale-105"
              aria-label="Предыдущее фото"
              @click="previous"
            />
            <UButton color="neutral"
              variant="soft"
              icon="i-lucide-chevron-right"
              size="xl"
              square
              class="rounded-full bg-white/90 shadow-xl shadow-black/20 backdrop-blur-xl transition hover:scale-105"
              aria-label="Следующее фото"
              @click="next"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import {
  productImageCrossorigin,
  productImageSrcset,
  productImageUrl
} from "~~/app/shared/lib/productImages";

const props = defineProps<{
  alt: string;
  images: Array<{ id?: number; url: string }>;
  mainImage: string;
}>();

const selectedIndex = ref(0);
const zoomOpen = ref(false);
const mobileGallery = ref<HTMLElement | null>(null);
const tabletGallery = ref<HTMLElement | null>(null);
const fallbackImage = "/favicon.ico";

const imageItems = computed(() => {
  const seen = new Set<string>();

  return [
    { url: props.mainImage || fallbackImage },
    ...props.images
  ].filter((image) => {
    if (!image.url || seen.has(image.url)) {
      return false;
    }

    seen.add(image.url);
    return true;
  });
});

const activeImage = computed(() => imageItems.value[selectedIndex.value] ?? imageItems.value[0] ?? { url: fallbackImage });
const imageSignature = computed(() => imageItems.value.map((image) => image.url).join("|"));
const modalUi = {
  overlay: "bg-zinc-950/35 backdrop-blur-sm",
  content: "max-h-[calc(100dvh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-zinc-950/20 ring-0",
  body: "overflow-hidden p-3 sm:p-4"
};

watch(imageSignature, () => {
  selectedIndex.value = 0;
  nextTick(() => {
    scrollGalleryTo(mobileGallery.value, 0, "auto");
    scrollGalleryTo(tabletGallery.value, 0, "auto");
  });
});

function previous() {
  selectImage(selectedIndex.value === 0 ? imageItems.value.length - 1 : selectedIndex.value - 1);
}

function next() {
  selectImage(selectedIndex.value === imageItems.value.length - 1 ? 0 : selectedIndex.value + 1);
}

function openZoom() {
  zoomOpen.value = true;
}

function selectImage(index: number) {
  selectedIndex.value = index;
  nextTick(() => {
    scrollGalleryTo(mobileGallery.value, index);
    scrollGalleryTo(tabletGallery.value, index);
  });
}

function scrollGalleryTo(gallery: HTMLElement | null, index: number, behavior: ScrollBehavior = "smooth") {
  if (!gallery) {
    return;
  }

  const targetSlide = gallery.children.item(index) as HTMLElement | null;

  gallery.scrollTo({
    left: targetSlide?.offsetLeft ?? gallery.clientWidth * index,
    behavior
  });
}

function syncMobileSelection() {
  syncSelectionFromScroll(mobileGallery.value);
}

function syncTabletSelection() {
  syncSelectionFromScroll(tabletGallery.value);
}

function syncSelectionFromScroll(gallery: HTMLElement | null) {
  if (!gallery || gallery.clientWidth === 0) {
    return;
  }

  const slides = Array.from(gallery.children) as HTMLElement[];
  const nextIndex = slides.reduce((closestIndex, slide, index) => {
    const closestSlide = slides[closestIndex];

    if (!closestSlide) {
      return index;
    }

    return Math.abs(slide.offsetLeft - gallery.scrollLeft) < Math.abs(closestSlide.offsetLeft - gallery.scrollLeft)
      ? index
      : closestIndex;
  }, 0);

  selectedIndex.value = Math.min(imageItems.value.length - 1, Math.max(0, nextIndex));
}
</script>

<style scoped>
.mobile-gallery-scrollbar,
.tablet-gallery-scrollbar {
  scrollbar-width: none;
}

.mobile-gallery-scrollbar::-webkit-scrollbar,
.tablet-gallery-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
