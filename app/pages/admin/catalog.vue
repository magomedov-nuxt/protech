<template>
  <div class="catalog-shop-page space-y-5">
    <AdminPageHeader title="Справочники" kicker="Каталог"
      description="Категории товаров и характеристики, которые используются в карточках каталога.">
      <template #actions>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="pending" @click="refresh()">
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <UAlert v-if="error" color="error" variant="soft" title="Не удалось загрузить справочники"
      :description="getErrorMessage(error)" class="rounded-2xl" />

    <div class="grid gap-4 xl:grid-cols-2">
      <UCard class="admin-list-card" :ui="{ body: 'p-0' }">
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="admin-section-heading">
                Категории
              </p>
              <p class="admin-section-copy">
                Основная группировка товаров.
              </p>
            </div>
            <UButton color="primary" icon="i-lucide-plus" size="lg"
              class="h-11 rounded-full px-4 shadow-lg shadow-emerald-950/10"
              @click="openCategoryForm()">
              Добавить
            </UButton>
          </div>
        </template>

        <div v-if="categories.length" class="space-y-3 bg-[#f9fafb] p-3 sm:p-4">
          <div v-for="category in categories" :key="category.id"
            class="flex items-center justify-between gap-4 rounded-[1.5rem] bg-white p-4 shadow-[0_18px_50px_rgba(24,24,27,0.08)] ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(24,24,27,0.12)]">
            <div class="min-w-0">
              <p class="truncate font-medium text-(--admin-text)">
                {{ category.name }}
              </p>
              <p class="text-xs text-(--admin-text-muted)">
                ID {{ category.id }}
              </p>
            </div>
            <div class="flex gap-3">
              <UTooltip text="Редактировать">
                <UButton color="neutral" variant="ghost" square
                  class="admin-touch-icon rounded-full bg-[#f9fafb] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                  aria-label="Редактировать категорию" @click="openCategoryForm(category)">
                  <Pencil class="size-4" />
                </UButton>
              </UTooltip>
              <UTooltip text="Удалить">
                <UButton color="error" variant="ghost" square class="admin-touch-icon rounded-full" aria-label="Удалить категорию"
                  :loading="deletingCategoryId === category.id" @click="deleteCategory(category)">
                  <Trash2 class="size-4" />
                </UButton>
              </UTooltip>
            </div>
          </div>
        </div>
        <AdminEmptyState v-else-if="!pending" title="Категорий пока нет"
          description="Создайте первую категорию, чтобы сгруппировать товары каталога.">
          <template #icon>
            <FolderTree class="size-6" />
          </template>
          <template #actions>
            <UButton color="primary" size="lg" class="h-11 rounded-full px-4" @click="openCategoryForm()">
              Добавить категорию
            </UButton>
          </template>
        </AdminEmptyState>
      </UCard>

      <UCard class="admin-list-card" :ui="{ body: 'p-0' }">
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="admin-section-heading">
                Характеристики
              </p>
              <p class="admin-section-copy">
                Параметры, которые привязываются к товарам.
              </p>
            </div>
            <UButton color="primary" icon="i-lucide-plus" size="lg"
              class="h-11 rounded-full px-4 shadow-lg shadow-emerald-950/10"
              @click="openAttributeForm()">
              Добавить
            </UButton>
          </div>
        </template>

        <div v-if="attributes.length" class="space-y-3 bg-[#f9fafb] p-3 sm:p-4">
          <div v-for="attribute in attributes" :key="attribute.id"
            class="flex items-center justify-between gap-4 rounded-[1.5rem] bg-white p-4 shadow-[0_18px_50px_rgba(24,24,27,0.08)] ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(24,24,27,0.12)]">
            <div class="min-w-0">
              <p class="truncate font-medium text-(--admin-text)">
                {{ attribute.name }}
                <span v-if="attribute.unit" class="text-(--admin-text-muted)">
                  · {{ attribute.unit }}
                </span>
              </p>
              <p class="text-xs text-(--admin-text-muted)">
                Используется: {{ attribute._count?.productAttributes ?? 0 }}
              </p>
            </div>
            <div class="flex gap-3">
              <UTooltip text="Редактировать">
                <UButton color="neutral" variant="ghost" square
                  class="admin-touch-icon rounded-full bg-[#f9fafb] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                  aria-label="Редактировать характеристику" @click="openAttributeForm(attribute)">
                  <Pencil class="size-4" />
                </UButton>
              </UTooltip>
              <UTooltip text="Удалить">
                <UButton color="error" variant="ghost" square class="admin-touch-icon rounded-full" aria-label="Удалить характеристику"
                  :loading="deletingAttributeId === attribute.id" @click="deleteAttribute(attribute)">
                  <Trash2 class="size-4" />
                </UButton>
              </UTooltip>
            </div>
          </div>
        </div>
        <AdminEmptyState v-else-if="!pending" title="Характеристик пока нет"
          description="Добавьте параметры, которые помогут сравнивать товары внутри категорий.">
          <template #icon>
            <ListChecks class="size-6" />
          </template>
          <template #actions>
            <UButton color="primary" size="lg" class="h-11 rounded-full px-4" @click="openAttributeForm()">
              Добавить характеристику
            </UButton>
          </template>
        </AdminEmptyState>
      </UCard>
    </div>

    <UModal v-model:open="categoryModalOpen" :title="editingCategory ? 'Редактировать категорию' : 'Новая категория'">
      <template #body>
        <UFormField label="Название" required :error="categoryErrors.name">
          <UInput v-model="categoryName" size="lg" class="w-full rounded-2xl bg-[#f9fafb]"
            placeholder="Название категории" />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" size="lg" class="h-11 rounded-full px-4" @click="closeCategoryForm">
            Отмена
          </UButton>
          <UButton color="primary" size="lg" class="h-11 rounded-full px-4" :loading="savingCategory" @click="saveCategory">
            Сохранить
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="attributeModalOpen"
      :title="editingAttribute ? 'Редактировать характеристику' : 'Новая характеристика'">
      <template #body>
        <div class="grid gap-5 sm:grid-cols-2">
          <UFormField label="Название" required :error="attributeErrors.name">
            <UInput v-model="attributeForm.name" size="lg" class="w-full rounded-2xl bg-[#f9fafb]"
              placeholder="Например, Мощность" />
          </UFormField>
          <UFormField label="Единица" :error="attributeErrors.unit">
            <UInput v-model="attributeForm.unit" size="lg" class="w-full rounded-2xl bg-[#f9fafb]"
              placeholder="Вт, мм, шт." />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" size="lg" class="h-11 rounded-full px-4" @click="closeAttributeForm">
            Отмена
          </UButton>
          <UButton color="primary" size="lg" class="h-11 rounded-full px-4" :loading="savingAttribute" @click="saveAttribute">
            Сохранить
          </UButton>
        </div>
      </template>
    </UModal>

    <AdminConfirmModal v-model:open="confirmOpen" v-bind="confirmOptions" :loading="confirmLoading"
      @confirm="runConfirmedAction" />
  </div>
</template>

<script setup lang="ts">
import { FolderTree, ListChecks, Pencil, Trash2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { useAdminConfirmation } from "~~/app/shared/lib/useAdminConfirmation";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { Attribute, Category } from "~~/app/shared/types/admin";
import { categorySchema } from "~~/shared/schemas/admin/products/category";
import { createAttributeSchema } from "~~/shared/schemas/admin/products/createAttribute";
import { updateAttributeSchema } from "~~/shared/schemas/admin/products/updateAttribute";

definePageMeta({
  layout: "admin"
});

const categoryModalOpen = ref(false);
const attributeModalOpen = ref(false);
const savingCategory = ref(false);
const savingAttribute = ref(false);
const deletingCategoryId = ref<number | null>(null);
const deletingAttributeId = ref<number | null>(null);
const editingCategory = ref<Category | null>(null);
const editingAttribute = ref<Attribute | null>(null);
const categoryName = ref("");
const attributeForm = reactive({
  name: "",
  unit: ""
});
const categoryErrors = reactive<Record<string, string | undefined>>({});
const attributeErrors = reactive<Record<string, string | undefined>>({});
const {
  confirmLoading,
  confirmOpen,
  confirmOptions,
  requestConfirm,
  runConfirmedAction
} = useAdminConfirmation();

const { data, pending, error, refresh } = await useAsyncData("admin-catalog-dictionaries", async () => {
  const [categories, attributes] = await Promise.all([
    adminFetch<Category[]>("/api/admin/categories"),
    adminFetch<Attribute[]>("/api/admin/products/attributes")
  ]);

  return { categories, attributes };
});

const categories = computed(() => data.value?.categories ?? []);
const attributes = computed(() => data.value?.attributes ?? []);

function openCategoryForm(category?: Category) {
  editingCategory.value = category ?? null;
  categoryName.value = category?.name ?? "";
  clearFieldErrors(categoryErrors);
  categoryModalOpen.value = true;
}

function openAttributeForm(attribute?: Attribute) {
  editingAttribute.value = attribute ?? null;
  attributeForm.name = attribute?.name ?? "";
  attributeForm.unit = attribute?.unit ?? "";
  clearFieldErrors(attributeErrors);
  attributeModalOpen.value = true;
}

function closeCategoryForm() {
  categoryModalOpen.value = false;
}

function closeAttributeForm() {
  attributeModalOpen.value = false;
}

async function saveCategory() {
  const parsed = categorySchema.safeParse({ name: categoryName.value });

  if (!parsed.success) {
    replaceFieldErrors(categoryErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте название категории");
    return;
  }

  clearFieldErrors(categoryErrors);
  savingCategory.value = true;

  try {
    if (editingCategory.value) {
      await adminFetch(`/api/admin/categories/update/${editingCategory.value.id}`, {
        method: "POST",
        body: parsed.data
      });
      toast.success("Категория обновлена");
    } else {
      await adminFetch("/api/admin/categories", {
        method: "POST",
        body: parsed.data
      });
      toast.success("Категория создана");
    }

    categoryModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось сохранить категорию"));
  } finally {
    savingCategory.value = false;
  }
}

async function saveAttribute() {
  const body = {
    name: attributeForm.name,
    unit: attributeForm.unit
  };
  const parsed = (editingAttribute.value ? updateAttributeSchema : createAttributeSchema).safeParse(body);

  if (!parsed.success) {
    replaceFieldErrors(attributeErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте поля характеристики");
    return;
  }

  clearFieldErrors(attributeErrors);
  savingAttribute.value = true;

  try {
    if (editingAttribute.value) {
      await adminFetch(`/api/admin/products/attributes/update/${editingAttribute.value.id}`, {
        method: "POST",
        body: parsed.data
      });
      toast.success("Характеристика обновлена");
    } else {
      await adminFetch("/api/admin/products/attributes", {
        method: "POST",
        body: parsed.data
      });
      toast.success("Характеристика создана");
    }

    attributeModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось сохранить характеристику"));
  } finally {
    savingAttribute.value = false;
  }
}

function deleteCategory(category: Category) {
  requestConfirm({
    title: "Удалить категорию",
    message: `Удалить категорию "${category.name}"?`,
    hint: "Категорию нельзя удалить, если к ней привязаны товары.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    deletingCategoryId.value = category.id;

    try {
      await adminFetch(`/api/admin/categories/delete/${category.id}`, {
        method: "POST"
      });
      toast.success("Категория удалена");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить категорию"));
    } finally {
      deletingCategoryId.value = null;
    }
  });
}

function deleteAttribute(attribute: Attribute) {
  requestConfirm({
    title: "Удалить характеристику",
    message: `Удалить характеристику "${attribute.name}"?`,
    hint: "Значения этой характеристики у товаров будут удалены каскадно.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    deletingAttributeId.value = attribute.id;

    try {
      await adminFetch(`/api/admin/products/attributes/delete/${attribute.id}`, {
        method: "POST"
      });
      toast.success("Характеристика удалена");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить характеристику"));
    } finally {
      deletingAttributeId.value = null;
    }
  });
}
</script>
