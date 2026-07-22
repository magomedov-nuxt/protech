<template>
  <UModal v-model:open="open"
    :ui="mediaModalUi"
  >
    <template #header>
      <div class="flex min-w-0 items-start gap-4">
        <div class="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-950/15">
          <UIcon name="i-lucide-images"
            class="size-6"
          />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase text-amber-700">
            Медиа товара
          </p>
          <h2 class="mt-1 truncate text-xl font-semibold tracking-normal text-zinc-950 sm:text-2xl">
            {{ mediaTitle }}
          </h2>
          <p class="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            {{ mediaDescription }}
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="loading"
        class="grid min-h-96 place-items-center bg-[#f9fafb]"
      >
        <div class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-zinc-500 shadow-sm shadow-zinc-950/5">
          <LoaderCircle class="size-5 animate-spin" />
          Загружаю изображения
        </div>
      </div>

      <form v-else
        id="product-media-editor-form"
        class="grid gap-5 bg-[#f9fafb] p-4 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        @submit.prevent="save"
      >
        <section class="space-y-5 rounded-3xl bg-white p-4 shadow-sm shadow-zinc-950/5 ring-1 ring-zinc-200/70 sm:p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                <UIcon name="i-lucide-image"
                  class="size-5"
                />
              </span>
              <div>
                <h3 class="text-lg font-semibold text-zinc-950">
                  Главное фото
                </h3>
                <p class="mt-1 text-sm leading-6 text-zinc-500">
                  Это изображение видно в каталоге и карточке товара.
                </p>
              </div>
            </div>
            <input ref="mainImageInput"
              class="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              @change="uploadMainImage"
            >
            <UButton color="neutral"
              variant="outline"
              type="button"
              size="lg"
              class="min-h-11 min-w-36 justify-center rounded-full px-5"
              :disabled="uploadingMain"
              :loading="uploadingMain"
              @click="openMainImagePicker"
            >
              <Upload class="size-4" />
              Загрузить
            </UButton>
          </div>

          <div class="overflow-hidden rounded-2xl bg-[#f3f4f6] shadow-inner shadow-zinc-950/5">
            <img v-if="mainImage"
              :src="mainImage"
              alt=""
              class="aspect-[3/4] w-full object-cover"
            >
            <div v-else
              class="grid aspect-[3/4] place-items-center text-zinc-400"
            >
              <ImageIcon class="size-12" />
            </div>
          </div>

          <UFormField label="URL главного фото"
            :error="fieldErrors.mainImage"
          >
            <UInput v-model="mainImage"
              class="w-full rounded-2xl bg-[#f9fafb] shadow-inner shadow-zinc-950/5"
              size="lg"
              variant="none"
              placeholder="/uploads/file.webp или https://..."
              :ui="mediaInputUi"
              @update:model-value="fieldErrors.mainImage = undefined"
            />
          </UFormField>
        </section>

        <section class="space-y-5 rounded-3xl bg-white p-4 shadow-sm shadow-zinc-950/5 ring-1 ring-zinc-200/70 sm:p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                <UIcon name="i-lucide-gallery-horizontal"
                  class="size-5"
                />
              </span>
              <div>
                <h3 class="text-lg font-semibold text-zinc-950">
                  Дополнительные фото
                </h3>
                <p class="mt-1 text-sm leading-6 text-zinc-500">
                  Галерея товара на публичной странице.
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <input ref="galleryImageInput"
                class="hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                @change="uploadGalleryImage"
              >
              <UButton color="neutral"
                variant="outline"
                type="button"
                size="lg"
                class="min-h-11 min-w-36 justify-center rounded-full px-5"
                :disabled="uploadingGallery"
                :loading="uploadingGallery"
                @click="openGalleryImagePicker"
              >
                <Upload class="size-4" />
                Загрузить
              </UButton>
              <UButton color="primary"
                variant="soft"
                type="button"
                size="lg"
                class="min-h-11 rounded-full px-5"
                @click="addGalleryUrl"
              >
                <Plus class="size-4" />
                URL
              </UButton>
            </div>
          </div>

          <UAlert v-if="fieldErrors.productImages"
            color="error"
            variant="soft"
            :description="fieldErrors.productImages"
            class="rounded-2xl"
          />

          <div v-if="productImages.length"
            class="grid gap-3 sm:grid-cols-2"
          >
            <div v-for="(image, index) in productImages"
              :key="index"
              class="space-y-3 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5"
            >
              <div class="overflow-hidden rounded-2xl bg-white shadow-sm shadow-zinc-950/5">
                <img v-if="image.url"
                  :src="image.url"
                  alt=""
                  class="aspect-[3/4] w-full object-cover"
                >
                <div v-else
                  class="grid aspect-[3/4] place-items-center text-zinc-400"
                >
                  <ImageIcon class="size-8" />
                </div>
              </div>

              <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <UInput v-model="image.url"
                  class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
                  size="lg"
                  variant="none"
                  placeholder="URL изображения"
                  :ui="mediaInputUi"
                  @update:model-value="fieldErrors.productImages = undefined"
                />
                <UButton color="error"
                  variant="ghost"
                  type="button"
                  size="lg"
                  class="min-h-11 rounded-full"
                  aria-label="Удалить изображение"
                  @click="removeGalleryImage(index)"
                >
                  <Trash2 class="size-4" />
                </UButton>
              </div>
            </div>
          </div>

          <div v-else
            class="grid min-h-48 place-items-center rounded-2xl bg-[#f9fafb] px-4 text-center text-sm leading-6 text-zinc-500"
          >
            Добавьте URL или загрузите изображение в галерею.
          </div>
        </section>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton color="neutral"
          variant="ghost"
          size="lg"
          class="min-h-12 justify-center rounded-full px-6"
          @click="closeEditor"
        >
          Отмена
        </UButton>
        <UButton color="primary"
          size="lg"
          type="submit"
          form="product-media-editor-form"
          class="min-h-12 justify-center rounded-full px-6 shadow-lg shadow-emerald-950/10"
          :loading="submitting"
        >
          <Save class="size-4" />
          Сохранить изображения
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ImageIcon, LoaderCircle, Plus, Save, Trash2, Upload } from "@lucide/vue";
import { toast } from "vue-sonner";
import { getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { ProductDetails, ProductFormState } from "~~/app/shared/types/admin";
import { updateProductSchema } from "~~/shared/schemas/admin/products/updateProduct";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  productId?: number | null;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const loading = ref(false);
const submitting = ref(false);
const uploadingMain = ref(false);
const uploadingGallery = ref(false);
const mainImageInput = ref<HTMLInputElement | null>(null);
const galleryImageInput = ref<HTMLInputElement | null>(null);
const productName = ref("");
const mainImage = ref("");
const productImages = ref<ProductFormState["productImages"]>([]);
const fieldErrors = reactive<Record<string, string | undefined>>({});
const mediaModalUi = {
  content: "max-h-[calc(100dvh-2rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-zinc-950/20 ring-0 sm:max-h-[calc(100dvh-4rem)]",
  header: "shrink-0 border-b border-zinc-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6",
  body: "min-h-0 flex-1 overflow-y-auto overscroll-contain p-0",
  footer: "shrink-0 border-t border-zinc-100 bg-white/95 px-4 py-4 sm:px-6"
};
const mediaInputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-900"
};
const mediaTitle = computed(() => productName.value ? `Изображения: ${productName.value}` : "Изображения товара");
const mediaDescription = computed(() =>
  "Быстрая замена главного фото и дополнительных изображений без полной формы товара."
);

async function loadProduct() {
  if (!props.productId) {
    productName.value = "";
    mainImage.value = "";
    productImages.value = [];
    return;
  }

  loading.value = true;
  clearFieldErrors(fieldErrors);

  try {
    const product = await adminFetch<ProductDetails>(`/api/admin/products/${props.productId}`);
    productName.value = product.name;
    mainImage.value = product.mainImage;
    productImages.value = product.productImages.map((image) => ({ url: image.url }));
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить изображения товара"));
    open.value = false;
  } finally {
    loading.value = false;
  }
}

function addGalleryUrl() {
  productImages.value.push({ url: "" });
}

function removeGalleryImage(index: number) {
  productImages.value.splice(index, 1);
  fieldErrors.productImages = undefined;
}

function closeEditor() {
  open.value = false;
}

function openMainImagePicker() {
  if (!uploadingMain.value) {
    mainImageInput.value?.click();
  }
}

function openGalleryImagePicker() {
  if (!uploadingGallery.value) {
    galleryImageInput.value?.click();
  }
}

function buildPayload() {
  return {
    mainImage: mainImage.value.trim(),
    productImages: productImages.value
      .map((image) => ({ url: image.url.trim() }))
      .filter((image) => image.url)
  };
}

async function save() {
  if (!props.productId || submitting.value || loading.value) {
    return;
  }

  const parsed = updateProductSchema.safeParse(buildPayload());

  if (!parsed.success) {
    replaceFieldErrors(fieldErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте изображения товара");
    return;
  }

  clearFieldErrors(fieldErrors);
  submitting.value = true;

  try {
    await adminFetch(`/api/admin/products/update/${props.productId}`, {
      method: "POST",
      body: parsed.data
    });
    toast.success("Изображения товара обновлены");
    emit("saved");
    open.value = false;
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось сохранить изображения"));
  } finally {
    submitting.value = false;
  }
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  return await adminFetch<{ url: string }>("/api/admin/upload", {
    method: "POST",
    body: formData
  });
}

async function uploadMainImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  uploadingMain.value = true;

  try {
    const result = await uploadImage(file);
    mainImage.value = result.url;
    fieldErrors.mainImage = undefined;
    toast.success("Главное фото загружено");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить главное фото"));
  } finally {
    uploadingMain.value = false;
    input.value = "";
  }
}

async function uploadGalleryImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  uploadingGallery.value = true;

  try {
    const result = await uploadImage(file);
    productImages.value.push({ url: result.url });
    fieldErrors.productImages = undefined;
    toast.success("Фото добавлено в галерею");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить фото в галерею"));
  } finally {
    uploadingGallery.value = false;
    input.value = "";
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    void loadProduct();
  }
});
</script>
