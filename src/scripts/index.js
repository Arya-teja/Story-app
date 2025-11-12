// CSS imports
import "../styles/styles.css";

import App from "./pages/app";
import PushNotificationHelper from "./utils/push-notification";
import { registerSW } from "virtual:pwa-register";

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // Register Vite PWA service worker
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          if (confirm("New content available. Reload to update?")) {
            updateSW(true);
          }
        },
        onOfflineReady() {
          console.log("App ready to work offline");
        },
      });

      // Also register custom service worker for push notifications
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log(
        "Service Worker registered successfully:",
        registration.scope
      );

      // Initialize push notifications if user previously enabled
      await PushNotificationHelper.initializePushNotifications();

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "GET_TOKEN") {
          const token = localStorage.getItem("authToken");
          event.ports[0].postMessage({ token });
        }
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });
  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });
});
