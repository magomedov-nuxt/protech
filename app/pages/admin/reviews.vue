<template>
  <div class="reviews-shop-page space-y-5">
    <AdminPageHeader title="Отзывы" kicker="Покупатели"
      description="Модерация отзывов, ответы покупателям и контроль качества карточек товаров.">
      <template #actions>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="pending" @click="refresh()">
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <section class="rounded-3xl bg-white/90 p-4 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur sm:p-5">
      <div>
        <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-700">Режим модерации</span>
        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <UButton color="neutral" :variant="!filters.reviews.pendingOnly ? 'solid' : 'ghost'"
            icon="i-lucide-list-filter" size="lg" class="h-12 justify-center rounded-full px-4"
            :class="!filters.reviews.pendingOnly ? 'shadow-lg shadow-zinc-950/10' : 'bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 hover:text-zinc-950'"
            @click="setReviewsPendingOnly(false)">
            Все отзывы
          </UButton>
          <UButton color="primary" :variant="filters.reviews.pendingOnly ? 'solid' : 'ghost'" icon="i-lucide-clock-3"
            size="lg" class="h-12 justify-center rounded-full px-4"
            :class="filters.reviews.pendingOnly ? 'shadow-lg shadow-emerald-950/10' : 'bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 hover:text-zinc-950'"
            @click="setReviewsPendingOnly(true)">
            Очередь ответов
          </UButton>
        </div>
      </div>
    </section>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-zinc-500">
        {{ reviewsStatusText }}
      </p>

      <div v-auto-animate class="flex flex-wrap gap-2">
        <UButton v-if="filters.reviews.pendingOnly" color="neutral" variant="ghost" size="lg" icon="i-lucide-rotate-ccw"
          class="h-11 rounded-full bg-white px-4 text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          @click="setReviewsPendingOnly(false)">
          Сбросить
        </UButton>
        <UBadge color="primary" variant="soft" class="rounded-full px-3 py-1">
          {{ selectedReviewModeLabel }}
        </UBadge>
      </div>
    </div>

    <section v-if="selectedReviewIds.length"
      class="rounded-3xl bg-white/90 p-4 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur sm:p-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="admin-section-heading">
            Выбрано отзывов: {{ selectedReviewIds.length }}
          </p>
          <p class="admin-section-copy">
            Массово меняйте статус ответа, экспортируйте или удаляйте выбранные отзывы.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton color="primary" variant="soft" size="lg" class="h-11 rounded-full px-4" :loading="bulkLoading === 'markAnswered'"
            @click="bulkMarkAnswered(true)">
            <CheckCircle2 class="size-4" />
            Отвечено
          </UButton>
          <UButton color="neutral" variant="soft" size="lg" class="h-11 rounded-full px-4" :loading="bulkLoading === 'markUnanswered'"
            @click="bulkMarkAnswered(false)">
            <CircleOff class="size-4" />
            Без ответа
          </UButton>
          <UButton color="neutral" variant="ghost" size="lg"
            class="h-11 rounded-full bg-white px-4 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100" @click="exportSelectedReviews">
            <Download class="size-4" />
            Экспорт
          </UButton>
          <UButton color="error" variant="soft" size="lg" class="h-11 rounded-full px-4" :loading="bulkLoading === 'delete'"
            @click="confirmBulkDelete">
            <Trash2 class="size-4" />
            Удалить
          </UButton>
        </div>
      </div>
    </section>

    <UAlert v-if="error" color="error" variant="soft" title="Не удалось загрузить отзывы"
      :description="getErrorMessage(error)" class="rounded-2xl" />

    <section class="admin-list-card">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <p class="admin-section-heading">
            Лента отзывов
          </p>
          <p class="admin-section-copy">
            Сортировка по свежести, ответы публикуются от имени администратора.
          </p>
        </div>
        <label v-if="reviews.length"
          class="admin-check-target inline-flex items-center gap-2 rounded-full bg-[#f9fafb] px-3 py-2 text-sm font-medium text-zinc-600">
          <input v-model="allReviewsOnPageSelected" class="admin-check-input rounded border-zinc-200 accent-(--admin-accent)"
            type="checkbox">
          Выбрать страницу
        </label>
      </div>

      <div v-if="reviews.length" class="space-y-4 bg-[#f9fafb] p-3 sm:p-4">
        <article v-for="review in reviews" :key="review.id"
          class="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_50px_rgba(24,24,27,0.08)] ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(24,24,27,0.12)] sm:p-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="flex min-w-0 gap-3">
              <label class="admin-check-target mt-1 grid shrink-0 cursor-pointer place-items-center rounded-full bg-[#f9fafb] shadow-sm shadow-zinc-950/5">
                <input :checked="selectedReviewIds.includes(review.id)"
                  class="admin-check-input rounded border-zinc-200 accent-(--admin-accent)" type="checkbox"
                  :aria-label="`Выбрать отзыв ${review.id}`" @change="toggleReviewSelection(review.id, $event)">
              </label>
              <img :src="review.product.mainImage" alt="" class="size-16 shrink-0 rounded-2xl object-cover">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="truncate text-lg font-semibold text-zinc-950">
                    {{ review.product.name }}
                  </p>
                  <AdminStatusBadge type="boolean" :value="review.isAnswered" true-label="Отвечено"
                    false-label="Ждёт ответа" />
                </div>
                <p class="mt-1 text-sm leading-6 text-zinc-500">
                  {{ review.user.name || review.user.email }} · {{ formatDate(review.createdAt) }}
                </p>
                <div class="mt-2 flex items-center gap-1">
                  <Star v-for="star in 5" :key="star" :class="[
                    'size-4',
                    star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'
                  ]" />
                  <span class="ml-1 text-xs font-semibold text-zinc-500">
                    {{ review.rating }}/5
                  </span>
                </div>
              </div>
            </div>

            <div class="flex shrink-0 gap-1">
              <UTooltip text="Редактировать">
                <UButton color="neutral" variant="ghost" square
                  class="admin-touch-icon rounded-full bg-[#f9fafb] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                  aria-label="Редактировать отзыв" @click="openEditReview(review)">
                  <Pencil class="size-4" />
                </UButton>
              </UTooltip>
              <UTooltip text="Удалить">
                <UButton color="error" variant="ghost" square class="admin-touch-icon rounded-full" aria-label="Удалить отзыв"
                  :loading="deletingReviewId === review.id" @click="deleteReview(review)">
                  <Trash2 class="size-4" />
                </UButton>
              </UTooltip>
            </div>
          </div>

          <details class="mt-4 rounded-2xl bg-[#f9fafb] p-4 sm:hidden">
            <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-1 text-sm font-semibold text-zinc-950">
              Детали отзыва
              <UIcon name="i-lucide-chevron-down" class="size-5 text-(--admin-text-muted)" />
            </summary>
            <div class="mt-3 space-y-3">
              <div>
                <p class="text-xs font-semibold uppercase text-zinc-400">
                  Достоинства
                </p>
                <p class="mt-2 text-sm leading-6 text-zinc-950">
                  {{ review.advantages || "Не указаны" }}
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase text-zinc-400">
                  Недостатки
                </p>
                <p class="mt-2 text-sm leading-6 text-zinc-950">
                  {{ review.disadvantages || "Не указаны" }}
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase text-zinc-400">
                  Комментарий
                </p>
                <p class="mt-2 text-sm leading-6 text-zinc-950">
                  {{ review.comment || "Без комментария" }}
                </p>
              </div>
            </div>
          </details>

          <div class="mt-4 hidden gap-3 sm:grid lg:grid-cols-3">
            <div class="rounded-2xl bg-[#f9fafb] p-4">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Достоинства
              </p>
              <p class="mt-2 text-sm leading-6 text-zinc-950">
                {{ review.advantages || "Не указаны" }}
              </p>
            </div>
            <div class="rounded-2xl bg-[#f9fafb] p-4">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Недостатки
              </p>
              <p class="mt-2 text-sm leading-6 text-zinc-950">
                {{ review.disadvantages || "Не указаны" }}
              </p>
            </div>
            <div class="rounded-2xl bg-[#f9fafb] p-4">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Комментарий
              </p>
              <p class="mt-2 text-sm leading-6 text-zinc-950">
                {{ review.comment || "Без комментария" }}
              </p>
            </div>
          </div>

          <div v-if="review.reviewPhotos.length" class="mt-4 flex flex-wrap gap-2">
            <button v-for="(photo, photoIndex) in review.reviewPhotos" :key="photo.id ?? `${review.id}-${photoIndex}`"
              type="button"
              class="group relative size-20 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm shadow-zinc-950/10 ring-1 ring-transparent transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-950/15 hover:ring-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              :aria-label="`Открыть фото отзыва ${photoIndex + 1}`" @click="openReviewPhoto(review, photoIndex)">
              <img :src="photo.url" alt="" class="size-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy">
              <span class="pointer-events-none absolute inset-0 grid place-items-center bg-zinc-950/0 text-white opacity-0 transition duration-300 group-hover:bg-zinc-950/20 group-hover:opacity-100">
                <UIcon name="i-lucide-expand" class="size-5 drop-shadow" />
              </span>
            </button>
          </div>

          <div v-if="review.reviewAnswers.length" class="mt-4 rounded-2xl bg-[#f9fafb] p-4">
            <p class="text-base font-semibold text-zinc-950">
              Ответы администратора
            </p>
            <div class="mt-3 space-y-2">
              <div v-for="answer in review.reviewAnswers" :key="answer.id"
                class="rounded-2xl bg-white p-4 text-sm shadow-sm shadow-zinc-950/5">
                <p class="leading-6 text-zinc-950">
                  {{ answer.text }}
                </p>
                <p class="mt-2 text-xs text-zinc-500">
                  {{ answer.user?.name || "Администратор" }} · {{ formatDate(answer.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <AdminAnswerBox v-model="answerDrafts[review.id]" class="mt-4" :loading="answeringId === review.id"
            title="Ответ покупателю" :hint="`Ответ будет опубликован в отзыве к товару «${review.product.name}».`"
            placeholder="Напишите ответ на отзыв покупателя" button-label="Ответить" @submit="answerReview(review)" />
        </article>
      </div>

      <AdminEmptyState v-if="!reviews.length && !pending" title="Отзывы не найдены"
        description="Новые отзывы покупателей появятся здесь.">
        <template #icon>
          <MessageSquareText class="size-6" />
        </template>
      </AdminEmptyState>

      <AdminPagination v-if="reviewsData?.pagination" :pagination="reviewsData.pagination" :loading="pending"
        @update:page="page = $event" />
    </section>

    <UModal v-model:open="reviewModalOpen" title="Редактировать отзыв" scrollable>
      <template #body>
        <div class="space-y-4">
          <UFormField label="Рейтинг" required :error="reviewErrors.rating">
            <UInput v-model.number="reviewForm.rating" class="w-full" size="lg" type="number" min="1" max="5" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Достоинства" :error="reviewErrors.advantages">
              <UTextarea v-model="reviewForm.advantages" class="w-full" :rows="3" />
            </UFormField>
            <UFormField label="Недостатки" :error="reviewErrors.disadvantages">
              <UTextarea v-model="reviewForm.disadvantages" class="w-full" :rows="3" />
            </UFormField>
          </div>

          <UFormField label="Комментарий" :error="reviewErrors.comment">
            <UTextarea v-model="reviewForm.comment" class="w-full" :rows="4" />
          </UFormField>

          <section class="space-y-3 rounded-2xl bg-[#f9fafb] p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="admin-section-heading">
                Фотографии
              </p>
              <UButton color="primary" variant="soft" size="lg" type="button" class="h-11 rounded-full px-4" @click="addReviewPhoto">
                <Plus class="size-4" />
                URL
              </UButton>
            </div>
            <p v-if="reviewErrors.reviewPhotos" class="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              {{ reviewErrors.reviewPhotos }}
            </p>
            <div v-for="(photo, index) in reviewForm.reviewPhotos" :key="index" class="grid grid-cols-[1fr_auto] gap-2">
              <UInput v-model="photo.url" class="w-full" size="lg" placeholder="URL изображения" />
              <UButton color="error" variant="ghost" square type="button" class="admin-touch-icon rounded-full" aria-label="Удалить фото"
                @click="removeReviewPhoto(index)">
                <Trash2 class="size-4" />
              </UButton>
            </div>
          </section>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" size="lg" class="h-11 rounded-full px-4" @click="closeReviewModal">
            Отмена
          </UButton>
          <UButton color="primary" size="lg" class="h-11 rounded-full px-4" :loading="savingReview" @click="saveReview">
            Сохранить
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="reviewPhotoOpen" title="Фото отзыва" :ui="reviewPhotoModalUi">
      <template #body>
        <div v-if="activeReviewPhoto" class="relative overflow-hidden rounded-2xl bg-[#f9fafb]">
          <img :src="activeReviewPhoto.url" :alt="activeReviewPhotoAlt"
            class="mx-auto block max-h-[82dvh] max-w-full object-contain">
          <div class="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-lg shadow-zinc-950/10 backdrop-blur-xl">
            {{ activeReviewPhotoIndex + 1 }} / {{ activeReviewPhotos.length }}
          </div>
          <div v-if="activeReviewPhotos.length > 1"
            class="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4">
            <UButton color="neutral" variant="soft" icon="i-lucide-chevron-left" size="xl" square
              class="admin-touch-icon rounded-full bg-white/90 shadow-xl shadow-black/20 backdrop-blur-xl transition hover:scale-105"
              aria-label="Предыдущее фото" @click="previousReviewPhoto" />
            <UButton color="neutral" variant="soft" icon="i-lucide-chevron-right" size="xl" square
              class="admin-touch-icon rounded-full bg-white/90 shadow-xl shadow-black/20 backdrop-blur-xl transition hover:scale-105"
              aria-label="Следующее фото" @click="nextReviewPhoto" />
          </div>
        </div>
      </template>
    </UModal>

    <AdminConfirmModal v-model:open="confirmOpen" v-bind="confirmOptions" :loading="confirmLoading"
      @confirm="runConfirmedAction" />
  </div>
</template>

<script setup lang="ts">
import {
  CheckCircle2,
  CircleOff,
  Download,
  MessageSquareText,
  Pencil,
  Plus,
  Star,
  Trash2
} from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { downloadCsv } from "~~/app/shared/lib/csvExport";
import {
  buildQuery,
  formatDate,
  formatNumber,
  getErrorMessage
} from "~~/app/shared/lib/adminFormatters";
import { useAdminConfirmation } from "~~/app/shared/lib/useAdminConfirmation";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import { useAdminFiltersStore } from "~~/app/stores/adminFilters";
import type { PaginatedResponse, ReviewListItem } from "~~/app/shared/types/admin";
import { reviewAnswerSchema } from "~~/shared/schemas/admin/reviews/reviewAnswer";
import { updateReviewSchema } from "~~/shared/schemas/user/reviews/updateReview";

type ReviewPhoto = ReviewListItem["reviewPhotos"][number];

definePageMeta({
  layout: "admin"
});

const filters = useAdminFiltersStore();
const page = ref(1);
const selectedReviewIds = ref<number[]>([]);
const answerDrafts = reactive<Record<number, string>>({});
const answeringId = ref<number | null>(null);
const deletingReviewId = ref<number | null>(null);
const bulkLoading = ref<string | null>(null);
const reviewModalOpen = ref(false);
const reviewPhotoOpen = ref(false);
const savingReview = ref(false);
const editingReview = ref<ReviewListItem | null>(null);
const activeReviewPhotos = ref<ReviewPhoto[]>([]);
const activeReviewPhotoIndex = ref(0);
const reviewErrors = reactive<Record<string, string | undefined>>({});
const {
  confirmLoading,
  confirmOpen,
  confirmOptions,
  requestConfirm,
  runConfirmedAction
} = useAdminConfirmation();
const reviewForm = reactive({
  rating: 5,
  advantages: "",
  disadvantages: "",
  comment: "",
  reviewPhotos: [] as Array<{ url: string }>
});

watch(() => filters.reviews.pendingOnly, () => {
  page.value = 1;
});

const query = computed(() => buildQuery({
  page: page.value,
  pending: filters.reviews.pendingOnly
}));

const { data: reviewsData, pending, error, refresh } = await useAsyncData(
  "admin-reviews-list",
  () => adminFetch<PaginatedResponse<ReviewListItem>>(`/api/admin/reviews${query.value}`),
  { watch: [query] }
);

const reviews = computed(() => reviewsData.value?.items ?? []);
const selectedReviews = computed(() => reviews.value.filter((review) => selectedReviewIds.value.includes(review.id)));

const selectedReviewModeLabel = computed(() => filters.reviews.pendingOnly ? "Очередь ответов" : "Все отзывы");
const activeReviewPhoto = computed(() => activeReviewPhotos.value[activeReviewPhotoIndex.value] ?? null);
const activeReviewPhotoAlt = computed(() => activeReviewPhoto.value ? `Фото отзыва ${activeReviewPhotoIndex.value + 1}` : "Фото отзыва");
const reviewsStatusText = computed(() => {
  const pagination = reviewsData.value?.pagination;

  if (!pagination) {
    return pending.value ? "Загружаем отзывы..." : "Нет данных по отзывам";
  }

  if (pagination.total === 0) {
    return "По текущему фильтру отзывы не найдены";
  }

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return `Показаны ${formatNumber(start)}-${formatNumber(end)} из ${formatNumber(pagination.total)} отзывов`;
});
const allReviewsOnPageSelected = computed({
  get: () => reviews.value.length > 0 && reviews.value.every((review) => selectedReviewIds.value.includes(review.id)),
  set: (checked: boolean) => {
    const pageIds = reviews.value.map((review) => review.id);
    selectedReviewIds.value = checked
      ? [...new Set([...selectedReviewIds.value, ...pageIds])]
      : selectedReviewIds.value.filter((id) => !pageIds.includes(id));
  }
});
const reviewPhotoModalUi = {
  overlay: "bg-zinc-950/35 backdrop-blur-sm",
  content: "max-h-[calc(100dvh-2rem)] max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-zinc-950/20 ring-0",
  body: "overflow-hidden p-3 sm:p-4"
};

watch(reviews, (items) => {
  const visibleIds = new Set(items.map((review) => review.id));
  selectedReviewIds.value = selectedReviewIds.value.filter((id) => visibleIds.has(id));

  for (const review of items) {
    answerDrafts[review.id] ??= "";
  }
}, { immediate: true });

function setReviewsPendingOnly(value: boolean) {
  filters.reviews.pendingOnly = value;
}

function toggleReviewSelection(reviewId: number, event: Event) {
  const checked = (event.target as HTMLInputElement | null)?.checked ?? false;

  selectedReviewIds.value = checked
    ? [...new Set([...selectedReviewIds.value, reviewId])]
    : selectedReviewIds.value.filter((id) => id !== reviewId);
}

async function answerReview(review: ReviewListItem) {
  const text = answerDrafts[review.id]?.trim();
  const parsed = reviewAnswerSchema.safeParse({ text });

  if (!parsed.success) {
    toast.error(getZodFieldErrors(parsed.error).text ?? "Проверьте текст ответа");
    return;
  }

  answeringId.value = review.id;

  try {
    await adminFetch(`/api/admin/reviews/${review.id}/answer`, {
      method: "POST",
      body: parsed.data
    });
    answerDrafts[review.id] = "";
    toast.success("Ответ опубликован");
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось ответить на отзыв"));
  } finally {
    answeringId.value = null;
  }
}

function openEditReview(review: ReviewListItem) {
  editingReview.value = review;
  reviewForm.rating = review.rating;
  reviewForm.advantages = review.advantages ?? "";
  reviewForm.disadvantages = review.disadvantages ?? "";
  reviewForm.comment = review.comment ?? "";
  reviewForm.reviewPhotos = review.reviewPhotos.map((photo) => ({ url: photo.url }));
  clearFieldErrors(reviewErrors);
  reviewModalOpen.value = true;
}

function closeReviewModal() {
  reviewModalOpen.value = false;
}

function addReviewPhoto() {
  reviewForm.reviewPhotos.push({ url: "" });
}

function removeReviewPhoto(index: number) {
  reviewForm.reviewPhotos.splice(index, 1);
}

function openReviewPhoto(review: ReviewListItem, photoIndex: number) {
  activeReviewPhotos.value = review.reviewPhotos;
  activeReviewPhotoIndex.value = photoIndex;
  reviewPhotoOpen.value = true;
}

function previousReviewPhoto() {
  activeReviewPhotoIndex.value = activeReviewPhotoIndex.value === 0
    ? activeReviewPhotos.value.length - 1
    : activeReviewPhotoIndex.value - 1;
}

function nextReviewPhoto() {
  activeReviewPhotoIndex.value = activeReviewPhotoIndex.value === activeReviewPhotos.value.length - 1
    ? 0
    : activeReviewPhotoIndex.value + 1;
}

async function saveReview() {
  if (!editingReview.value) {
    return;
  }

  const body = {
    rating: reviewForm.rating,
    advantages: reviewForm.advantages.trim() || undefined,
    disadvantages: reviewForm.disadvantages.trim() || undefined,
    comment: reviewForm.comment.trim() || undefined,
    reviewPhotos: reviewForm.reviewPhotos
      .map((photo) => ({ url: photo.url.trim() }))
      .filter((photo) => photo.url)
  };
  const parsed = updateReviewSchema.safeParse(body);

  if (!parsed.success) {
    replaceFieldErrors(reviewErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте поля отзыва");
    return;
  }

  clearFieldErrors(reviewErrors);
  savingReview.value = true;

  try {
    await adminFetch(`/api/admin/reviews/update/${editingReview.value.id}`, {
      method: "POST",
      body: parsed.data
    });
    toast.success("Отзыв обновлён");
    reviewModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить отзыв"));
  } finally {
    savingReview.value = false;
  }
}

function deleteReview(review: ReviewListItem) {
  requestConfirm({
    title: "Удалить отзыв",
    message: `Удалить отзыв к товару "${review.product.name}"?`,
    hint: "Фотографии и ответы к отзыву будут удалены каскадно.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    deletingReviewId.value = review.id;

    try {
      await adminFetch(`/api/admin/reviews/delete/${review.id}`, { method: "POST" });
      toast.success("Отзыв удалён");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить отзыв"));
    } finally {
      deletingReviewId.value = null;
    }
  });
}

async function runBulkReviews(action: "delete" | "markAnswered" | "markUnanswered") {
  bulkLoading.value = action;

  try {
    const result = await adminFetch<{ count: number }>("/api/admin/reviews/bulk", {
      method: "POST",
      body: {
        action,
        reviewIds: selectedReviewIds.value
      }
    });
    toast.success(`Обновлено отзывов: ${result.count}`);
    selectedReviewIds.value = [];
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось выполнить массовую операцию"));
  } finally {
    bulkLoading.value = null;
  }
}

async function bulkMarkAnswered(answered: boolean) {
  await runBulkReviews(answered ? "markAnswered" : "markUnanswered");
}

function confirmBulkDelete() {
  requestConfirm({
    title: "Удалить выбранные отзывы",
    message: `Удалить выбранные отзывы: ${selectedReviewIds.value.length}?`,
    hint: "Фотографии и ответы к отзывам будут удалены каскадно.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    await runBulkReviews("delete");
  });
}

function exportSelectedReviews() {
  const rows = selectedReviews.value.map((review) => ({
    id: review.id,
    product: review.product.name,
    user: review.user.name || review.user.email,
    rating: review.rating,
    advantages: review.advantages ?? "",
    disadvantages: review.disadvantages ?? "",
    comment: review.comment ?? "",
    answered: review.isAnswered ? "yes" : "no",
    createdAt: review.createdAt
  }));

  downloadCsv("reviews-selected.csv", rows);
  toast.success(`Экспортировано отзывов: ${rows.length}`);
}
</script>
