import { SHOP_THEME_COLORS } from "~~/app/shared/config/colors";

export default defineNuxtPlugin(() => {
  const root = document.documentElement;

  const forceLightMode = () => {
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
    localStorage.setItem("nuxt-color-mode", "light");
    document.cookie = "nuxt-color-mode=light; path=/; max-age=31536000";
  };

  forceLightMode();
  requestAnimationFrame(forceLightMode);

  new MutationObserver(() => {
    if (root.classList.contains("dark")) {
      forceLightMode();
    }
  }).observe(root, { attributeFilter: ["class"], attributes: true });

  root.style.setProperty("--shop-accent", SHOP_THEME_COLORS.accent);
  root.style.setProperty("--shop-accent-soft", SHOP_THEME_COLORS.accentSoft);
  root.style.setProperty("--shop-accent-muted", SHOP_THEME_COLORS.accentMuted);
  root.style.setProperty("--shop-accent-strong", SHOP_THEME_COLORS.accentStrong);
  root.style.setProperty("--shop-surface", SHOP_THEME_COLORS.surface);
  root.style.setProperty("--shop-surface-muted", SHOP_THEME_COLORS.surfaceMuted);
  root.style.setProperty("--shop-surface-elevated", SHOP_THEME_COLORS.surfaceElevated);
  root.style.setProperty("--shop-border", SHOP_THEME_COLORS.border);
  root.style.setProperty("--shop-text", SHOP_THEME_COLORS.text);
  root.style.setProperty("--shop-text-muted", SHOP_THEME_COLORS.textMuted);
  root.style.setProperty("--shop-text-subtle", SHOP_THEME_COLORS.textSubtle);
  root.style.setProperty("--shop-danger", SHOP_THEME_COLORS.danger);
  root.style.setProperty("--shop-warning", SHOP_THEME_COLORS.warning);
  root.style.setProperty("--shop-info", SHOP_THEME_COLORS.info);
  root.style.setProperty("--shop-success", SHOP_THEME_COLORS.success);
  root.style.setProperty("--shop-ring", SHOP_THEME_COLORS.ring);
});
