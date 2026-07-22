<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ClientOnly>
      <Toaster rich-colors close-button position="top-right" />
    </ClientOnly>
  </UApp>
</template>

<script setup lang="ts">
const siteName = "ПроТех76";
const siteDescription = "Интернет-магазин запчастей, навесного оборудования и комплектующих для мини-экскаваторов Rippa.";

useHead({
  titleTemplate: (title) => title && title !== siteName ? `${title} · ${siteName}` : siteName,
});

if (import.meta.server) {
  useSeoMeta({
    title: siteName,
    description: siteDescription,
    ogTitle: siteName,
    ogDescription: siteDescription,
    ogImage: "/logo.png",
    ogImageAlt: "Логотип ПроТех76",
    ogLocale: "ru_RU",
    twitterCard: "summary_large_image",
    robots: "index, follow, max-image-preview:large"
  });

  defineOgImage("NuxtSeoSatori", {
    title: siteName,
    description: siteDescription
  }, [
    { key: "og", width: 1200, height: 630 },
    { key: "whatsapp", width: 800, height: 800 }
  ]);
}
</script>
