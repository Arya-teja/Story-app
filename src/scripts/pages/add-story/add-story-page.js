import StoryAPI from "../../data/api";
import IDBHelper from "../../data/idb-helper";
import { AuthUtils, ValidationUtils } from "../../utils/index";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

class AddStoryPage {
  constructor() {
    this.map = null;
    this.marker = null;
    this.selectedLocation = null;
    this.selectedFile = null;
    this.mediaStream = null;
  }

  async render() {
    return `
      <section class="add-story-page container">
        <div class="add-story-card">
          <h1 class="page-title">Add New Story</h1>
          
          <form id="add-story-form" class="story-form" novalidate>
            <div class="form-group">
              <label for="description">Story Description</label>
              <textarea 
                id="description" 
                name="description" 
                rows="4"
                aria-label="Story Description"
                aria-required="true"
                placeholder="Share your story..."
                required
              ></textarea>
              <span class="error-text" role="alert" aria-live="polite"></span>
            </div>

            <div class="form-group">
              <label for="photo-input">Photo</label>
              <div class="photo-input-group">
                <div class="photo-options">
                  <button type="button" id="select-file-btn" class="btn btn-secondary" aria-label="Choose photo from files">
                    Choose File
                  </button>
                  <button type="button" id="capture-photo-btn" class="btn btn-secondary" aria-label="Capture photo with camera">
                    Capture Photo
                  </button>
                </div>
                <input 
                  type="file" 
                  id="photo" 
                  name="photo"
                  accept="image/*"
                  aria-label="Photo file"
                  aria-required="true"
                  style="display: none;"
                  required
                />
                <div id="photo-preview" class="photo-preview" aria-live="polite"></div>
                <div id="camera-container" class="camera-container" style="display: none;">
                  <video id="camera-video" class="camera-video" autoplay playsinline aria-label="Camera preview"></video>
                  <div class="camera-controls">
                    <button type="button" id="take-photo-btn" class="btn btn-primary">Take Photo</button>
                    <button type="button" id="close-camera-btn" class="btn btn-secondary">Cancel</button>
                  </div>
                </div>
                <canvas id="photo-canvas" style="display: none;"></canvas>
              </div>
              <span class="error-text" role="alert" aria-live="polite"></span>
            </div>

            <div class="form-group">
              <label for="story-map">Location (Click on map to set location)</label>
              <div id="map" class="story-map" role="application" aria-label="Map for selecting story location" aria-labelledby="story-map"></div>
              <p class="location-info" id="location-info" aria-live="polite">Click on the map to select a location</p>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" aria-label="Submit your story">
                Submit Story
              </button>
              <button type="button" id="cancel-btn" class="btn btn-secondary" aria-label="Cancel and go back">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Check authentication
    if (!AuthUtils.isLoggedIn()) {
      window.location.hash = "#/login";
      return;
    }

    this._initMap();
    this._initPhotoHandlers();
    this._initForm();
  }

  _initMap() {
    // Initialize Leaflet map
    this.map = L.map("map").setView([-6.2088, 106.8456], 10); // Default Jakarta

    // Add tile layers with layer control
    const osmLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
      }
    );

    osmLayer.addTo(this.map);

    const baseMaps = {
      "Street Map": osmLayer,
      Satellite: satelliteLayer,
    };

    L.control.layers(baseMaps).addTo(this.map);

    // Handle map clicks
    this.map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      this.selectedLocation = { lat, lon: lng };

      // Remove previous marker
      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      // Add new marker
      this.marker = L.marker([lat, lng]).addTo(this.map);

      // Update location info
      document.getElementById(
        "location-info"
      ).textContent = `Selected location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    });
  }

  _initPhotoHandlers() {
    const fileInput = document.getElementById("photo");
    const selectFileBtn = document.getElementById("select-file-btn");
    const capturePhotoBtn = document.getElementById("capture-photo-btn");
    const photoPreview = document.getElementById("photo-preview");

    // File selection
    selectFileBtn.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this._validateAndPreviewFile(file);
      }
    });

    // Camera capture
    capturePhotoBtn.addEventListener("click", async () => {
      await this._openCamera();
    });

    const takePhotoBtn = document.getElementById("take-photo-btn");
    const closeCameraBtn = document.getElementById("close-camera-btn");

    takePhotoBtn.addEventListener("click", () => {
      this._capturePhoto();
    });

    closeCameraBtn.addEventListener("click", () => {
      this._closeCamera();
    });
  }

  _validateAndPreviewFile(file) {
    const photoPreview = document.getElementById("photo-preview");
    const errorElement = document
      .querySelector(".photo-input-group")
      .parentElement.querySelector(".error-text");

    const validation = ValidationUtils.validateFile(file);

    if (!validation.valid) {
      errorElement.textContent = validation.message;
      photoPreview.innerHTML = "";
      this.selectedFile = null;
      return false;
    }

    errorElement.textContent = "";
    this.selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.innerHTML = `
        <img src="${e.target.result}" alt="Photo preview" class="preview-image" />
        <p class="preview-filename">${file.name}</p>
      `;
    };
    reader.readAsDataURL(file);

    return true;
  }

  async _openCamera() {
    try {
      const cameraContainer = document.getElementById("camera-container");
      const video = document.getElementById("camera-video");

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      video.srcObject = this.mediaStream;
      cameraContainer.style.display = "block";
    } catch (error) {
      alert("Unable to access camera: " + error.message);
    }
  }

  _closeCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    const cameraContainer = document.getElementById("camera-container");
    const video = document.getElementById("camera-video");

    video.srcObject = null;
    cameraContainer.style.display = "none";
  }

  _capturePhoto() {
    const video = document.getElementById("camera-video");
    const canvas = document.getElementById("photo-canvas");
    const photoPreview = document.getElementById("photo-preview");

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        // Validate and preview
        if (this._validateAndPreviewFile(file)) {
          // Update file input
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          document.getElementById("photo").files = dataTransfer.files;
        }

        this._closeCamera();
      },
      "image/jpeg",
      0.9
    );
  }

  _initForm() {
    const form = document.getElementById("add-story-form");
    const descriptionInput = document.getElementById("description");
    const cancelBtn = document.getElementById("cancel-btn");

    // Validation
    descriptionInput.addEventListener("blur", () =>
      this._validateDescription(descriptionInput)
    );

    // Cancel button
    cancelBtn.addEventListener("click", () => {
      if (
        confirm("Are you sure you want to cancel? Your changes will be lost.")
      ) {
        window.location.hash = "#/";
      }
    });

    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this._handleSubmit();
    });

    // Keyboard accessibility for buttons
    form.querySelectorAll("button").forEach((button) => {
      button.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          button.click();
        }
      });
    });
  }

  _validateDescription(input) {
    const errorElement = input.parentElement.querySelector(".error-text");
    const value = input.value.trim();

    if (!ValidationUtils.validateRequired(value)) {
      errorElement.textContent = "Description is required";
      input.setAttribute("aria-invalid", "true");
      return false;
    }

    errorElement.textContent = "";
    input.setAttribute("aria-invalid", "false");
    return true;
  }

  async _handleSubmit() {
    const descriptionInput = document.getElementById("description");
    const submitButton = document.querySelector('button[type="submit"]');
    const errorElement = document
      .querySelector(".photo-input-group")
      .parentElement.querySelector(".error-text");

    // Validate
    const isDescriptionValid = this._validateDescription(descriptionInput);

    if (!this.selectedFile) {
      errorElement.textContent = "Photo is required";
      return;
    }

    if (!isDescriptionValid) {
      return;
    }

    const description = descriptionInput.value.trim();
    const photo = this.selectedFile;
    const lat = this.selectedLocation?.lat;
    const lon = this.selectedLocation?.lon;

    // Show loading
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
      const token = AuthUtils.getToken();

      // Check if online
      if (!navigator.onLine) {
        // Save to IndexedDB for background sync
        const reader = new FileReader();
        reader.onload = async (e) => {
          const photoData = e.target.result;
          await IDBHelper.addPendingStory({
            description,
            photoData,
            photoType: photo.type,
            photoName: photo.name,
            lat,
            lon,
          });

          alert(
            "You're offline. Story will be uploaded when you're back online!"
          );
          window.location.hash = "#/";
        };
        reader.readAsDataURL(photo);

        // Register background sync if supported
        if ("serviceWorker" in navigator && "sync" in navigator.serviceWorker) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register("sync-stories");
        }

        return;
      }

      const result = await StoryAPI.addStory(token, {
        description,
        photo,
        lat,
        lon,
      });

      if (result.error === false) {
        alert("Story added successfully!");
        window.location.hash = "#/";
      }
    } catch (error) {
      // If error is network-related, save to IndexedDB
      if (
        error.message.includes("Network") ||
        error.message.includes("fetch")
      ) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const photoData = e.target.result;
          await IDBHelper.addPendingStory({
            description,
            photoData,
            photoType: photo.type,
            photoName: photo.name,
            lat,
            lon,
          });

          alert(
            "Network error. Story saved and will be uploaded when connection is restored!"
          );

          // Register background sync
          if (
            "serviceWorker" in navigator &&
            "sync" in navigator.serviceWorker
          ) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register("sync-stories");
          }

          window.location.hash = "#/";
        };
        reader.readAsDataURL(photo);
      } else {
        alert(`Failed to add story: ${error.message}`);
        submitButton.disabled = false;
        submitButton.textContent = "Submit Story";
      }
    } finally {
      // Clean up camera if still open
      this._closeCamera();
    }
  }
}

export default AddStoryPage;
