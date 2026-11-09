// Registers the service worker in production only (it would just get in the way during `npm run dev`).
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.warn("Service worker registration failed:", error));
  });
}
