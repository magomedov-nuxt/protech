import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  ignores: [
    ".nuxt/**",
    ".output/**",
    "coverage/**",
    "node_modules/**"
  ],
  rules: {
    "vue/first-attribute-linebreak": ["warn", {
      singleline: "beside",
      multiline: "beside"
    }],
    "vue/html-indent": ["warn", 2, {
      attribute: 1,
      alignAttributesVertically: false
    }]
  }
});
