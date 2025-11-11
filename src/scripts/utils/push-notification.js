import CONFIG from "../config";

class PushNotificationHelper {
  static async requestPermission() {
    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications");
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  static async registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported");
    }

    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    return registration;
  }

  static async subscribeToPushNotifications(registration) {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
      });

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      throw error;
    }
  }

  static async unsubscribeFromPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      throw error;
    }
  }

  static async getSubscriptionStatus() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      return false;
    }
  }

  static async sendSubscriptionToServer(subscription, token) {
    try {
      // Store subscription in localStorage for this demo
      localStorage.setItem("pushSubscription", JSON.stringify(subscription));
      return true;
    } catch (error) {
      console.error("Failed to send subscription to server:", error);
      throw error;
    }
  }

  static urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  static async initializePushNotifications() {
    try {
      // Check if already subscribed
      const isSubscribed = await this.getSubscriptionStatus();
      const savedPreference = localStorage.getItem("notificationsEnabled");

      if (savedPreference === "true" && !isSubscribed) {
        // Re-subscribe if user had enabled before
        const hasPermission = await this.requestPermission();
        if (hasPermission) {
          const registration = await this.registerServiceWorker();
          const subscription = await this.subscribeToPushNotifications(registration);
          const token = localStorage.getItem("authToken");
          await this.sendSubscriptionToServer(subscription, token);
        }
      }

      return isSubscribed;
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
      return false;
    }
  }
}

export default PushNotificationHelper;
