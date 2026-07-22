export const ADMIN_THEME_COLORS = {
  accent: "#047857",
  accentSoft: "#dcfce7",
  accentMuted: "#bbf7d0",
  accentStrong: "#065f46",
  surface: "#ffffff",
  surfaceMuted: "#f4f7f5",
  surfaceElevated: "#ffffff",
  border: "#dce7e0",
  text: "#102018",
  textMuted: "#617269",
  textSubtle: "#839189",
  danger: "#b91c1c",
  warning: "#b45309",
  info: "#0369a1",
  success: "#047857",
  ring: "#86efac",
  chart: {
    green: "#047857",
    blue: "#0ea5e9",
    amber: "#b45309",
    red: "#b91c1c",
    violet: "#8b5cf6"
  }
} as const;

export type AdminThemeColor = typeof ADMIN_THEME_COLORS;

export const SHOP_THEME_COLORS = {
  accent: "#16a34a",
  accentSoft: "#dcfce7",
  accentMuted: "#bbf7d0",
  accentStrong: "#15803d",
  surface: "#ffffff",
  surfaceMuted: "#f4f7f5",
  surfaceElevated: "#ffffff",
  border: "#dce7e0",
  text: "#102018",
  textMuted: "#617269",
  textSubtle: "#839189",
  danger: "#dc2626",
  warning: "#d97706",
  info: "#0284c7",
  success: "#16a34a",
  ring: "#86efac"
} as const;

export type ShopThemeColor = typeof SHOP_THEME_COLORS;
