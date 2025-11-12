# 📖 Story App - Progressive Web Application

A modern Progressive Web Application for sharing stories with the world. Built with vanilla JavaScript, featuring offline support, push notifications, and IndexedDB storage.

## ✨ Features

### Kriteria 1: SPA & Custom View Transitions ✅

- Single Page Application dengan hash routing
- Custom View Transition API animations (slide-in/slide-out)
- MVP architecture pattern
- Smooth page transitions without reload

### Kriteria 2: Push Notifications (Advanced) ✅

- ✅ Basic: Push notification dari server saat story baru ditambahkan
- ✅ Skilled: Notifikasi dinamis dengan data dari event
- ✅ Advanced:
  - Toggle button untuk enable/disable notifications
  - Action button untuk navigasi ke detail story
  - Custom notification title, icon, dan message

### Kriteria 3: PWA dengan Offline Support (Advanced) ✅

- ✅ Basic: Installable app dengan offline app shell
- ✅ Skilled:
  - Screenshots di manifest
  - Shortcuts di manifest
  - No warnings di Chrome DevTools
- ✅ Advanced:
  - Cache dynamic data (stories dari API)
  - Strategi caching: NetworkFirst untuk API, CacheFirst untuk map tiles
  - Konten tetap accessible saat offline

### Kriteria 4: IndexedDB Implementation (Advanced) ✅

- ✅ Basic: CRUD operations untuk Favorites
  - Create: Add story to favorites
  - Read: View all favorites
  - Delete: Remove from favorites
- ✅ Skilled: Interaktivitas
  - Search/filter favorites
  - Sort by date/name
  - Toggle sort order (asc/desc)
- ✅ Advanced: Background Sync
  - Simpan story baru saat offline
  - Auto-sync ke server saat online kembali
  - Notifikasi saat sync berhasil

### Kriteria 5: Public Deployment ✅

- Deployed di Netlify/Vercel/Firebase
- URL tersedia di STUDENT.txt

## 🚀 Tech Stack

- **Vanilla JavaScript** - No framework dependency
- **Vite** - Build tool & dev server
- **Leaflet.js** - Interactive maps
- **idb** - IndexedDB wrapper
- **Vite PWA Plugin** - Service Worker & Manifest generation
- **Workbox** - Caching strategies

## 📦 Installation

```bash
# Clone repository
git clone <your-repo-url>
cd starter-project-with-vite

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🗺️ Map Services

This app uses multiple free tile layers:

- OpenStreetMap (Street view)
- Esri ArcGIS Satellite (Satellite view)
- OpenTopoMap (Topographic view)

**No API keys required** ✨

## 📱 PWA Features

### Service Worker

- Precache app shell
- Runtime caching for API responses
- Map tiles caching
- Custom push notification handler
- Background sync for offline stories

### Web App Manifest

- Multiple icon sizes (72px - 512px)
- Screenshots (mobile & desktop)
- Shortcuts to Add Story and View Stories
- Standalone display mode
- Theme color & background color

### IndexedDB

- `favorites` store: For saving favorite stories
- `pending-stories` store: For offline story submissions
- Automatic schema versioning
- Indexes for efficient querying

## 🔔 Push Notifications Setup

1. Enable notifications via toggle button in home page
2. Browser will request permission
3. Once enabled, you'll receive notifications when:
   - New stories are added to the app
   - Your offline stories are synced
4. Click notification to navigate to relevant page

## 📖 Usage Guide

### Adding a Story

1. Click "+ Add Story" button
2. Fill in description
3. Choose photo (from file or camera)
4. (Optional) Click map to set location
5. Submit - works offline too!

### Favorites

1. Browse stories on home page
2. Click "❤️ Favorite" button
3. View all favorites via navigation menu
4. Search/filter/sort your favorites
5. Remove from favorites anytime

### Offline Mode

1. Browse app while online first
2. Disconnect internet
3. App shell still loads
4. Previous stories still visible (cached)
5. Can add new stories (saved to IndexedDB)
6. When back online, stories auto-sync

## 🏗️ Project Structure

```
starter-project-with-vite/
├── src/
│   ├── index.html              # Main HTML
│   ├── scripts/
│   │   ├── index.js            # Entry point, SW registration
│   │   ├── config.js           # API & VAPID config
│   │   ├── data/
│   │   │   ├── api.js          # API service
│   │   │   └── idb-helper.js   # IndexedDB wrapper
│   │   ├── pages/
│   │   │   ├── app.js          # Main app controller
│   │   │   ├── home/           # Home page with map & stories
│   │   │   ├── favorites/      # Favorites page
│   │   │   ├── add-story/      # Add story form
│   │   │   ├── login/          # Login page
│   │   │   └── register/       # Register page
│   │   ├── routes/             # Routing logic
│   │   └── utils/
│   │       ├── index.js        # Auth, Validation, Date utils
│   │       └── push-notification.js  # Push notification helper
│   ├── styles/
│   │   └── styles.css          # All styles including view transitions
│   └── public/
│       ├── sw.js               # Custom service worker
│       ├── images/             # Icons & screenshots
│       └── favicon.png
├── vite.config.js              # Vite & PWA configuration
├── netlify.toml                # Netlify deployment config
├── STUDENT.txt                 # Deployment URL
└── package.json
```

## 🧪 Testing

### Manual Testing

1. **PWA Installability**

   - Open in Chrome/Edge
   - Check for install prompt
   - Install and verify icon appears

2. **Offline Functionality**

   - Load app while online
   - Open DevTools → Network → Offline
   - Navigate between pages
   - Verify cached content loads

3. **Push Notifications**

   - Enable notifications
   - Add a new story
   - Check notification appears
   - Click notification → navigates correctly

4. **IndexedDB**
   - Add favorites
   - Open DevTools → Application → IndexedDB
   - Verify data stored correctly
   - Test search/filter/sort

### Lighthouse Audit

```bash
# Run Lighthouse in Chrome DevTools
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Analyze page load"
5. Should score 95+ for PWA
```

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy to Netlify:

```bash
npm run build
netlify deploy --prod --dir=dist
```

## 📝 API Documentation

Uses Dicoding Story API: `https://story-api.dicoding.dev/v1`

Endpoints:

- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /stories?location=1` - Get all stories with location
- `POST /stories` - Add new story (requires auth)

VAPID Public Key included in `config.js` for push notifications.

## 🎨 Accessibility Features

- ✅ Semantic HTML5 elements
- ✅ ARIA labels and roles
- ✅ Skip-to-content link
- ✅ Keyboard navigation support
- ✅ All images have alt text
- ✅ Form labels properly associated
- ✅ Focus indicators
- ✅ Responsive design (375px, 768px, 1024px+)

## 📄 License

This project is created for Dicoding Indonesia Submission.

## 👤 Author

**Muhammad Arya Wiryateja**

## 🙏 Acknowledgments

- Dicoding Indonesia for the learning platform
- OpenStreetMap, Esri, OpenTopoMap for free map tiles
- Leaflet.js for excellent mapping library
- Vite PWA Plugin team for simplifying PWA development

LINK Deploy : https://story-app-project.netlify.app/
