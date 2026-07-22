export const useAdminUiStore = defineStore("admin-ui", {
  state: () => ({
    sidebarCollapsed: false
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    setSidebarCollapsed(value: boolean) {
      this.sidebarCollapsed = value;
    }
  }
});
