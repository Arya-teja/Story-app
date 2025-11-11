# ⚡ Quick Start Guide

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173

## Build & Preview

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Test PWA Features (Development)

### 1. Service Worker

- Open DevTools → Application → Service Workers
- Should see "Activated and running"

### 2. Push Notifications

1. Login to app
2. Click "🔔 Enable Notifications" on home page
3. Allow notifications in browser
4. Test: Open DevTools → Application → Service Workers → Click "Push" button

### 3. Install App

- Look for install icon in address bar (Chrome/Edge)
- Or: DevTools → Application → Manifest → "Add to homescreen"

### 4. Offline Mode

1. Load app while online
2. DevTools → Network → Switch to "Offline"
3. Navigate pages → should still work
4. Add story → saves to IndexedDB
5. Go online → story auto-syncs

### 5. IndexedDB

1. Add favorite stories from home page
2. Go to Favorites page (nav menu)
3. Test search/filter/sort
4. DevTools → Application → IndexedDB → "story-app-db"

## Quick Feature Test

### Add Story Offline

```
1. Go to Add Story page
2. Turn off network (DevTools)
3. Fill form & submit
4. Alert: "Story will be uploaded when you're back online"
5. Turn on network
6. Story automatically syncs
7. Notification appears: "Your offline story has been uploaded!"
```

### Favorites

```
1. Home page → Click "❤️ Favorite" on any story
2. Nav menu → Favorites
3. Search: Type author name or description
4. Sort: Change dropdown (Date/Name)
5. Toggle: Click arrow to reverse order
6. Delete: Click "❤️ Remove Favorite"
```

## Production Testing

After deploying:

```bash
# Run Lighthouse audit
1. Open deployed URL in Chrome
2. DevTools → Lighthouse
3. Select "Progressive Web App"
4. Generate report
5. Score should be 95+
```

## Common Issues

### Service Worker not registering

```bash
# Clear cache and reload
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Push notifications not working

- Check HTTPS is enabled
- Check browser permissions
- Clear browser data and try again

### Icons not showing

- Ensure all icon-\*.png files exist in src/public/images/
- Check manifest.webmanifest is accessible
- Hard refresh (Ctrl + Shift + R)

## Environment

- Node.js 18+ recommended
- Modern browser (Chrome, Edge, Firefox)
- HTTPS required for PWA features (auto on Netlify)

## API Credentials

Uses public Dicoding Story API:

- Base URL: https://story-api.dicoding.dev/v1
- No API key required
- VAPID key included in config.js

## Next Steps

1. ✅ Test all features locally
2. ✅ Fix any issues
3. 📦 Build for production
4. 🚀 Deploy to Netlify
5. 🧪 Test deployed version
6. 📝 Update STUDENT.txt with URL
7. ✅ Submit!

## Support

Check:

- README.md - Full documentation
- DEPLOYMENT.md - Deployment guide
- IMPLEMENTATION-SUMMARY.md - Feature summary

Happy coding! 🚀
