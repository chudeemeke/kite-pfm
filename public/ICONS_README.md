# PWA Icons Required

To complete the PWA setup, please add the following icon files to this directory:

## Required Icon Files:

1. **pwa-64x64.png** - 64x64 pixels
   - Small icon for various UI elements

2. **pwa-192x192.png** - 192x192 pixels  
   - Standard PWA icon, used in app drawer and shortcuts

3. **pwa-512x512.png** - 512x512 pixels
   - Large icon for splash screen and high-DPI displays

4. **maskable-icon-512x512.png** - 512x512 pixels
   - Maskable icon for Android adaptive icons
   - Should have important content within the safe zone (center 80%)

5. **favicon.ico** - 16x16, 32x32 pixels
   - Traditional favicon for browser tabs

6. **apple-touch-icon.png** - 180x180 pixels
   - iOS home screen icon

## Icon Design Guidelines:

- Use the Kite branding with the 🪁 emoji or stylized kite imagery
- Primary color: #0ea5e9 (blue)
- Background: White or transparent
- Simple, clean design that works at small sizes
- For maskable icons, ensure important elements are in the center 80% safe zone

## Tools for Icon Generation:

- [PWA Builder](https://www.pwabuilder.com/)
- [Favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

The current vite.config.ts is already configured to use these icons.