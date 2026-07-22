export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith("/admin") || to.path === "/admin/login") {
    return;
  }

  try {
    await $fetch("/api/admin/me", {
      headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined
    });
  } catch {
    return navigateTo({
      path: "/admin/login",
      query: {
        redirect: to.fullPath
      }
    });
  }
});