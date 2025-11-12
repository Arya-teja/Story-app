import { openDB } from "idb";

const DB_NAME = "story-app-db";
const DB_VERSION = 1;
const FAVORITE_STORE = "favorites";
const PENDING_STORE = "pending-stories";

class IDBHelper {
  static async openDatabase() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create favorites store
        if (!db.objectStoreNames.contains(FAVORITE_STORE)) {
          const favoriteStore = db.createObjectStore(FAVORITE_STORE, {
            keyPath: "id",
          });
          favoriteStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
          favoriteStore.createIndex("name", "name", { unique: false });
        }

        // Create pending stories store for offline sync
        if (!db.objectStoreNames.contains(PENDING_STORE)) {
          const pendingStore = db.createObjectStore(PENDING_STORE, {
            keyPath: "tempId",
            autoIncrement: true,
          });
          pendingStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      },
    });
  }

  // Favorites CRUD
  static async addFavorite(story) {
    const db = await this.openDatabase();
    return db.add(FAVORITE_STORE, {
      ...story,
      favoritedAt: new Date().toISOString(),
    });
  }

  static async getFavorites(sortBy = "createdAt", order = "desc") {
    const db = await this.openDatabase();
    let favorites = await db.getAll(FAVORITE_STORE);

    // Sort
    favorites.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (order === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return favorites;
  }

  static async getFavoriteById(id) {
    const db = await this.openDatabase();
    return db.get(FAVORITE_STORE, id);
  }

  static async deleteFavorite(id) {
    const db = await this.openDatabase();
    return db.delete(FAVORITE_STORE, id);
  }

  static async searchFavorites(query) {
    const favorites = await this.getFavorites();
    const lowerQuery = query.toLowerCase();

    return favorites.filter(
      (story) =>
        story.name.toLowerCase().includes(lowerQuery) ||
        story.description.toLowerCase().includes(lowerQuery)
    );
  }

  static async isFavorite(id) {
    const favorite = await this.getFavoriteById(id);
    return !!favorite;
  }

  // Pending Stories for Background Sync
  static async addPendingStory(storyData) {
    const db = await this.openDatabase();
    return db.add(PENDING_STORE, {
      ...storyData,
      timestamp: new Date().toISOString(),
    });
  }

  static async getPendingStories() {
    const db = await this.openDatabase();
    return db.getAll(PENDING_STORE);
  }

  static async deletePendingStory(tempId) {
    const db = await this.openDatabase();
    return db.delete(PENDING_STORE, tempId);
  }

  static async clearPendingStories() {
    const db = await this.openDatabase();
    const tx = db.transaction(PENDING_STORE, "readwrite");
    await tx.objectStore(PENDING_STORE).clear();
    await tx.done;
  }
}

export default IDBHelper;
