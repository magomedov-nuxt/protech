<template>
  <div class="mx-auto w-full max-w-370 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
    <section class="overflow-hidden rounded-2xl bg-white/90 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="max-w-3xl">
          <p class="inline-flex items-center gap-2 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
            <UIcon name="i-lucide-heart" class="size-4 fill-current" />
            Подборка
          </p>
          <h1 class="mt-2 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
            Избранное
          </h1>
          <p class="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">
            Сохраняйте товары, сравнивайте варианты и возвращайтесь к покупке, когда удобно.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <UButton color="primary" icon="i-lucide-layout-grid" to="/" size="lg"
            class="min-h-12 rounded-full px-5 font-semibold shadow-lg shadow-emerald-700/15 transition duration-300 hover:scale-[1.02]">
            В каталог
          </UButton>
          <UButton color="neutral" variant="soft" icon="i-lucide-shopping-bag" to="/cart" size="lg"
            class="min-h-12 rounded-full bg-[#f3f4f6] px-5 font-semibold transition duration-300 hover:scale-[1.02]">
            Корзина
          </UButton>
        </div>
      </div>

      <div class="mt-4 grid gap-2 sm:grid-cols-3">
        <div v-for="metric in metrics" :key="metric.label" class="rounded-xl bg-[#f9fafb] px-3 py-2.5">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-zinc-500">{{ metric.label }}</p>
            <UIcon :name="metric.icon" class="size-4 text-zinc-400" />
          </div>
          <p class="mt-1 text-lg font-semibold text-zinc-950">{{ metric.value }}</p>
        </div>
      </div>
    </section>

    <section v-if="loading" class="mt-5 rounded-2xl bg-white/90 p-3 shadow-sm shadow-zinc-950/5 sm:p-4">
      <div class="grid gap-3">
        <USkeleton v-for="item in 4" :key="item" class="h-44 rounded-xl" />
      </div>
    </section>

    <OrderEmptyState v-else-if="!auth.user" class="mt-5" icon="i-lucide-heart" title="Войдите, чтобы открыть избранное"
      description="Мы сохраним подборку в аккаунте и синхронизируем ее между устройствами." action-label="Войти"
      action-icon="i-lucide-user-round" action-to="/auth?redirect=/favorites" />

    <OrderEmptyState v-else-if="!favorites.items.length" class="mt-5" icon="i-lucide-heart-plus" title="Пока ничего нет"
      description="Добавляйте товары сердечком в каталоге или карточке товара — они появятся здесь."
      action-label="Перейти в каталог" action-icon="i-lucide-layout-grid" action-to="/" />

    <section v-else class="mt-5 overflow-hidden rounded-2xl bg-white/90 shadow-sm shadow-zinc-950/5">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
        <div>
          <h2 class="text-lg font-semibold tracking-normal text-zinc-950">Сохраненные товары</h2>
          <p class="mt-0.5 text-sm text-zinc-500">
            {{ pluralizeProducts(favorites.items.length) }}
          </p>
        </div>

        <UButton color="neutral" variant="soft" icon="i-lucide-layout-grid" to="/" size="md"
          class="min-h-11 rounded-full bg-[#f3f4f6] px-4 font-semibold transition duration-300 hover:scale-[1.02]">
          В каталог
        </UButton>
      </div>

      <div v-auto-animate class="grid gap-3 p-3">
        <article v-for="row in favoriteRows" :key="row.favorite.id"
          class="group grid grid-cols-[104px_minmax(0,1fr)] gap-4 rounded-xl bg-[#f9fafb] p-3 transition duration-300 hover:bg-white hover:shadow-lg hover:shadow-zinc-950/10 sm:grid-cols-[132px_minmax(0,1fr)] md:grid-cols-[132px_minmax(0,1fr)_220px] md:items-center lg:grid-cols-[148px_minmax(0,1fr)_240px]">
          <NuxtLink :to="`/product/${row.product.id}`"
            class="relative block aspect-square w-full overflow-hidden rounded-xl bg-white shadow-sm shadow-zinc-950/5">
            <img :src="row.product.mainImage || '/favicon.ico'" :alt="row.product.name"
              class="size-full object-contain transition duration-500 group-hover:scale-105">
            <span v-if="row.discount"
              class="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 shadow-sm shadow-zinc-950/10 backdrop-blur">
              -{{ row.discount }}%
            </span>
          </NuxtLink>

          <div class="grid min-w-0 content-between gap-3 md:min-h-32 lg:min-h-36">
            <div class="min-w-0">
              <div class="flex flex-wrap gap-1.5">
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="favoriteStockClass(row.product)">
                  <span class="size-2 rounded-full" :class="favoriteStockDotClass(row.product)" />
                  {{ row.stock }}
                </span>
              </div>

              <NuxtLink :to="`/product/${row.product.id}`"
                class="mt-2 block line-clamp-3 text-base font-semibold tracking-normal text-zinc-950 transition hover:text-emerald-700 sm:line-clamp-2 sm:text-lg">
                {{ row.product.name }}
              </NuxtLink>
            </div>

            <div class="min-w-0">
              <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p class="text-lg font-semibold text-zinc-950">
                  {{ formatCurrency(row.product.currentPrice) }}
                </p>
                <p v-if="row.discount" class="text-xs text-zinc-400 line-through">
                  {{ formatCurrency(row.product.oldPrice) }}
                </p>
              </div>
            </div>
          </div>

          <div class="col-span-2 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3 md:col-span-1 md:col-start-3 md:row-start-1 md:grid md:grid-cols-1 md:items-stretch">
            <UButton :color="cartButtonColor(row.product, row.inCart)"
              :variant="row.inCart || isOutOfStock(row.product) ? 'soft' : 'solid'" :icon="cartButtonIcon(row.inCart)"
              size="md"
              class="min-h-12 justify-center whitespace-nowrap rounded-full px-2 text-xs font-semibold transition duration-300 hover:scale-[1.02] sm:px-4 sm:text-sm md:w-full"
              :class="cartButtonClass(row.product, row.inCart)" :disabled="!row.inCart && isOutOfStock(row.product)"
              :loading="cart.syncingProductId === row.product.id" @click="toggleCart(row.product)">
              {{ cartButtonLabel(row.product, row.inCart) }}
            </UButton>

            <UTooltip text="Убрать из избранного">
              <UButton color="error" variant="soft" icon="i-lucide-heart-off" size="md"
                class="min-h-12 justify-center whitespace-nowrap rounded-full bg-red-50/80 px-2 text-xs font-semibold transition duration-300 hover:scale-[1.02] sm:px-4 sm:text-sm md:w-full"
                :loading="favorites.syncingProductId === row.product.id"
                :aria-label="`Убрать ${row.product.name} из избранного`" @click="toggleFavorite(row.product)">
                Убрать
              </UButton>
            </UTooltip>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import {
  discountPercent,
  isOutOfStock,
  stockLabel
} from "~~/app/shared/lib/catalogProductHelpers";
import { formatCurrency, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import type { ProductCardItem } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";

useSeoMeta({
  title: "Избранное",
  description: "Избранные товары покупателя ПроТех76."
});

const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const loading = ref(true);
const metrics = computed(() => [
  {
    icon: "i-lucide-heart",
    label: "Сохранено",
    value: `${favorites.count}`
  },
  {
    icon: "i-lucide-badge-russian-ruble",
    label: "На сумму",
    value: formatCurrency(favoritesTotal.value)
  },
  {
    icon: "i-lucide-package-check",
    label: "В наличии",
    value: `${availableFavoritesCount.value}`
  }
]);
const favoritesTotal = computed(() => favorites.items.reduce((sum, item) => sum + Number(item.product.currentPrice ?? 0), 0));
const availableFavoritesCount = computed(() => favorites.items.filter((item) => (item.product.stockQuantity ?? 0) > 0).length);
const favoriteRows = computed(() => favorites.items.map((favorite) => {
  const product = favorite.product;
  const cartItem = cartItemByProductId(product.id);

  return {
    favorite,
    product,
    stock: stockLabel(product),
    discount: discountPercent(product),
    inCart: Boolean(cartItem)
  };
}));

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (user) {
    await Promise.all([
      cart.fetchCart(),
      favorites.fetchFavorites()
    ]);
  }

  loading.value = false;
});

function cartItemByProductId(productId: number) {
  return cart.items.find((item) => item.product.id === productId);
}

function favoriteStockClass(product: ProductCardItem) {
  return isOutOfStock(product)
    ? "bg-red-50 text-red-700"
    : "bg-emerald-50 text-emerald-700";
}

function favoriteStockDotClass(product: ProductCardItem) {
  return isOutOfStock(product) ? "bg-red-500" : "bg-emerald-500";
}

function cartButtonIcon(inCart: boolean) {
  return inCart ? "i-lucide-trash-2" : "i-lucide-shopping-bag";
}

function cartButtonLabel(product: ProductCardItem, inCart: boolean) {
  if (inCart) {
    return "Убрать";
  }

  return isOutOfStock(product) ? "Нет" : "В корзину";
}

function cartButtonColor(product: ProductCardItem, inCart: boolean) {
  if (inCart) {
    return "error";
  }

  return isOutOfStock(product) ? "neutral" : "primary";
}

function cartButtonClass(product: ProductCardItem, inCart: boolean) {
  if (inCart) {
    return "bg-red-50/90 text-red-700 hover:bg-red-100";
  }

  return isOutOfStock(product) ? "bg-[#f3f4f6] text-zinc-400" : "";
}

function pluralizeProducts(count: number) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return `${count} позиция`;
  }

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return `${count} позиции`;
  }

  return `${count} позиций`;
}

async function toggleCart(product: ProductCardItem) {
  try {
    if (cartItemByProductId(product.id)) {
      await cart.remove(product.id);
      toast.success("Товар удален из корзины");
      return;
    }

    if (isOutOfStock(product)) {
      toast.info("Товара нет в наличии");
      return;
    }

    await cart.add(product.id);
    toast.success("Товар добавлен в корзину");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить корзину"));
  }
}

async function toggleFavorite(product: ProductCardItem) {
  try {
    await favorites.toggle(product.id);
    toast.success("Товар удален из избранного");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить избранное"));
  }
}
</script>
