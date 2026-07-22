<template>
  <section class="space-y-5 rounded-3xl bg-white p-4 shadow-sm shadow-zinc-950/5 ring-1 ring-zinc-200/70 sm:p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-start gap-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700">
          <UIcon name="i-lucide-images"
            class="size-5"
          />
        </span>
        <div>
          <h3 class="text-lg font-semibold text-zinc-950">
            Изображения
          </h3>
          <p class="mt-1 text-sm leading-6 text-zinc-500">
            Основное фото для каталога и дополнительные снимки в галерее.
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <input ref="galleryImageInput"
          class="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          @change="emit('uploadGalleryImage', $event)"
        >
        <UButton color="neutral"
          variant="outline"
          type="button"
          size="lg"
          :disabled="uploadingGallery"
          :loading="uploadingGallery"
          class="min-h-11 w-full min-w-36 justify-center rounded-full sm:w-auto"
          @click="openGalleryImagePicker"
        >
          <Upload class="size-4" />
          В галерею
        </UButton>
        <UButton color="primary"
          variant="soft"
          type="button"
          size="lg"
          class="min-h-11 rounded-full px-5"
          @click="emit('addGalleryUrl')"
        >
          <Plus class="size-4" />
          URL
        </UButton>
      </div>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] xl:items-start">
      <div class="space-y-4 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
        <p class="text-sm font-semibold text-zinc-500">
          Основное изображение
        </p>

        <div class="overflow-hidden rounded-2xl bg-[#f3f4f6] shadow-inner shadow-zinc-950/5">
          <img v-if="mainImage"
            :src="mainImage"
            alt=""
            class="aspect-square w-full object-cover"
          >
          <div v-else
            class="grid aspect-square place-items-center text-zinc-400"
          >
            <ImageIcon class="size-10" />
          </div>
        </div>

        <UFormField label="URL изображения"
          :error="fieldErrors.mainImage"
        >
          <UInput :model-value="mainImage"
            class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
            size="xl"
            variant="none"
            placeholder="/uploads/file.webp или https://..."
            :ui="inputUi"
            @update:model-value="emit('updateMainImage', String($event ?? ''))"
          />
        </UFormField>

        <input ref="mainImageInput"
          class="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          @change="emit('uploadMainImage', $event)"
        >
        <UButton color="neutral"
          variant="outline"
          type="button"
          size="lg"
          :disabled="uploadingMain"
          :loading="uploadingMain"
          class="min-h-11 w-full justify-center rounded-full"
          @click="openMainImagePicker"
        >
          <Upload class="size-4" />
          Загрузить
        </UButton>
      </div>

      <div class="min-w-0 space-y-4 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
        <p class="text-sm font-semibold text-zinc-500">
          Галерея
        </p>

        <UAlert v-if="fieldErrors.productImages"
          color="error"
          variant="soft"
          :description="fieldErrors.productImages"
          class="rounded-2xl"
        />

        <div v-if="productImages.length"
          class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div v-for="(image, index) in productImages"
            :key="index"
            class="rounded-2xl bg-white p-3 shadow-sm shadow-zinc-950/5"
          >
            <div class="relative overflow-hidden rounded-2xl bg-[#f3f4f6]">
              <img v-if="image.url"
                :src="image.url"
                alt=""
                class="aspect-[4/3] w-full object-cover"
              >
              <div v-else
                class="grid aspect-[4/3] place-items-center text-zinc-400"
              >
                <ImageIcon class="size-8" />
              </div>
              <UTooltip text="Удалить изображение">
                <UButton color="error"
                  variant="soft"
                  type="button"
                  size="md"
                  square
                  class="admin-touch-icon absolute right-2 top-2 rounded-full bg-white/95 shadow-lg shadow-zinc-950/10 backdrop-blur"
                  aria-label="Удалить изображение"
                  @click="emit('removeGalleryImage', index)"
                >
                  <Trash2 class="size-4" />
                </UButton>
              </UTooltip>
            </div>
            <div class="mt-3">
              <UInput :model-value="image.url"
                class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5"
                size="xl"
                variant="none"
                placeholder="URL изображения"
                :ui="inputUi"
                @update:model-value="emit('updateGalleryImage', index, String($event ?? ''))"
              />
            </div>
          </div>
        </div>

        <div v-else
          class="grid min-h-28 place-items-center rounded-2xl bg-white px-4 text-center text-sm leading-6 text-zinc-500"
        >
          Добавьте URL или загрузите изображение в галерею.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ImageIcon, Plus, Trash2, Upload } from "@lucide/vue";
import type { ProductFormState } from "~~/app/shared/types/admin";

const props = defineProps<{
  fieldErrors: Record<string, string | undefined>;
  mainImage: string;
  productImages: ProductFormState["productImages"];
  uploadingGallery: boolean;
  uploadingMain: boolean;
}>();

const mainImageInput = ref<HTMLInputElement | null>(null);
const galleryImageInput = ref<HTMLInputElement | null>(null);
const inputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-900"
};

const emit = defineEmits<{
  addGalleryUrl: [];
  removeGalleryImage: [index: number];
  updateGalleryImage: [index: number, value: string];
  updateMainImage: [value: string];
  uploadGalleryImage: [event: Event];
  uploadMainImage: [event: Event];
}>();

function openMainImagePicker() {
  if (!props.uploadingMain) {
    mainImageInput.value?.click();
  }
}

function openGalleryImagePicker() {
  if (!props.uploadingGallery) {
    galleryImageInput.value?.click();
  }
}
</script>
