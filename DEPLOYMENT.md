# Deployment Guide for Story App PWA

## Prerequisites

- GitHub account
- Netlify account (or Vercel/Firebase)

## Steps to Deploy to Netlify

### Option 1: Deploy via Netlify CLI

1. **Install Netlify CLI**

   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**

   ```bash
   netlify login
   ```

3. **Build the project**

   ```bash
   npm run build
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

### Option 2: Deploy via Netlify Website (Recommended)

1. **Push code to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit - Story App PWA"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/story-app.git
   git push -u origin main
   ```

2. **Connect to Netlify**

   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Update STUDENT.txt**
   - After deployment, copy the Netlify URL (e.g., `https://your-app-name.netlify.app`)
   - Update `STUDENT.txt`:
     ```
     APP_URL=https://your-app-name.netlify.app
     ```
   - Commit and push changes

### Option 3: Deploy to Vercel

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 4: Deploy to Firebase Hosting

1. **Install Firebase CLI**

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**

   ```bash
   firebase login
   ```

3. **Initialize Firebase**

   ```bash
   firebase init hosting
   ```

   - Select your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

4. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Post-Deployment Checklist

1. **Test PWA Features**

   - [ ] Open deployed URL in Chrome/Edge
   - [ ] Check if "Install App" prompt appears
   - [ ] Install the app
   - [ ] Test offline functionality (turn off network in DevTools)
   - [ ] Test push notifications (enable in app)

2. **Test Chrome DevTools → Application**

   - [ ] Manifest: No errors, all fields correct
   - [ ] Service Workers: Active and running
   - [ ] Storage → IndexedDB: Database created
   - [ ] Cache Storage: App shell cached

3. **Test Lighthouse (PWA Audit)**

   - [ ] Open DevTools → Lighthouse
   - [ ] Select "Progressive Web App"
   - [ ] Run audit
   - [ ] Score should be 100 or close to it

4. **Update STUDENT.txt**
   - Replace `APP_URL=https://your-story-app.netlify.app` with actual URL
   - Commit and push changes

## Troubleshooting

### Service Worker not registering

- Check console for errors
- Ensure `sw.js` is in the root of `dist` folder
- Clear cache and hard reload (Ctrl+Shift+R)

### Push Notifications not working

- Ensure HTTPS is enabled (Netlify provides this)
- Check browser permissions
- Test with simple test notification first

### App not installable

- Check manifest.webmanifest is accessible
- Ensure all required icons exist
- Check for HTTPS

### Offline mode not working

- Check Service Worker is active
- Verify caching strategy in vite.config.js
- Check Network tab in DevTools (switch to Offline)

## Testing Before Submission

1. **Clean test on different device**

   - Use phone or different computer
   - Open deployed URL
   - Test all features

2. **Check all criteria**
   - ✅ Kriteria 1: SPA masih berfungsi
   - ✅ Kriteria 2: Push notification tampil
   - ✅ Kriteria 3: PWA installable dan offline-ready
   - ✅ Kriteria 4: IndexedDB Favorites dengan filter/search
   - ✅ Kriteria 5: Deployed dan URL di STUDENT.txt

## Support

If you encounter issues:

- Check browser console for errors
- Test in incognito mode
- Clear all cache and try again
- Refer to Vite PWA documentation: https://vite-pwa-org.netlify.app/
