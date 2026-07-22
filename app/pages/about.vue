<template>
  <div class="bg-white/30 text-zinc-950">
    <section class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <div class="rounded-4xl bg-zinc-950 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.16)] sm:p-8">
          <div class="flex items-center gap-3">
            <span class="grid size-12 place-items-center overflow-hidden rounded-[1.35rem] shadow-xl shadow-emerald-900/20">
              <img src="/logo.png"
                alt="Логотип ПроТех76"
                class="size-full object-contain"
              >
            </span>
            <div>
              <p class="text-sm text-white/60">
                Интернет-магазин
              </p>
              <h1 class="text-2xl font-semibold tracking-normal sm:text-3xl">
                О компании
              </h1>
            </div>
          </div>
          <p class="mt-6 text-lg font-semibold leading-8">
            Интернет-магазин "ProTech" – лучшие товары по низким ценам!
          </p>
        </div>

        <div class="rounded-4xl bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
          <div class="prose-shop max-w-none">
            <p>
              Мы рады предложить вам запчасти и навесное оборудование на мини-экскаваторы Rippa.
            </p>

            <h2 class="mt-8 text-xl font-semibold tracking-normal text-zinc-950">
              Наши главные преимущества:
            </h2>

            <ul class="mt-4 space-y-3">
              <li v-for="advantage in advantages"
                :key="advantage"
                class="flex gap-3"
              >
                <span class="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <UIcon name="i-lucide-check"
                    class="size-4"
                  />
                </span>
                <span>{{ advantage }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const pageTitle = "О компании";
const pageDescription = "Интернет-магазин ProTech: запчасти и навесное оборудование на мини-экскаваторы Rippa по низким ценам.";
const advantages = [
  "Низкие цены от производителей",
  "Доставка по городу в день заказа",
  "Только оригинальная и сертифицированная продукция",
  "Не понравился товар? Вернем или обменяем в течение 14-ти дней без оформления лишних бумаг!",
  "Бонусы и скидки для постоянных покупателей"
];

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage: "/logo.png",
  ogImageAlt: "Логотип ПроТех76",
  ogType: "website",
  twitterCard: "summary_large_image"
});
</script>
