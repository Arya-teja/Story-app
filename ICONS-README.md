# PWA Icons and Screenshots Setup

## Required Icons

Create the following PNG icons in `src/public/images/`:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Required Screenshots

Create the following PNG screenshots in `src/public/images/`:

- screenshot-mobile.png (375x812px) - Mobile view of your app
- screenshot-desktop.png (1920x1080px) - Desktop view of your app

## Quick Generation

### Option 1: Use Online Tools

- Icons: https://realfavicongenerator.net/
- Or: https://www.pwabuilder.com/imageGenerator

### Option 2: Use Logo.png

If you have a logo.png file, you can use it as base and resize to different sizes using ImageMagick or online tools.

### Option 3: Use Favicon

Convert your existing favicon.png to different sizes.

## For Now (Development)

You can copy favicon.png to each icon size temporarily:

```bash
# PowerShell
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)
foreach ($size in $sizes) {
    Copy-Item "src\public\favicon.png" "src\public\images\icon-${size}x${size}.png"
}
```

## Screenshots

Take actual screenshots of your app:

1. Open your app in browser
2. For mobile: Open DevTools, toggle device toolbar, select iPhone or similar
3. Take screenshot (F12 → Ctrl+Shift+P → "Capture screenshot")
4. For desktop: Take full page screenshot at 1920x1080

## After Creating Icons

The vite.config.js is already configured to use these icons.
