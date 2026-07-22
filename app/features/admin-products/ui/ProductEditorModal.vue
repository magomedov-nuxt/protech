<template>
  <UModal v-model:open="open"
    :ui="productEditorModalUi"
  >
    <template #header>
      <div class="flex min-w-0 items-start gap-4">
        <div class="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-950/15">
          <UIcon name="i-lucide-package-plus"
            class="size-6"
          />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase text-emerald-700">
            Каталог
          </p>
          <h2 class="mt-1 truncate text-xl font-semibold tracking-normal text-zinc-950 sm:text-2xl">
            {{ editorTitle }}
          </h2>
          <p class="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            {{ editorDescription }}
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
          Загружаю товар
        </div>
      </div>

      <form v-else
        id="product-editor-form"
        class="space-y-5 bg-[#f9fafb] p-4 sm:p-6"
        @submit.prevent="save"
      >
        <section class="rounded-3xl bg-white p-4 shadow-sm shadow-zinc-950/5 ring-1 ring-zinc-200/70 sm:p-5">
          <div class="flex items-start gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <UIcon name="i-lucide-file-pen-line"
                class="size-5"
              />
            </span>
            <div>
              <h3 class="text-lg font-semibold text-zinc-950">
                Данные товара
              </h3>
              <p class="mt-1 text-sm leading-6 text-zinc-500">
                Название, категория, цены и видимость в публичном каталоге.
              </p>
            </div>
          </div>

          <ProductEditorBasicsSection class="mt-5"
            :category-items="categoryItems"
            :field-errors="fieldErrors"
            :form="form"
            @select-category="handleCategorySelect"
            @update-field="updateFormField"
          />
        </section>

        <ProductEditorMediaSection :field-errors="fieldErrors"
          :main-image="form.mainImage"
          :product-images="form.productImages"
          :uploading-gallery="uploadingGallery"
          :uploading-main="uploadingMain"
          @add-gallery-url="addGalleryUrl"
          @remove-gallery-image="removeGalleryImage"
          @update-gallery-image="updateGalleryImage"
          @update-main-image="updateMainImage"
          @upload-gallery-image="uploadGalleryImage"
          @upload-main-image="uploadMainImage"
        />

        <ProductEditorAttributesSection :attribute-items="attributeItems"
          :attributes="form.productAttributes"
          :error="fieldErrors.productAttributes"
          @add="addAttribute"
          @remove="removeAttribute"
          @select="handleAttributeSelect"
          @update-value="updateAttributeValue"
        />
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
          form="product-editor-form"
          class="min-h-12 justify-center rounded-full px-6 shadow-lg shadow-emerald-950/10"
          :loading="submitting"
        >
          <Save class="size-4" />
          Сохранить товар
        </UButton>
      </div>
    </template>
  </UModal>

  <UModal v-model:open="categoryCreateOpen"
    title="Новая категория"
    description="Категория будет создана и сразу выбрана для товара."
    :ui="compactModalUi"
  >
    <template #body>
      <div class="rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
        <UFormField label="Название категории"
          required
          :error="newCategoryError"
        >
          <UInput v-model="newCategoryName"
            class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
            size="xl"
            variant="none"
            autofocus
            placeholder="Например, Аккумуляторы"
            :disabled="creatingCategory"
            :ui="modalInputUi"
            @keydown.enter.prevent="createCategory"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton color="neutral"
          variant="ghost"
          size="lg"
          class="min-h-11 justify-center rounded-full px-5"
          @click="closeCategoryCreator"
        >
          Отмена
        </UButton>
        <UButton color="primary"
          size="lg"
          class="min-h-11 justify-center rounded-full px-5"
          :loading="creatingCategory"
          @click="createCategory"
        >
          <Plus class="size-4" />
          Создать
        </UButton>
      </div>
    </template>
  </UModal>

  <UModal v-model:open="attributeCreateOpen"
    title="Новая характеристика"
    description="Характеристика будет создана и сразу подставлена в выбранную строку."
    :ui="attributeModalUi"
  >
    <template #body>
      <div class="grid gap-4 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5 sm:grid-cols-[minmax(0,1fr)_180px]">
        <UFormField label="Название"
          required
          :error="newAttributeErrors.name"
        >
          <UInput v-model="newAttributeForm.name"
            class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
            size="xl"
            variant="none"
            autofocus
            placeholder="Например, Ёмкость"
            :disabled="creatingAttribute"
            :ui="modalInputUi"
            @keydown.enter.prevent="createAttribute"
          />
        </UFormField>
        <UFormField label="Ед. изм."
          :error="newAttributeErrors.unit"
        >
          <UInput v-model="newAttributeForm.unit"
            class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
            size="xl"
            variant="none"
            placeholder="А·ч"
            :disabled="creatingAttribute"
            :ui="modalInputUi"
            @keydown.enter.prevent="createAttribute"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton color="neutral"
          variant="ghost"
          size="lg"
          class="min-h-11 justify-center rounded-full px-5"
          @click="closeAttributeCreator"
        >
          Отмена
        </UButton>
        <UButton color="primary"
          size="lg"
          class="min-h-11 justify-center rounded-full px-5"
          :loading="creatingAttribute"
          @click="createAttribute"
        >
          <Plus class="size-4" />
          Создать
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { LoaderCircle, Plus, Save } from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { getErrorMessage, toNumber } from "~~/app/shared/lib/adminFormatters";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { Attribute, Category, ProductDetails, ProductFormState } from "~~/app/shared/types/admin";
import { categorySchema } from "~~/shared/schemas/admin/products/category";
import { createAttributeSchema } from "~~/shared/schemas/admin/products/createAttribute";
import { createProductSchema } from "~~/shared/schemas/admin/products/createProduct";
import { updateProductSchema } from "~~/shared/schemas/admin/products/updateProduct";

const CREATE_CATEGORY_VALUE = "__create_category__";
const CREATE_ATTRIBUTE_VALUE = "__create_attribute__";

type SelectValue = number | string | null | undefined;
type ProductEditorField =
  | "name"
  | "article"
  | "description"
  | "currentPrice"
  | "costPrice"
  | "oldPrice"
  | "ozonLink"
  | "isActive";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  productId?: number | null;
  categories: Category[];
  attributes: Attribute[];
}>();

const emit = defineEmits<{
  saved: [];
  dictionariesUpdated: [];
}>();

const loading = ref(false);
const submitting = ref(false);
const uploadingMain = ref(false);
const uploadingGallery = ref(false);
const creatingCategory = ref(false);
const creatingAttribute = ref(false);
const categoryCreateOpen = ref(false);
const attributeCreateOpen = ref(false);
const pendingAttributeIndex = ref<number | null>(null);
const newCategoryName = ref("");
const newCategoryError = ref<string | undefined>();
const newAttributeForm = reactive({
  name: "",
  unit: ""
});
const newAttributeErrors = reactive<Record<string, string | undefined>>({});
const localCategories = ref<Category[]>([]);
const localAttributes = ref<Attribute[]>([]);
const fieldErrors = reactive<Record<string, string | undefined>>({});
const productEditorModalUi = {
  content: "max-h-[calc(100dvh-2rem)] max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-zinc-950/20 ring-0 sm:max-h-[calc(100dvh-4rem)]",
  header: "shrink-0 border-b border-zinc-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6",
  body: "min-h-0 flex-1 overflow-y-auto overscroll-contain p-0",
  footer: "shrink-0 border-t border-zinc-100 bg-white/95 px-4 py-4 sm:px-6"
};
const compactModalUi = {
  content: "max-h-[calc(100dvh-2rem)] max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl shadow-zinc-950/20 ring-0",
  header: "shrink-0 px-5 pb-3 pt-5 sm:px-6",
  body: "min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6",
  footer: "shrink-0 border-t border-zinc-100 bg-[#f9fafb] px-5 py-4 sm:px-6"
};
const attributeModalUi = {
  ...compactModalUi,
  content: "max-h-[calc(100dvh-2rem)] max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-zinc-950/20 ring-0"
};
const modalInputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-900"
};
const editorTitle = computed(() => {
  if (!props.productId) {
    return "Новый товар";
  }

  return form.name ? `Редактировать: ${form.name}` : "Редактировать товар";
});
const editorDescription = computed(() =>
  props.productId
    ? "Обновите карточку товара, цены, изображения и характеристики."
    : "Заполните карточку товара, добавьте фото и подготовьте его к публикации."
);

function createEmptyForm(): ProductFormState {
  return {
    name: "",
    description: "",
    currentPrice: null,
    costPrice: null,
    oldPrice: null,
    article: "",
    mainImage: "",
    ozonLink: "",
    categoryId: undefined,
    isActive: true,
    productImages: [],
    productAttributes: []
  };
}

const form = reactive<ProductFormState>(createEmptyForm());

watch(
  () => props.categories,
  (categories) => {
    localCategories.value = sortByName(categories);
  },
  { immediate: true }
);

watch(
  () => props.attributes,
  (attributes) => {
    localAttributes.value = sortByName(attributes);
  },
  { immediate: true }
);

const attributeOrderBoost = ref<Map<number, number>>(new Map());
let attributeBoostCounter = 0;

const categoryItems = computed(() => [
  {
    label: "Создать новую категорию",
    value: CREATE_CATEGORY_VALUE,
    class: "text-[var(--admin-accent)]"
  },
  { type: "separator" as const },
  ...localCategories.value.map((category) => ({
    label: category.name,
    value: category.id
  }))
]);

const attributeItems = computed(() => {
  const sortedAttributes = [...localAttributes.value].sort((first, second) => {
    const firstBoost = attributeOrderBoost.value.get(first.id) ?? 0;
    const secondBoost = attributeOrderBoost.value.get(second.id) ?? 0;

    if (firstBoost !== secondBoost) {
      return secondBoost - firstBoost;
    }

    return first.name.localeCompare(second.name, "ru");
  });

  return [
    {
      label: "Создать новую характеристику",
      value: CREATE_ATTRIBUTE_VALUE,
      class: "text-[var(--admin-accent)]"
    },
    { type: "separator" as const },
    ...sortedAttributes.map((attribute) => ({
      label: attribute.unit ? `${attribute.name}, ${attribute.unit}` : attribute.name,
      value: attribute.id
    }))
  ];
});

function sortByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((first, second) => first.name.localeCompare(second.name, "ru"));
}

function upsertCategory(category: Category) {
  localCategories.value = sortByName([
    ...localCategories.value.filter((item) => item.id !== category.id),
    category
  ]);
}

function upsertAttribute(attribute: Attribute) {
  localAttributes.value = sortByName([
    ...localAttributes.value.filter((item) => item.id !== attribute.id),
    attribute
  ]);
  attributeOrderBoost.value.set(attribute.id, ++attributeBoostCounter);
}

function toPositiveInt(value: SelectValue) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : undefined;
}

function handleCategorySelect(value: SelectValue) {
  if (value === CREATE_CATEGORY_VALUE) {
    openCategoryCreator();
    return;
  }

  form.categoryId = toPositiveInt(value);
  fieldErrors.categoryId = undefined;
}

function handleAttributeSelect(index: number, value: SelectValue) {
  if (value === CREATE_ATTRIBUTE_VALUE) {
    openAttributeCreator(index);
    return;
  }

  const target = form.productAttributes[index];

  if (target) {
    target.attributeId = toPositiveInt(value);
  }
}

function updateFormField<T extends ProductEditorField>(field: T, value: ProductFormState[T]) {
  form[field] = value;
  fieldErrors[field] = undefined;
}

function updateAttributeValue(index: number, value: string) {
  const target = form.productAttributes[index];

  if (target) {
    target.value = value;
  }
}

function openCategoryCreator() {
  newCategoryName.value = "";
  newCategoryError.value = undefined;
  categoryCreateOpen.value = true;
}

function closeCategoryCreator() {
  categoryCreateOpen.value = false;
}

function openAttributeCreator(index: number | null = null) {
  pendingAttributeIndex.value = index;
  newAttributeForm.name = "";
  newAttributeForm.unit = "";
  clearFieldErrors(newAttributeErrors);
  attributeCreateOpen.value = true;
}

function closeAttributeCreator() {
  pendingAttributeIndex.value = null;
  attributeCreateOpen.value = false;
}

function resetForm(next = createEmptyForm()) {
  clearFieldErrors(fieldErrors);
  Object.assign(form, next);
}

function mapProductToForm(product: ProductDetails): ProductFormState {
  return {
    name: product.name,
    description: product.description,
    currentPrice: toNumber(product.currentPrice),
    costPrice: product.costPrice === null || product.costPrice === undefined ? null : toNumber(product.costPrice),
    oldPrice: product.oldPrice === null || product.oldPrice === undefined ? null : toNumber(product.oldPrice),
    article: product.article,
    mainImage: product.mainImage,
    ozonLink: product.ozonLink ?? "",
    categoryId: product.categoryId,
    isActive: product.isActive,
    productImages: product.productImages.map((image) => ({ url: image.url })),
    productAttributes: product.productAttributes.map((attribute) => ({
      attributeId: attribute.attributeId,
      value: attribute.value
    }))
  };
}

async function loadProduct() {
  if (!props.productId) {
    resetForm();
    return;
  }

  loading.value = true;

  try {
    const product = await adminFetch<ProductDetails>(`/api/admin/products/${props.productId}`);
    resetForm(mapProductToForm(product));
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить товар"));
    open.value = false;
  } finally {
    loading.value = false;
  }
}

async function createCategory() {
  if (creatingCategory.value) {
    return;
  }

  const parsed = categorySchema.safeParse({ name: newCategoryName.value });

  if (!parsed.success) {
    newCategoryError.value = getZodFieldErrors(parsed.error).name ?? "Проверьте название категории";
    return;
  }

  newCategoryError.value = undefined;
  creatingCategory.value = true;

  try {
    const result = await adminFetch<{ success: boolean; category: Category }>("/api/admin/categories", {
      method: "POST",
      body: parsed.data
    });

    upsertCategory(result.category);
    form.categoryId = result.category.id;
    fieldErrors.categoryId = undefined;
    newCategoryName.value = "";
    categoryCreateOpen.value = false;
    emit("dictionariesUpdated");
    toast.success(`Категория "${result.category.name}" создана`);
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось создать категорию"));
  } finally {
    creatingCategory.value = false;
  }
}

async function createAttribute() {
  if (creatingAttribute.value) {
    return;
  }

  const parsed = createAttributeSchema.safeParse({
    name: newAttributeForm.name,
    unit: newAttributeForm.unit
  });

  if (!parsed.success) {
    replaceFieldErrors(newAttributeErrors, getZodFieldErrors(parsed.error));
    return;
  }

  clearFieldErrors(newAttributeErrors);
  creatingAttribute.value = true;

  try {
    const result = await adminFetch<{ success: boolean; attribute: Attribute }>("/api/admin/products/attributes", {
      method: "POST",
      body: parsed.data
    });

    upsertAttribute(result.attribute);

    const targetIndex = pendingAttributeIndex.value;
    const targetAttribute = targetIndex === null ? undefined : form.productAttributes[targetIndex];

    if (targetAttribute) {
      targetAttribute.attributeId = result.attribute.id;
    } else {
      form.productAttributes.unshift({
        attributeId: result.attribute.id,
        value: ""
      });
    }

    fieldErrors.productAttributes = undefined;
    newAttributeForm.name = "";
    newAttributeForm.unit = "";
    pendingAttributeIndex.value = null;
    attributeCreateOpen.value = false;
    emit("dictionariesUpdated");
    toast.success(`Характеристика "${result.attribute.name}" создана`);
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось создать характеристику"));
  } finally {
    creatingAttribute.value = false;
  }
}

function addAttribute() {
  form.productAttributes.unshift({
    attributeId: undefined,
    value: ""
  });
}

function removeAttribute(index: number) {
  form.productAttributes.splice(index, 1);
}

function addGalleryUrl() {
  form.productImages.push({ url: "" });
}

function removeGalleryImage(index: number) {
  form.productImages.splice(index, 1);
}

function updateMainImage(value: string) {
  form.mainImage = value;
  fieldErrors.mainImage = undefined;
}

function updateGalleryImage(index: number, value: string) {
  const target = form.productImages[index];

  if (target) {
    target.url = value;
    fieldErrors.productImages = undefined;
  }
}

function closeEditor() {
  open.value = false;
}

function buildPayload() {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    currentPrice: form.currentPrice,
    costPrice: form.costPrice === null || form.costPrice === undefined ? undefined : form.costPrice,
    oldPrice: form.oldPrice === null || form.oldPrice === undefined ? undefined : form.oldPrice,
    article: form.article.trim(),
    mainImage: form.mainImage.trim(),
    ozonLink: form.ozonLink.trim() || undefined,
    categoryId: form.categoryId,
    isActive: form.isActive,
    productImages: form.productImages
      .map((image) => ({ url: image.url.trim() }))
      .filter((image) => image.url),
    productAttributes: form.productAttributes
      .filter((attribute) => attribute.attributeId && attribute.value.trim())
      .map((attribute) => ({
        attributeId: attribute.attributeId,
        value: attribute.value.trim()
      }))
  };
}

async function save() {
  if (submitting.value || loading.value) {
    return;
  }

  const payload = buildPayload();
  const schema = props.productId ? updateProductSchema : createProductSchema;
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    replaceFieldErrors(fieldErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте поля товара");
    return;
  }

  clearFieldErrors(fieldErrors);
  submitting.value = true;

  try {
    if (props.productId) {
      await adminFetch(`/api/admin/products/update/${props.productId}`, {
        method: "POST",
        body: parsed.data
      });
      toast.success("Товар обновлён");
    } else {
      await adminFetch("/api/admin/products", {
        method: "POST",
        body: parsed.data
      });
      toast.success("Товар создан");
    }

    emit("saved");
    open.value = false;
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось сохранить товар"));
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
    form.mainImage = result.url;
    toast.success("Изображение загружено");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить изображение"));
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
    form.productImages.push({ url: result.url });
    toast.success("Изображение добавлено в галерею");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить изображение"));
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
