export function showFormattedDate(date, locale = "en-US", options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

// Auth Utils
export const AuthUtils = {
  saveToken(token) {
    localStorage.setItem("authToken", token);
  },

  getToken() {
    return localStorage.getItem("authToken");
  },

  saveUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  },

  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.hash = "#/login";
  },
};

// Validation Utils
export const ValidationUtils = {
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  validatePassword(password) {
    return password.length >= 8;
  },

  validateRequired(value) {
    return value && value.trim().length > 0;
  },

  validateFile(file, maxSize = 1024 * 1024) {
    // Default 1MB
    if (!file) return { valid: false, message: "File is required" };

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        message: "File must be a valid image (jpg, jpeg, png)",
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        message: `File size must be less than ${maxSize / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  },
};

// Date Utils
export const DateUtils = {
  formatDate(dateString) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  },
};
