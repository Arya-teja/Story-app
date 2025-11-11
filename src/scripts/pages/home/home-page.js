import StoryAPI from "../../data/api";
import IDBHelper from "../../data/idb-helper";
import { AuthUtils, DateUtils } from "../../utils/index";
import PushNotificationHelper from "../../utils/push-notification";
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

export default class HomePage {
  constructor() {
    this.map = null;
    this.markers = [];
    this.stories = [];
    this.activeMarkerId = null;
  }

  async render() {
    if (!AuthUtils.isLoggedIn()) {
      return `
        <section class="welcome-page container">
          <div class="welcome-content">
            <h1>Welcome to Story App</h1>
            <p>Share your stories with the world</p>
            <div class="welcome-actions">
              <a href="#/login" class="btn btn-primary">Login</a>
              <a href="#/register" class="btn btn-secondary">Register</a>
            </div>
          </div>
        </section>
      `;
    }

    const user = AuthUtils.getUser();
    return `
      <section class="home-page container">
        <div class="home-header">
          <div class="user-welcome">
            <h1>Welcome back, ${user?.name || "User"}!</h1>
            <p>Explore stories from around the world</p>
          </div>
          <div class="home-actions">
            <button id="notification-toggle" class="btn btn-secondary" aria-label="Toggle push notifications">
              🔔 <span id="notification-status">Enable Notifications</span>
            </button>
            <a href="#/add-story" class="btn btn-primary" aria-label="Add new story">
              + Add Story
            </a>
            <button id="logout-btn" class="btn btn-secondary" aria-label="Logout from your account">
              Logout
            </button>
          </div>
        </div>

        <div class="stories-container">
          <div class="stories-map-wrapper">
            <h2>Stories Map</h2>
            <div id="map" class="home-map" role="application" aria-label="Interactive map showing story locations"></div>
          </div>

          <div class="stories-list-wrapper">
            <h2>All Stories</h2>
            <div id="stories-list" class="stories-list" role="list" aria-live="polite"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!AuthUtils.isLoggedIn()) {
      return;
    }

    // Logout handler
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
          AuthUtils.logout();
        }
      });
    }

    // Notification toggle handler
    await this._initNotificationToggle();

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      this._initMap();
      this._loadStories();
    }, 100);
  }

  async _initNotificationToggle() {
    const toggleBtn = document.getElementById("notification-toggle");
    const statusText = document.getElementById("notification-status");

    if (!toggleBtn || !statusText) return;

    // Check current subscription status
    const isSubscribed = await PushNotificationHelper.getSubscriptionStatus();
    this._updateNotificationUI(isSubscribed);

    toggleBtn.addEventListener("click", async () => {
      try {
        const currentStatus = await PushNotificationHelper.getSubscriptionStatus();
        
        if (currentStatus) {
          // Unsubscribe
          await PushNotificationHelper.unsubscribeFromPushNotifications();
          localStorage.setItem("notificationsEnabled", "false");
          this._updateNotificationUI(false);
          alert("Push notifications disabled");
        } else {
          // Subscribe
          const hasPermission = await PushNotificationHelper.requestPermission();
          if (hasPermission) {
            const registration = await PushNotificationHelper.registerServiceWorker();
            const subscription = await PushNotificationHelper.subscribeToPushNotifications(registration);
            const token = AuthUtils.getToken();
            await PushNotificationHelper.sendSubscriptionToServer(subscription, token);
            localStorage.setItem("notificationsEnabled", "true");
            this._updateNotificationUI(true);
            alert("Push notifications enabled! You'll be notified when new stories are added.");
          } else {
            alert("Please allow notifications in your browser settings");
          }
        }
      } catch (error) {
        alert("Failed to toggle notifications: " + error.message);
      }
    });
  }

  _updateNotificationUI(isEnabled) {
    const statusText = document.getElementById("notification-status");
    if (statusText) {
      statusText.textContent = isEnabled ? "Disable Notifications" : "Enable Notifications";
    }
  }

  async _loadStories() {
    const storiesListElement = document.getElementById("stories-list");
    if (!storiesListElement) return;

    storiesListElement.innerHTML =
      '<div class="loading">Loading stories...</div>';

    try {
      const token = AuthUtils.getToken();
      const result = await StoryAPI.getStories(token, 1);

      if (result.error === false && result.listStory) {
        this.stories = result.listStory;
        this._renderStories();

        // Wait for map to be ready before adding markers
        if (this.map) {
          this._addStoryMarkers();
        } else {
          setTimeout(() => {
            if (this.map) {
              this._addStoryMarkers();
            }
          }, 200);
        }
      }
    } catch (error) {
      storiesListElement.innerHTML = `
        <div class="error-message" role="alert">
          Failed to load stories: ${error.message}
        </div>
      `;
    }
  }

  _renderStories() {
    const storiesListElement = document.getElementById("stories-list");

    if (this.stories.length === 0) {
      storiesListElement.innerHTML =
        '<p class="no-stories">No stories yet. Be the first to share!</p>';
      return;
    }

    storiesListElement.innerHTML = this.stories
      .map(
        (story, index) => `
      <article class="story-card" data-index="${index}" data-id="${story.id}" tabindex="0" role="listitem" aria-label="Story by ${
          story.name
        }">
        <img src="${story.photoUrl}" alt="${
          story.description
        }" class="story-image" loading="lazy" />
        <div class="story-content">
          <h3 class="story-author">${story.name}</h3>
          <p class="story-description">${story.description}</p>
          <time class="story-date" datetime="${
            story.createdAt
          }">${DateUtils.formatDate(story.createdAt)}</time>
          ${
            story.lat && story.lon
              ? `
            <p class="story-location">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}
            </p>
          `
              : ""
          }
          <button class="btn-favorite" data-story='${JSON.stringify(story).replace(/'/g, "&apos;")}' aria-label="Add to favorites">
            ❤️ Favorite
          </button>
        </div>
      </article>
    `
      )
      .join("");

    // Add click handlers for list-map synchronization
    this._addStoryCardHandlers();
    
    // Add favorite button handlers
    this._addFavoriteHandlers();
  }

  _initMap() {
    // Check if map container exists
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      console.error("Map container not found");
      return;
    }

    // Prevent re-initialization
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Initialize Leaflet map
    this.map = L.map("map").setView([-2.5, 118], 5); // Center of Indonesia

    // Add multiple tile layers
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

    const topoLayer = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      }
    );

    osmLayer.addTo(this.map);

    // Layer control
    const baseMaps = {
      "Street Map": osmLayer,
      Satellite: satelliteLayer,
      Topographic: topoLayer,
    };

    L.control.layers(baseMaps).addTo(this.map);
  }

  _addStoryMarkers() {
    // Check if map is initialized
    if (!this.map) {
      console.warn("Map not initialized yet");
      return;
    }

    // Clear existing markers
    this.markers.forEach((marker) => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];

    // Add markers for stories with location
    this.stories.forEach((story, index) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon], {
          storyId: story.id,
          index: index,
        });

        marker.bindPopup(`
          <div class="marker-popup">
            <img src="${story.photoUrl}" alt="${
          story.description
        }" style="width: 100%; max-width: 200px; border-radius: 4px;" />
            <h4 style="margin: 8px 0 4px 0;">${story.name}</h4>
            <p style="margin: 4px 0; font-size: 0.9em;">${story.description}</p>
            <small style="color: #666;">${DateUtils.formatDate(
              story.createdAt
            )}</small>
          </div>
        `);

        // Highlight marker on click
        marker.on("click", () => {
          this._highlightMarker(marker, index);
          this._scrollToStoryCard(index);
        });

        marker.addTo(this.map);
        this.markers.push(marker);
      }
    });

    // Fit map to show all markers
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  _addStoryCardHandlers() {
    const storyCards = document.querySelectorAll(".story-card");

    storyCards.forEach((card, index) => {
      // Click handler
      card.addEventListener("click", () => {
        this._onStoryCardClick(index);
      });

      // Keyboard handler
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this._onStoryCardClick(index);
        }
      });
    });
  }

  _onStoryCardClick(index) {
    const story = this.stories[index];

    if (story.lat && story.lon) {
      // Pan to marker on map
      this.map.setView([story.lat, story.lon], 13);

      // Open popup
      const marker = this.markers.find((m) => m.options.index === index);
      if (marker) {
        marker.openPopup();
        this._highlightMarker(marker, index);
      }
    }

    // Highlight story card
    this._highlightStoryCard(index);
  }

  _highlightMarker(marker, index) {
    // Remove highlight from all markers
    this.markers.forEach((m) => {
      if (m._icon) {
        m._icon.classList.remove("active-marker");
      }
    });

    // Add highlight to active marker
    if (marker._icon) {
      marker._icon.classList.add("active-marker");
    }

    this.activeMarkerId = index;
  }

  _highlightStoryCard(index) {
    // Remove highlight from all cards
    document.querySelectorAll(".story-card").forEach((card) => {
      card.classList.remove("active-card");
    });

    // Add highlight to active card
    const activeCard = document.querySelector(
      `.story-card[data-index="${index}"]`
    );
    if (activeCard) {
      activeCard.classList.add("active-card");
    }
  }

  _scrollToStoryCard(index) {
    const card = document.querySelector(`.story-card[data-index="${index}"]`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      this._highlightStoryCard(index);
    }
  }

  _addFavoriteHandlers() {
    const favoriteBtns = document.querySelectorAll(".btn-favorite");
    
    favoriteBtns.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const storyData = JSON.parse(btn.dataset.story.replace(/&apos;/g, "'"));
        
        try {
          const isFav = await IDBHelper.isFavorite(storyData.id);
          
          if (isFav) {
            alert("This story is already in your favorites!");
          } else {
            await IDBHelper.addFavorite(storyData);
            btn.textContent = "✅ Favorited";
            btn.disabled = true;
            
            // Show success message
            setTimeout(() => {
              btn.textContent = "❤️ Favorite";
              btn.disabled = false;
            }, 2000);
          }
        } catch (error) {
          alert("Failed to add favorite: " + error.message);
        }
      });
    });
  }
}
