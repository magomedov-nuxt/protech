<template>
  <div class="mx-auto w-full max-w-370 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
    <section class="rounded-2xl bg-white/90 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="max-w-3xl">
          <p class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <UIcon name="i-lucide-shopping-cart" class="size-4" />
            Корзина
          </p>
          <h1 class="mt-2 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
            Готово к оформлению
          </h1>
          <p class="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">
            Проверьте товары, количество и наличие перед переходом к оплате.
          </p>
        </div>

        <UButton color="primary" icon="i-lucide-layout-grid" to="/" size="lg"
          class="min-h-12 rounded-full px-5 font-semibold shadow-lg shadow-emerald-700/15 transition duration-300 hover:scale-[1.02]">
          Продолжить покупки
        </UButton>
      </div>    
    </section>

    <div v-if="loading" class="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-3">
        <USkeleton v-for="item in 3" :key="item" class="h-32 rounded-2xl" />
      </div>
      <USkeleton class="h-96 rounded-2xl" />
    </div>

    <OrderEmptyState v-else-if="!auth.user" class="mt-5" icon="i-lucide-lock-keyhole"
      title="Войдите, чтобы открыть корзину"
      description="После входа мы синхронизируем товары и сохраним корзину в вашем аккаунте." action-label="Войти"
      action-icon="i-lucide-user-round" action-to="/auth?redirect=/cart" />

    <OrderEmptyState v-else-if="!cart.items.length" class="mt-5" icon="i-lucide-shopping-cart" title="Корзина пуста"
      description="Добавьте товары из каталога, чтобы собрать заказ." action-label="Перейти в каталог"
      action-icon="i-lucide-layout-grid" action-to="/" />

    <div v-else class="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section class="space-y-3">
        <div class="rounded-2xl bg-[#f9fafb] px-4 py-3 shadow-sm shadow-zinc-950/5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold tracking-normal text-zinc-950">Товары в корзине</h2>
              <p class="mt-0.5 text-sm text-zinc-500">
                {{ cart.items.length }} позиций, {{ cart.totalItems }} шт.
              </p>
            </div>

            <UTooltip text="Очистить корзину">
              <UButton color="error" variant="soft" icon="i-lucide-trash-2" size="md"
                class="min-h-11 rounded-full bg-red-50/80 px-4 font-semibold transition duration-300 hover:scale-[1.02]"
                :loading="cart.pending" aria-label="Очистить корзину" @click="clearCart">
                Очистить
              </UButton>
            </UTooltip>
          </div>

          <UAlert v-if="hasBlockingItems" color="warning" variant="soft" icon="i-lucide-triangle-alert"
            class="mt-3 rounded-xl" title="Проверьте наличие"
            description="В корзине есть товар без остатка или количество выше доступного. Скорректируйте заказ перед оформлением." />
        </div>

        <div v-auto-animate class="space-y-3">
          <CartLineItem v-for="item in cart.items" :key="item.id" :item="item"
            :loading="cart.syncingProductId === item.product.id" @update="updateQuantity" @remove="removeItem" />
        </div>
      </section>

      <aside class="space-y-3 xl:sticky xl:top-24 xl:self-start">
        <OrderSummary :items="cart.items" :subtotal="cart.subtotal" delivery-label="выбирается при оформлении">
          <template #actions>
            <div class="mt-4 grid gap-2">
              <UButton color="primary" size="lg" block icon="i-lucide-credit-card" to="/checkout"
                class="min-h-12 rounded-full font-semibold shadow-lg shadow-emerald-700/15 transition duration-300 hover:scale-[1.01]"
                :disabled="hasBlockingItems">
                Оформить заказ
              </UButton>
              <UButton color="neutral" variant="soft" block icon="i-lucide-heart" to="/favorites" size="lg"
                class="min-h-12 rounded-full bg-[#f3f4f6] font-semibold transition duration-300 hover:scale-[1.01]">
                Смотреть избранное
              </UButton>
            </div>
          </template>
        </OrderSummary>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";

useSeoMeta({
  title: "Корзина",
  description: "Корзина покупателя ПроТех76."
});

const auth = useAuthStore();
const cart = useCartStore();
const loading = ref(true);

const hasBlockingItems = computed(() => cart.items.some((item) => (
  !item.product.isActive ||
  item.product.stockQuantity <= 0 ||
  item.quantity > item.product.stockQuantity
)));

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (user) {
    await cart.fetchCart();
  }

  loading.value = false;
});

async function updateQuantity(productId: number, quantity: number) {
  try {
    await cart.updateQuantity(productId, quantity);
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить количество"));
  }
}

async function removeItem(productId: number) {
  try {
    await cart.remove(productId);
    toast.success("Товар удален из корзины");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось удалить товар"));
  }
}

async function clearCart() {
  try {
    await cart.clear();
    toast.success("Корзина очищена");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось очистить корзину"));
  }
}
</script>
