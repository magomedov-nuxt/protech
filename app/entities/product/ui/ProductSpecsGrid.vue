<template>
  <section v-if="attributes.length"
    class="space-y-3"
  >
    <ProductSectionHeading eyebrow="Спецификации"
      title="Характеристики"
    />

    <div v-auto-animate
      class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
    >
      <ProductAttributeCard v-for="attribute in attributes"
        :key="attribute.id"
        :label="attribute.attribute.name"
        :value="formatProductAttribute(attribute)"
        interactive
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  formatProductAttribute,
  type ProductAttribute
} from "~~/app/entities/product/lib/productDetails";

defineProps<{
  attributes: ProductAttribute[];
}>();
</script>
