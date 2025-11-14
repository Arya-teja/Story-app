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
          if (confirm("Ada update baru. Reload sekarang?")) {
            updateSW(true);
          }
        },
        onOfflineReady() {
          console.log("App siap bekerja offline");
        },
      });

      // Get service worker registration for push notifications
      const registration = await navigator.serviceWorker.ready;

      console.log(
        "Service Worker registered successfully:",
        registration.scope
      );

      // Debug: Check notification support
      console.log("Notification permission:", Notification.permission);
      console.log("Push supported:", "PushManager" in window);

      // Check if user previously subscribed
      const isSubscribed =
        await PushNotificationHelper.isCurrentPushSubscriptionAvailable();
      if (isSubscribed) {
        console.log("User is already subscribed to push notifications");
      } else {
        console.log(
          "User not subscribed. Click Subscribe button to enable notifications"
        );
      }

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
