import IDBHelper from "../../data/idb-helper";
import { AuthUtils, DateUtils } from "../../utils/index";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default class FavoritesPage {
  constructor() {
    this.favorites = [];
    this.filteredFavorites = [];
    this.sortBy = "createdAt";
    this.sortOrder = "desc";
  }

  async render() {
    if (!AuthUtils.isLoggedIn()) {
      window.location.hash = "#/login";
      return "";
    }

    return `
      <section class="favorites-page container">
        <div class="page-header">
          <h1>My Favorite Stories</h1>
          <p>Stories you've saved for later</p>
        </div>

        <div class="favorites-controls">
          <div class="search-box">
            <input 
              type="search" 
              id="search-favorites" 
              placeholder="Search favorites..." 
              aria-label="Search favorites"
            />
          </div>

          <div class="sort-controls">
            <label for="sort-by">Sort by:</label>
            <select id="sort-by" aria-label="Sort by">
              <option value="createdAt">Date Created</option>
              <option value="favoritedAt">Date Favorited</option>
              <option value="name">Author Name</option>
            </select>

            <button id="sort-order" class="btn btn-secondary" aria-label="Toggle sort order">
              <span id="sort-icon">↓</span>
            </button>
          </div>
        </div>

        <div id="favorites-list" class="favorites-list" role="list" aria-live="polite"></div>
      </section>
    `;
  }

  async afterRender() {
    if (!AuthUtils.isLoggedIn()) {
      return;
    }

    await this._loadFavorites();
    this._initControls();
  }

  async _loadFavorites() {
    const listElement = document.getElementById("favorites-list");
    if (!listElement) return;

    listElement.innerHTML = '<div class="loading">Loading favorites...</div>';

    try {
      this.favorites = await IDBHelper.getFavorites(this.sortBy, this.sortOrder);
      this.filteredFavorites = this.favorites;
      this._renderFavorites();
    } catch (error) {
      listElement.innerHTML = `<div class="error-message" role="alert">Failed to load favorites: ${error.message}</div>`;
    }
  }

  _renderFavorites() {
    const listElement = document.getElementById("favorites-list");

    if (this.filteredFavorites.length === 0) {
      listElement.innerHTML = `
        <div class="empty-state">
          <p>No favorite stories yet.</p>
          <a href="#/" class="btn btn-primary">Explore Stories</a>
        </div>
      `;
      return;
    }

    listElement.innerHTML = this.filteredFavorites
      .map(
        (story) => `
      <article class="favorite-card" data-id="${story.id}" role="listitem">
        <img src="${story.photoUrl}" alt="${story.description}" class="favorite-image" loading="lazy" />
        <div class="favorite-content">
          <h3 class="favorite-author">${story.name}</h3>
          <p class="favorite-description">${story.description}</p>
          <time class="favorite-date" datetime="${story.createdAt}">
            ${DateUtils.formatDate(story.createdAt)}
          </time>
          ${
            story.lat && story.lon
              ? `
            <p class="favorite-location">
              📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}
            </p>
          `
              : ""
          }
          <div class="favorite-actions">
            <button class="btn-remove-favorite" data-id="${story.id}" aria-label="Remove from favorites">
              ❤️ Remove Favorite
            </button>
          </div>
        </div>
      </article>
    `
      )
      .join("");

    // Add event listeners to remove buttons
    document.querySelectorAll(".btn-remove-favorite").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await this._removeFavorite(id);
      });
    });
  }

  async _removeFavorite(id) {
    if (confirm("Remove this story from favorites?")) {
      try {
        await IDBHelper.deleteFavorite(id);
        await this._loadFavorites();
      } catch (error) {
        alert("Failed to remove favorite: " + error.message);
      }
    }
  }

  _initControls() {
    const searchInput = document.getElementById("search-favorites");
    const sortBySelect = document.getElementById("sort-by");
    const sortOrderBtn = document.getElementById("sort-order");

    // Search
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        await this._handleSearch(e.target.value);
      }, 300);
    });

    // Sort by
    sortBySelect.addEventListener("change", async (e) => {
      this.sortBy = e.target.value;
      await this._loadFavorites();
    });

    // Sort order
    sortOrderBtn.addEventListener("click", async () => {
      this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      document.getElementById("sort-icon").textContent = 
        this.sortOrder === "asc" ? "↑" : "↓";
      await this._loadFavorites();
    });
  }

  async _handleSearch(query) {
    if (!query.trim()) {
      this.filteredFavorites = this.favorites;
    } else {
      this.filteredFavorites = await IDBHelper.searchFavorites(query);
    }
    this._renderFavorites();
  }
}
