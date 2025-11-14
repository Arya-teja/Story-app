import CONFIG from "../config";

class PushNotificationHelper {
  static async isSupported() {
    return (
      "PushManager" in window &&
      "serviceWorker" in navigator &&
      "Notification" in window
    );
  }

  static async getServiceWorkerRegistration() {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported");
    }
    return await navigator.serviceWorker.ready;
  }

  static async isCurrentPushSubscriptionAvailable() {
    if (!(await this.isSupported())) {
      return false;
    }

    const registration = await this.getServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();

    return subscription !== null;
  }

  static urlBase64ToUint8Array(base64String) {
    const cleanString = base64String.trim();
    const padding = "=".repeat((4 - (cleanString.length % 4)) % 4);
    const base64 = (cleanString + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  static async subscribe() {
    console.log("[Push] Starting subscription process...");

    if (!(await this.isSupported())) {
      console.error("[Push] Browser tidak mendukung push notification");
      alert("Browser tidak mendukung push notification");
      return null;
    }

    try {
      const registration = await this.getServiceWorkerRegistration();
      console.log("[Push] Service Worker ready:", registration);

      const existingSubscription =
        await registration.pushManager.getSubscription();

      if (existingSubscription) {
        console.log("[Push] Already subscribed:", existingSubscription);
        return existingSubscription;
      }

      console.log("[Push] Requesting permission...");
      const permission = await Notification.requestPermission();
      console.log("[Push] Permission result:", permission);

      if (permission !== "granted") {
        alert(
          "Izin notifikasi ditolak. Silakan izinkan notifikasi di pengaturan browser."
        );
        return null;
      }

      console.log("[Push] Creating subscription...");
      const vapidPublicKey = CONFIG.VAPID_PUBLIC_KEY;
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log("[Push] Subscription created:", subscription);

      // Send subscription to server
      const token = localStorage.getItem("authToken");
      if (token) {
        await this.sendSubscriptionToServer(subscription, token);
      }

      // Show notification that subscription is successful
      await registration.showNotification(
        "Langganan push notification berhasil diaktifkan!",
        {
          body: "Anda akan menerima notifikasi saat menambahkan story baru",
          icon: "/images/logo.png",
          badge: "/images/logo.png",
          tag: "subscribe-success",
        }
      );

      console.log("[Push] Subscription successful:", subscription);
      return subscription;
    } catch (error) {
      console.error("[Push] Subscribe error:", error);
      alert(`Gagal berlangganan: ${error.message}`);
      return null;
    }
  }

  static async unsubscribe() {
    if (!(await this.isSupported())) {
      return false;
    }

    try {
      const registration = await this.getServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log("No subscription to unsubscribe");
        return true;
      }

      // Remove subscription from server first
      const token = localStorage.getItem("authToken");
      if (token) {
        await this.removeSubscriptionFromServer(subscription, token);
      }

      const successful = await subscription.unsubscribe();

      if (successful) {
        await registration.showNotification("Berhenti Berlangganan", {
          body: "Anda tidak akan menerima notifikasi story baru lagi",
          icon: "/images/icon-192x192.png",
          badge: "/images/icon-96x96.png",
          tag: "unsubscribe-success",
        });
      }

      console.log("Unsubscribe successful");
      return successful;
    } catch (error) {
      console.error("Unsubscribe error:", error);
      alert(`Gagal berhenti berlangganan: ${error.message}`);
      return false;
    }
  }

  static async sendSubscriptionToServer(subscription, token) {
    try {
      const subscriptionObject = subscription.toJSON();

      const response = await fetch(
        `${CONFIG.BASE_URL}/notifications/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            endpoint: subscriptionObject.endpoint,
            keys: {
              p256dh: subscriptionObject.keys.p256dh,
              auth: subscriptionObject.keys.auth,
            },
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to subscribe");
      }

      const data = await response.json();
      console.log("Subscription sent to server:", data);
      return data;
    } catch (error) {
      console.error("Error sending subscription to server:", error);
      throw error;
    }
  }

  static async removeSubscriptionFromServer(subscription, token) {
    try {
      const subscriptionObject = subscription.toJSON();

      const response = await fetch(
        `${CONFIG.BASE_URL}/notifications/subscribe`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            endpoint: subscriptionObject.endpoint,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        console.log("Remove subscription response:", data);
      }

      const data = await response.json();
      console.log("Subscription removed from server:", data);
      return data;
    } catch (error) {
      console.error("Error removing subscription from server:", error);
      // Don't throw error for unsubscribe
      return null;
    }
  }

  static async sendTestNotification(reportId) {
    if (!(await this.isSupported())) {
      alert("Browser tidak mendukung push notification");
      return;
    }

    try {
      const registration = await this.getServiceWorkerRegistration();

      await registration.showNotification("Story App - Demo Notifikasi", {
        body: "Ini adalah demo notifikasi. Anda akan menerima pemberitahuan saat menambahkan story baru!",
        icon: "/images/logo.png",
        badge: "/images/logo.png",
        tag: "test-notification",
        data: {
          reportId: reportId || "test",
        },
        actions: [
          {
            action: "explore",
            title: "Lihat Story",
          },
          {
            action: "close",
            title: "Tutup",
          },
        ],
      });

      console.log("Test notification sent");
    } catch (error) {
      console.error("Test notification error:", error);
      alert(`Gagal mengirim notifikasi: ${error.message}`);
    }
  }

  static async notifyNewStory(storyId) {
    // Karena API Dicoding tidak support /stories/{id}/notify endpoint,
    // kita kirim notifikasi lokal langsung
    console.log("[Push] Sending new story notification for story:", storyId);

    try {
      const registration = await this.getServiceWorkerRegistration();
      console.log("[Push] Service Worker ready for notification");

      // Show local notification
      await registration.showNotification("Story Baru Ditambahkan!", {
        body: "Story Anda berhasil dibagikan. Terima kasih telah berbagi!",
        icon: "/images/logo.png",
        badge: "/images/logo.png",
        tag: "new-story-notification",
        data: {
          storyId: storyId,
          url: "/#/",
        },
        actions: [
          {
            action: "view",
            title: "Lihat Story",
          },
          {
            action: "close",
            title: "Tutup",
          },
        ],
        vibrate: [200, 100, 200],
        requireInteraction: false,
      });

      console.log("[Push] New story notification sent successfully");
      return { success: true };
    } catch (error) {
      console.error("[Push] Error sending new story notification:", error);
      return null;
    }
  }
}

export default PushNotificationHelper;
