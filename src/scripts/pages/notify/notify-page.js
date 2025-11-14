import PushNotificationHelper from "../../utils/push-notification";
import { AuthUtils } from "../../utils/index";

export default class NotifyPage {
  async render() {
    return `
      <section class="notify-page container">
        <div class="notify-content">
          <div class="notify-header">
            <h1>🔔 Try Notify Me</h1>
            <p>Fitur notifikasi story akan segera hadir!</p>
          </div>
          
          <div class="notify-demo">
            <div class="demo-card">
              <h2>Web Push Notification Demo</h2>
              <p>Klik tombol di bawah untuk mencoba fitur push notification. Anda akan menerima notifikasi percobaan.</p>
              
              <div class="notify-actions">
                <button id="try-notify-btn" class="btn btn-primary">
                  🔔 Try Notify Me
                </button>
                <button id="back-btn" class="btn btn-secondary">
                  ← Kembali
                </button>
              </div>
              
              <div id="notify-status" class="notify-status"></div>
            </div>
            
            <div class="info-card">
              <h3>ℹ️ Cara Kerja</h3>
              <ol>
                <li>Klik tombol "Try Notify Me"</li>
                <li>Izinkan notifikasi jika diminta browser</li>
                <li>Notifikasi percobaan akan muncul</li>
                <li>Anda akan terdaftar untuk menerima notifikasi story baru</li>
              </ol>
              
              <div class="info-note">
                <strong>Catatan:</strong> Untuk menerima notifikasi push dari server, pastikan Anda sudah berlangganan (Subscribe) terlebih dahulu.
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const tryBtn = document.getElementById("try-notify-btn");
    const backBtn = document.getElementById("back-btn");
    const statusDiv = document.getElementById("notify-status");

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.hash = "#/";
      });
    }

    if (tryBtn) {
      tryBtn.addEventListener("click", async () => {
        try {
          statusDiv.innerHTML = '<div class="loading">Memproses...</div>';

          // Check if already subscribed
          const isSubscribed =
            await PushNotificationHelper.isCurrentPushSubscriptionAvailable();

          if (!isSubscribed) {
            // Subscribe first
            const subscription = await PushNotificationHelper.subscribe();

            if (!subscription) {
              statusDiv.innerHTML = `
                <div class="error-message">
                  ❌ Gagal berlangganan. Silakan coba lagi atau periksa pengaturan browser Anda.
                </div>
              `;
              return;
            }
          }

          // Send test notification
          await PushNotificationHelper.sendTestNotification();

          statusDiv.innerHTML = `
            <div class="success-message">
              ✅ Berhasil! Notifikasi telah dikirim.
              <br><br>
              <strong>Anda sudah berlangganan push notification!</strong>
              <br><br>
              Coba tambahkan story baru, maka semua subscriber akan menerima notifikasi.
            </div>
          `;
        } catch (error) {
          console.error("Error in try notify:", error);
          statusDiv.innerHTML = `
            <div class="error-message">
              ❌ Gagal mengirim notifikasi: ${error.message}
              <br><br>
              Pastikan Anda sudah login dan browser mendukung push notification.
            </div>
          `;
        }
      });
    }
  }
}
