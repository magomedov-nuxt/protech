import { useScrollLock } from "@vueuse/core";

const OPEN_OVERLAY_SELECTOR = [
  "[role=\"dialog\"][data-state=\"open\"]",
  "[data-vaul-drawer-wrapper][data-state=\"open\"]",
  "[data-vaul-overlay][data-state=\"open\"]"
].join(", ");

export default defineNuxtPlugin(() => {
  const scrollLocked = useScrollLock(document.body, false);

  const syncScrollLock = () => {
    scrollLocked.value = Boolean(document.querySelector(OPEN_OVERLAY_SELECTOR));
  };

  const observer = new MutationObserver(syncScrollLock);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-state"]
  });

  syncScrollLock();
});
