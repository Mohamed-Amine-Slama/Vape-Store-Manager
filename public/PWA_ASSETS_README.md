# PWA Assets

This directory contains Progressive Web App (PWA) assets for the Vape Store Manager application.

## Required Assets

The following assets are referenced in `vite.config.js` and need to be properly generated:

### Icons
- `pwa-192x192.png` - 192x192 pixel app icon
- `pwa-512x512.png` - 512x512 pixel app icon  
- `favicon.ico` - Browser favicon

### Other Assets
- `vite.svg` - Default Vite logo (already exists)
- `robots.txt` - Search engine directives (already exists)
- `manifest.json` - PWA manifest (already exists)

## Generating Proper Icons

To generate proper PWA icons, you can:

1. **Use an online PWA icon generator:**
   - Upload your app logo/icon
   - Generate all required sizes
   - Replace the placeholder files

2. **Use design tools:**
   - Create 512x512 PNG with your app branding
   - Resize to create 192x192 version
   - Convert to ICO format for favicon

3. **Recommended specifications:**
   - Use solid background colors
   - Ensure icons are readable at small sizes
   - Follow PWA icon guidelines
   - Use your app's brand colors

## Current Status

Currently, placeholder empty files have been created to prevent build errors. These should be replaced with proper branded icons before production deployment.

## App Branding Suggestions

For the Vape Store Manager app, consider:
- Store/shop icon themes
- Blue color scheme (matches current app theme)
- Professional, clean design
- Readable at small sizes
