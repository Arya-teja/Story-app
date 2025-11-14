import CONFIG from "../config";

class StoryAPI {
  static async register({ name, email, password }) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to register");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          "Network error. Please check your internet connection or try again later."
        );
      }
      throw error;
    }
  }

  static async login({ email, password }) {
    try {
      console.log("[API] Attempting login to:", `${CONFIG.BASE_URL}/login`);
      console.log("[API] Online status:", navigator.onLine);

      const response = await fetch(`${CONFIG.BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("[API] Response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to login");
      }

      const data = await response.json();
      console.log("[API] Login successful");
      return data;
    } catch (error) {
      console.error("[API] Login error:", error);
      if (
        error instanceof TypeError ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Tidak dapat terhubung ke server. Pastikan Anda online dan server dapat diakses."
        );
      }
      throw error;
    }
  }

  static async getStories(token, location = 1) {
    try {
      const response = await fetch(
        `${CONFIG.BASE_URL}/stories?location=${location}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch stories");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (
        error instanceof TypeError ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Tidak dapat mengambil data stories. Pastikan Anda online."
        );
      }
      throw error;
    }
  }

  static async addStory(token, { description, photo, lat, lon }) {
    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photo);
      if (lat) formData.append("lat", lat);
      if (lon) formData.append("lon", lon);

      const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to add story");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          "Network error. Please check your internet connection."
        );
      }
      throw error;
    }
  }
}

export default StoryAPI;
