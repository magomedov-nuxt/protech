import { ADMIN_THEME_COLORS } from "~~/app/shared/config/colors";

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

  root.style.setProperty("--admin-accent", ADMIN_THEME_COLORS.accent);
  root.style.setProperty("--admin-accent-soft", ADMIN_THEME_COLORS.accentSoft);
  root.style.setProperty("--admin-accent-muted", ADMIN_THEME_COLORS.accentMuted);
  root.style.setProperty("--admin-accent-strong", ADMIN_THEME_COLORS.accentStrong);
  root.style.setProperty("--admin-surface", ADMIN_THEME_COLORS.surface);
  root.style.setProperty("--admin-surface-muted", ADMIN_THEME_COLORS.surfaceMuted);
  root.style.setProperty("--admin-surface-elevated", ADMIN_THEME_COLORS.surfaceElevated);
  root.style.setProperty("--admin-border", ADMIN_THEME_COLORS.border);
  root.style.setProperty("--admin-text", ADMIN_THEME_COLORS.text);
  root.style.setProperty("--admin-text-muted", ADMIN_THEME_COLORS.textMuted);
  root.style.setProperty("--admin-text-subtle", ADMIN_THEME_COLORS.textSubtle);
  root.style.setProperty("--admin-danger", ADMIN_THEME_COLORS.danger);
  root.style.setProperty("--admin-warning", ADMIN_THEME_COLORS.warning);
  root.style.setProperty("--admin-info", ADMIN_THEME_COLORS.info);
  root.style.setProperty("--admin-success", ADMIN_THEME_COLORS.success);
  root.style.setProperty("--admin-ring", ADMIN_THEME_COLORS.ring);
  root.style.setProperty("--admin-chart-green", ADMIN_THEME_COLORS.chart.green);
  root.style.setProperty("--admin-chart-blue", ADMIN_THEME_COLORS.chart.blue);
  root.style.setProperty("--admin-chart-amber", ADMIN_THEME_COLORS.chart.amber);
  root.style.setProperty("--admin-chart-red", ADMIN_THEME_COLORS.chart.red);
  root.style.setProperty("--admin-chart-violet", ADMIN_THEME_COLORS.chart.violet);
});
