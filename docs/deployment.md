# Deployment Guide

This guide covers building, deploying, and maintaining the Kite Personal Finance Manager PWA in production environments.

## Build Process

### Development Build

```bash
# Development server (for testing)
npm run dev

# Preview production build locally
npm run build
npm run preview
```

### Production Build

```bash
# Full production build
npm run build

# Build with type checking
npm run typecheck && npm run build

# Build with tests
npm run test && npm run build
```

### Build Configuration

The build process is configured in `vite.config.ts`:

```typescript
export default defineConfig(({ mode }) => {
  const base = process.env.VITE_BASE || '/'
  
  return {
    base,
    build: {
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'chart-vendor': ['recharts'],
            'db-vendor': ['dexie', 'dexie-react-hooks'],
            'state-vendor': ['zustand']
          }
        }
      }
    }
  }
})
```

### Build Output Structure

```
dist/
├── assets/
│   ├── index-[hash].js       # Main application bundle
│   ├── react-vendor-[hash].js # React dependencies
│   ├── chart-vendor-[hash].js # Chart library
│   ├── db-vendor-[hash].js    # Database dependencies
│   └── index-[hash].css       # Compiled styles
├── pwa-192x192.png           # PWA icons
├── pwa-512x512.png
├── maskable-icon-512x512.png
├── manifest.webmanifest      # PWA manifest
├── sw.js                     # Service worker
├── workbox-[hash].js         # Workbox runtime
└── index.html                # Main HTML file
```

### Build Optimization

#### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --mode analyze

# Alternative: Use bundle analyzer
npx vite-bundle-analyzer
```

#### Performance Optimizations

1. **Code Splitting**: Automatic with Vite and manual chunks
2. **Tree Shaking**: Dead code elimination
3. **Asset Optimization**: Image and CSS optimization
4. **Service Worker**: Caching strategies for offline support

## Environment-Specific Configurations

### Environment Variables

Create environment-specific `.env` files:

#### Development (`.env.development`)
```env
VITE_BASE=/
VITE_DEV_MODE=true
VITE_API_URL=http://localhost:3000/api
VITE_SENTRY_DSN=
VITE_ANALYTICS_ID=
```

#### Staging (`.env.staging`)
```env
VITE_BASE=/
VITE_DEV_MODE=false
VITE_API_URL=https://staging-api.kite-app.com/api
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
VITE_ANALYTICS_ID=UA-STAGING-ID
```

#### Production (`.env.production`)
```env
VITE_BASE=/
VITE_DEV_MODE=false
VITE_API_URL=https://api.kite-app.com/api
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
VITE_ANALYTICS_ID=UA-PRODUCTION-ID
```

### Build Commands for Different Environments

```bash
# Development build
npm run build:dev

# Staging build
npm run build:staging

# Production build
npm run build:prod
```

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "build:dev": "vite build --mode development",
    "build:staging": "vite build --mode staging",
    "build:prod": "vite build --mode production"
  }
}
```

## GitHub Pages Deployment

### Automatic Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test -- --run
    
    - name: Run type checking
      run: npm run typecheck
    
    - name: Build for GitHub Pages
      run: npm run build
      env:
        VITE_BASE: /${{ github.event.repository.name }}/
    
    - name: Setup Pages
      uses: actions/configure-pages@v4
    
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: ./dist
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
```

### Manual GitHub Pages Setup

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "GitHub Actions" as source

2. **Configure Base URL**:
   ```bash
   # Build with correct base URL
   VITE_BASE=/your-repo-name/ npm run build
   ```

3. **Deploy**:
   ```bash
   # Push to main branch to trigger deployment
   git push origin main
   ```

### Custom Domain Setup

1. **Add CNAME file** to `public/` directory:
   ```
   your-domain.com
   ```

2. **Configure DNS**:
   - Add CNAME record pointing to `username.github.io`
   - Or A records pointing to GitHub Pages IPs

3. **Update build configuration**:
   ```env
   VITE_BASE=/
   ```

## Self-Hosting Options

### Static File Hosting

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/kite
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # PWA-specific headers
    add_header Cache-Control "no-cache" always;
    
    # Root directory
    root /var/www/kite/dist;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Service worker - no cache
    location /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # PWA manifest
    location /manifest.webmanifest {
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Apache Configuration

```apache
# .htaccess in dist/ directory
RewriteEngine On

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header append Cache-Control "public, immutable"
</FilesMatch>

# Service worker - no cache
<Files "sw.js">
    ExpiresActive Off
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</Files>
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  kite:
    build: .
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Optional: Reverse proxy
  traefik:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
```

### Cloud Deployment

#### Vercel

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "VITE_BASE": "/",
    "VITE_API_URL": "@api_url"
  },
  "functions": {
    "app/**": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

#### Netlify

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## PWA Considerations

### Service Worker Configuration

The PWA configuration in `vite.config.ts`:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
  manifest: {
    name: 'Kite - Personal Finance Manager',
    short_name: 'Kite',
    description: 'A mobile-first personal finance PWA',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    start_url: base,
    scope: base,
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      }
    ]
  }
})
```

### PWA Deployment Checklist

- [ ] HTTPS enabled
- [ ] Manifest file correctly configured
- [ ] Service worker registered
- [ ] Icons in multiple sizes
- [ ] Offline functionality working
- [ ] Install prompt working
- [ ] App shell cached
- [ ] Critical resources cached

### Testing PWA Features

```bash
# Test PWA with Lighthouse
npx lighthouse http://localhost:4173 --view

# Test offline functionality
# 1. Open Chrome DevTools
# 2. Go to Network tab
# 3. Check "Offline" checkbox
# 4. Refresh page - should still work
```

## Performance Optimization

### Build Optimizations

#### Bundle Splitting

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // Separate vendor chunks
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'chart-vendor': ['recharts'],
        'db-vendor': ['dexie', 'dexie-react-hooks'],
        'state-vendor': ['zustand'],
        
        // Feature-based chunks
        'settings': ['@/pages/Settings', '@/components/settings/'],
        'charts': ['@/components/Charts/']
      }
    }
  }
}
```

#### Asset Optimization

```typescript
// vite.config.ts
build: {
  assetsInlineLimit: 4096, // Inline small assets
  cssCodeSplit: true,       // Split CSS by route
  sourcemap: false,         // Disable sourcemaps in production
  minify: 'terser',         // Use Terser for better compression
  terserOptions: {
    compress: {
      drop_console: true,   // Remove console.log in production
      drop_debugger: true
    }
  }
}
```

### Runtime Optimizations

#### Lazy Loading

```typescript
// Lazy load components
const Settings = lazy(() => import('@/pages/Settings'))
const Insights = lazy(() => import('@/pages/Insights'))

// In router
<Route
  path="/settings"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <Settings />
    </Suspense>
  }
/>
```

#### Image Optimization

```typescript
// Use responsive images
<picture>
  <source
    srcSet="/images/hero-mobile.webp"
    media="(max-width: 768px)"
    type="image/webp"
  />
  <source
    srcSet="/images/hero-desktop.webp"
    media="(min-width: 769px)"
    type="image/webp"
  />
  <img
    src="/images/hero-fallback.jpg"
    alt="Hero image"
    loading="lazy"
  />
</picture>
```

### Performance Monitoring

#### Core Web Vitals

```typescript
// src/services/analytics.ts
export const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry)
      getFID(onPerfEntry)
      getFCP(onPerfEntry)
      getLCP(onPerfEntry)
      getTTFB(onPerfEntry)
    })
  }
}
```

#### Performance Budget

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        // Warn if chunk is too large
        if (id.includes('node_modules')) {
          return 'vendor'
        }
      }
    }
  }
}
```

## Security Checklist

### Content Security Policy

```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self' https://api.kite-app.com;
">
```

### Security Headers

```nginx
# Security headers in nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

### Environment Variables Security

- Never commit `.env` files
- Use secrets management for sensitive data
- Validate environment variables at build time
- Use different keys for different environments

### Dependency Security

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

## Monitoring and Analytics

### Error Tracking with Sentry

```typescript
// src/services/errorTracking.ts
import * as Sentry from '@sentry/react'

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing(),
    ],
    tracesSampleRate: 0.1,
  })
}
```

### Analytics Integration

```typescript
// src/services/analytics.ts
import { gtag } from 'ga-gtag'

export const trackEvent = (eventName: string, parameters?: any) => {
  if (import.meta.env.VITE_ANALYTICS_ID) {
    gtag('event', eventName, parameters)
  }
}

export const trackPageView = (path: string) => {
  if (import.meta.env.VITE_ANALYTICS_ID) {
    gtag('config', import.meta.env.VITE_ANALYTICS_ID, {
      page_path: path
    })
  }
}
```

### Performance Monitoring

```typescript
// Monitor bundle size
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart)
    }
  }
})

observer.observe({ entryTypes: ['navigation'] })
```

## Rollback Procedures

### GitHub Pages Rollback

```bash
# Rollback to previous commit
git revert HEAD
git push origin main

# Or rollback to specific commit
git reset --hard PREVIOUS_COMMIT_HASH
git push --force origin main
```

### Docker Rollback

```bash
# Tag images with version numbers
docker build -t kite:v1.2.3 .
docker build -t kite:latest .

# Rollback to previous version
docker stop kite-container
docker run -d --name kite-container kite:v1.2.2
```

### Automated Rollback

```yaml
# GitHub Actions with rollback
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy
      id: deploy
      run: |
        # Deploy new version
        
    - name: Health Check
      run: |
        # Check if deployment is healthy
        if ! curl -f https://your-domain.com/health; then
          echo "Health check failed"
          exit 1
        fi
        
    - name: Rollback on Failure
      if: failure()
      run: |
        # Rollback to previous version
        git revert HEAD
        git push origin main
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Build optimization verified
- [ ] Security headers configured
- [ ] Performance budget met

### Deployment

- [ ] Build completed successfully
- [ ] Assets uploaded to CDN
- [ ] DNS records updated (if needed)
- [ ] SSL certificate valid
- [ ] Service worker updated
- [ ] Cache invalidation triggered

### Post-Deployment

- [ ] Health check passed
- [ ] PWA installability verified
- [ ] Core Web Vitals measured
- [ ] Error tracking active
- [ ] Analytics tracking verified
- [ ] Backup of previous version available

### Monitoring

- [ ] Error rates normal
- [ ] Performance metrics acceptable
- [ ] User engagement metrics tracked
- [ ] Server resources within limits
- [ ] CDN cache hit rates optimal

## Troubleshooting Common Issues

### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules/.vite dist
npm ci
npm run build
```

### Service Worker Issues

```javascript
// Force service worker update
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister())
  })
}
```

### Routing Issues in Production

- Ensure server redirects all routes to `index.html`
- Check base URL configuration
- Verify client-side routing setup

### PWA Installation Issues

- Verify HTTPS is enabled
- Check manifest.json is accessible
- Ensure service worker is registered
- Test installation criteria are met

This deployment guide provides comprehensive coverage of building, deploying, and maintaining the Kite PWA across different environments and hosting platforms.