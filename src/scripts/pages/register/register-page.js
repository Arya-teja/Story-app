import StoryAPI from "../../data/api";
import { AuthUtils, ValidationUtils } from "../../utils/index";

class RegisterPage {
  async render() {
    return `
      <section class="auth-page container">
        <div class="auth-card">
          <h1 class="auth-title">Create Your Account</h1>
          <p class="auth-subtitle">Join Story App and start sharing</p>
          
          <form id="register-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                aria-label="Full Name"
                aria-required="true"
                placeholder="Enter your full name"
                required
              />
              <span class="error-text" role="alert" aria-live="polite"></span>
            </div>

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
                placeholder="Minimum 8 characters"
                required
              />
              <span class="error-text" role="alert" aria-live="polite"></span>
            </div>

            <button type="submit" class="btn btn-primary" aria-label="Create your account">
              Register
            </button>
          </form>

          <p class="auth-footer">
            Already have an account? <a href="#/login">Login here</a>
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

    const form = document.getElementById("register-form");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    // Real-time validation
    nameInput.addEventListener("blur", () => this._validateName(nameInput));
    emailInput.addEventListener("blur", () => this._validateEmail(emailInput));
    passwordInput.addEventListener("blur", () =>
      this._validatePassword(passwordInput)
    );

    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this._handleRegister();
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

  _validateName(input) {
    const errorElement = input.parentElement.querySelector(".error-text");
    const value = input.value.trim();

    if (!ValidationUtils.validateRequired(value)) {
      errorElement.textContent = "Name is required";
      input.setAttribute("aria-invalid", "true");
      return false;
    }

    errorElement.textContent = "";
    input.setAttribute("aria-invalid", "false");
    return true;
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

  async _handleRegister() {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitButton = document.querySelector(".btn-primary");

    // Validate all fields
    const isNameValid = this._validateName(nameInput);
    const isEmailValid = this._validateEmail(emailInput);
    const isPasswordValid = this._validatePassword(passwordInput);

    if (!isNameValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";

    try {
      const result = await StoryAPI.register({ name, email, password });

      if (result.error === false) {
        alert("Registration successful! Please login with your credentials.");
        window.location.hash = "#/login";
      }
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
      submitButton.disabled = false;
      submitButton.textContent = "Register";
    }
  }
}

export default RegisterPage;
