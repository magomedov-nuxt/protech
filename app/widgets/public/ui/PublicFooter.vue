<template>
  <footer class="px-3 pb-4 pt-10 sm:px-4 lg:pt-16">
    <div class="mx-auto w-full max-w-370 space-y-5">
      <section
        class="overflow-hidden rounded-4xl bg-zinc-950 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.16)] sm:p-8">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div class="max-w-2xl">
            <div class="flex items-center gap-3">
              <span
                class="grid size-11 place-items-center overflow-hidden rounded-[1.35rem] shadow-xl shadow-emerald-900/20 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
                <img src="/logo.png" alt="Логотип ПроТех76" class="size-full object-contain">
              </span>
              <div>
                <p class="text-xl font-semibold tracking-normal">ПроТех76</p>
                <p class="text-sm text-white/60">Запчасти и навесное оборудование</p>
              </div>
            </div>
            <p class="mt-5 max-w-xl text-base leading-7 text-white/70">
              Собирайте корзину, сохраняйте избранное и возвращайтесь к заказам без лишних шагов.
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <UButton color="primary" icon="i-lucide-layout-grid" to="/" size="lg"
              class="rounded-full px-5 shadow-xl shadow-emerald-950/20 transition duration-300 hover:scale-[1.02]">
              В каталог
            </UButton>
            <UButton color="neutral" variant="soft" icon="i-lucide-shopping-bag" to="/cart" size="lg"
              class="rounded-full bg-white/10 px-5 text-white transition duration-300 hover:scale-[1.02] hover:bg-white/15">
              Корзина
            </UButton>
          </div>
        </div>
      </section>

      <section class="rounded-4xl bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6">
        <div class="grid gap-8 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
          <div>
            <div class="flex items-center gap-3">
              <span
                class="grid size-11 place-items-center overflow-hidden rounded-[1.35rem] shadow-xl shadow-emerald-900/20 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
                <img src="/logo.png" alt="Логотип ПроТех76" class="size-full object-contain">
              </span>
              <div>
                <p class="font-semibold text-zinc-950">ПроТех76</p>
              </div>
            </div>
            <p class="mt-5 text-sm text-zinc-500">
              Мы рады предложить вам запчасти и навесное оборудование на мини-экскаваторы Rippa .
            </p>
          </div>

          <div v-for="group in footerGroups" :key="group.title" class="space-y-3 text-sm">
            <p class="font-semibold text-zinc-950">{{ group.title }}</p>
            <NuxtLink v-for="link in group.links" :key="link.to" :to="link.to"
              class="flex w-fit items-center gap-2 rounded-full px-0 py-1 text-zinc-500 transition duration-300 hover:translate-x-1 hover:text-emerald-700">
              <UIcon :name="link.icon" class="size-4" />
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>

        <div
          class="mt-8 flex flex-col gap-4 rounded-[1.5rem] bg-[#f9fafb] p-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>ИП ПРОКАЗОВА АНАСТАСИЯ АЛЕКСАНДРОВНА ИНН: 761301560365 ОГРНИП: 325762700041090</p>
        </div>
      </section>
    </div>
  </footer>
</template>

<script setup lang="ts">
const footerGroups = [
  {
    title: "Покупателю",
    links: [
      { icon: "i-lucide-layout-grid", label: "Каталог", to: "/" },
      { icon: "i-lucide-shopping-bag", label: "Корзина", to: "/cart" },
      { icon: "i-lucide-package-check", label: "Мои заказы", to: "/orders" }
    ]
  },
  {
    title: "Аккаунт",
    links: [
      { icon: "i-lucide-user-round", label: "Войти", to: "/auth" },
      { icon: "i-lucide-heart", label: "Избранное", to: "/favorites" },
      { icon: "i-lucide-receipt-text", label: "Оформление", to: "/checkout" }
    ]
  },
  {
    title: "О компании",
    links: [
      { icon: "i-lucide-building-2", label: "О компании", to: "/about" },
      { icon: "i-lucide-phone", label: "+79201089344", to: "tel:+79201089344" },
      { icon: "i-lucide-phone", label: "+79201309744", to: "tel:+79201309744" }
    ]
  }
];
</script>
