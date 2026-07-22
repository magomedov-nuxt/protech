<template>
  <UDrawer v-model:open="open"
    direction="right"
    :handle="false"
    :handle-only="true"
    :ui="drawerUi"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs font-medium uppercase text-zinc-400">О товаре</p>
          <h2 class="text-2xl font-semibold tracking-normal text-zinc-950">
            Характеристики и описание
          </h2>
        </div>

        <UButton color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          size="lg"
          square
          class="rounded-full bg-zinc-100 hover:bg-zinc-200"
          aria-label="Закрыть характеристики"
          @click="closeDrawer"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <section class="rounded-[1.75rem] bg-[#f9fafb] p-4 shadow-sm shadow-zinc-950/5">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold text-zinc-950">Характеристики</h3>
            <UBadge color="neutral"
              variant="soft"
              class="rounded-full bg-white px-2.5 py-1 text-zinc-500"
            >
              {{ attributes.length }}
            </UBadge>
          </div>

          <dl v-if="attributes.length"
            class="mt-4 divide-y divide-zinc-200/80"
          >
            <div v-for="attribute in attributes"
              :key="attribute.id"
              class="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] gap-3 py-3 text-sm first:pt-0 last:pb-0"
            >
              <dt class="text-zinc-400">
                {{ attribute.attribute.name }}
              </dt>
              <dd class="font-medium text-zinc-900">
                {{ formatProductAttribute(attribute) }}
              </dd>
            </div>
          </dl>

          <p v-else
            class="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-zinc-500"
          >
            Характеристики пока не заполнены.
          </p>
        </section>

        <section class="rounded-[1.75rem] bg-[#f9fafb] p-4 shadow-sm shadow-zinc-950/5">
          <h3 class="font-semibold text-zinc-950">Описание</h3>
          <p class="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-600">
            {{ product.description }}
          </p>
        </section>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import {
  formatProductAttribute,
  type ProductAttribute
} from "~~/app/entities/product/lib/productDetails";
import type { ProductDetails } from "~~/app/shared/types/shop";

defineProps<{
  attributes: ProductAttribute[];
  product: ProductDetails;
}>();

const open = defineModel<boolean>("open", { required: true });
const drawerUi = {
  overlay: "bg-zinc-950/25 backdrop-blur-sm",
  content: "w-[min(520px,calc(100vw-1rem))] max-w-none rounded-l-[2rem] bg-white shadow-2xl shadow-zinc-950/20 ring-0",
  container: "h-full gap-0 overflow-hidden p-0",
  header: "px-6 pb-4 pt-6",
  body: "min-h-0 flex-1 overflow-y-auto px-6 pb-8"
};

function closeDrawer() {
  open.value = false;
}
</script>
