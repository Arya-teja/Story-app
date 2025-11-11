import StoryAPI from "../../data/api";
import { AuthUtils, ValidationUtils } from "../../utils/index";

class LoginPage {
  async render() {
    return `
      <section class="auth-page container">
        <div class="auth-card">
          <h1 class="auth-title">Login to Story App</h1>
          <p class="auth-subtitle">Share your stories with the world</p>
          
          <form id="login-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                aria-label="Email Address"
                aria-required="true"
                placeholder="Enter your email"
                required
              />
              <span class="error-text" role="alert" aria-live="polite"></span>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                aria-label="Password"
                aria-required="true"
                placeholder="Enter your password (min 8 characters)"
                required
              />
              <span class="error-text" role="alert" aria-live="polite"></span>
            </div>

            <button type="submit" class="btn btn-primary" aria-label="Login to your account">
              Login
            </button>
          </form>

          <p class="auth-footer">
            Don't have an account? <a href="#/register">Register here</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Check if already logged in
    if (AuthUtils.isLoggedIn()) {
      window.location.hash = "#/";
      return;
    }

    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    // Real-time validation
    emailInput.addEventListener("blur", () => this._validateEmail(emailInput));
    passwordInput.addEventListener("blur", () =>
      this._validatePassword(passwordInput)
    );

    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this._handleLogin();
    });

    // Keyboard accessibility
    form.querySelectorAll("input").forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          form.querySelector('button[type="submit"]').click();
        }
      });
    });
  }

  _validateEmail(input) {
    const errorElement = input.parentElement.querySelector(".error-text");
    const value = input.value.trim();

    if (!ValidationUtils.validateRequired(value)) {
      errorElement.textContent = "Email is required";
      input.setAttribute("aria-invalid", "true");
      return false;
    }

    if (!ValidationUtils.validateEmail(value)) {
      errorElement.textContent = "Please enter a valid email address";
      input.setAttribute("aria-invalid", "true");
      return false;
    }

    errorElement.textContent = "";
    input.setAttribute("aria-invalid", "false");
    return true;
  }

  _validatePassword(input) {
    const errorElement = input.parentElement.querySelector(".error-text");
    const value = input.value;

    if (!ValidationUtils.validateRequired(value)) {
      errorElement.textContent = "Password is required";
      input.setAttribute("aria-invalid", "true");
      return false;
    }

    if (!ValidationUtils.validatePassword(value)) {
      errorElement.textContent = "Password must be at least 8 characters";
      input.setAttribute("aria-invalid", "true");
      return false;
    }

    errorElement.textContent = "";
    input.setAttribute("aria-invalid", "false");
    return true;
  }

  async _handleLogin() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitButton = document.querySelector(".btn-primary");

    // Validate all fields
    const isEmailValid = this._validateEmail(emailInput);
    const isPasswordValid = this._validatePassword(passwordInput);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = "Logging in...";

    try {
      const result = await StoryAPI.login({ email, password });

      if (result.error === false && result.loginResult) {
        // Save auth data
        AuthUtils.saveToken(result.loginResult.token);
        AuthUtils.saveUser({
          userId: result.loginResult.userId,
          name: result.loginResult.name,
        });

        // Show success message
        alert("Login successful! Redirecting to home page...");

        // Redirect to home
        window.location.hash = "#/";
      }
    } catch (error) {
      alert(`Login failed: ${error.message}`);
      submitButton.disabled = false;
      submitButton.textContent = "Login";
    }
  }
}

export default LoginPage;
