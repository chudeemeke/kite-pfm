# Troubleshooting Guide for Kite PFM

This guide provides solutions to common issues you may encounter while developing, building, or using the Kite Personal Finance Manager application.

## Table of Contents
- [Development Environment Issues](#development-environment-issues)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Runtime Errors](#runtime-errors)
- [Database/IndexedDB Issues](#databaseindexeddb-issues)
- [PWA Installation Problems](#pwa-installation-problems)
- [Browser Compatibility Issues](#browser-compatibility-issues)
- [Performance Problems](#performance-problems)
- [Data Sync Issues](#data-sync-issues)
- [Debug Logging Strategies](#debug-logging-strategies)
- [FAQ Section](#faq-section)

## Development Environment Issues

### Node.js and npm Issues

**Problem**: Module resolution errors or dependency conflicts
```bash
Error: Cannot resolve module '@/components/...'
```

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify Node.js version (should be 18+)
node --version

# Check TypeScript path resolution
npx tsc --showConfig
```

**Problem**: Vite dev server won't start
```bash
Error: EADDRINUSE: address already in use :::5173
```

**Solution**:
```bash
# Find and kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### TypeScript Configuration Issues

**Problem**: Type errors in development
```typescript
// Property 'id' does not exist on type 'Transaction'
```

**Solution**:
```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P -> "TypeScript: Restart TS Server"

# Check tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Vite Configuration Problems

**Problem**: Static assets not loading
```
Failed to load resource: http://localhost:5173/assets/icon.svg
```

**Solution**:
```typescript
// Ensure public folder structure is correct
public/
  ├── apple-touch-icon.png
  ├── icon.svg
  ├── manifest.webmanifest
  └── pwa-*.png

// Check vite.config.ts base path
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  // ...
})
```

## Build and Deployment Issues

### Build Failures

**Problem**: TypeScript compilation errors during build
```bash
error TS2307: Cannot find module '@/types' or its type declarations
```

**Solution**:
```bash
# Run type checking separately
npm run typecheck

# Fix path resolution in tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Problem**: Bundle size too large
```bash
Warning: Bundle size exceeds recommended limit
```

**Solution**:
```bash
# Analyze bundle
npm install --save-dev rollup-plugin-visualizer
npm run build -- --analyze

# Implement code splitting
const LazyComponent = lazy(() => import('./HeavyComponent'))
```

### PWA Build Issues

**Problem**: Service worker registration fails
```javascript
Error: Failed to register service worker
```

**Solution**:
```typescript
// Check vite-plugin-pwa configuration
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
  },
  devOptions: {
    enabled: true // Enable for development testing
  }
})
```

**Problem**: Manifest validation errors
```
Manifest: property 'start_url' ignored, should be within scope
```

**Solution**:
```json
{
  "start_url": "/",
  "scope": "/",
  "display": "standalone"
}
```

## Runtime Errors

### React Component Errors

**Problem**: White screen of death
```javascript
ChunkLoadError: Loading chunk failed
```

**Solution**:
```typescript
// Implement error boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>
    }
    return this.props.children
  }
}
```

**Problem**: Memory leaks in components
```javascript
Warning: Memory usage is increasing
```

**Solution**:
```typescript
useEffect(() => {
  const subscription = someService.subscribe(callback)
  
  return () => {
    subscription.unsubscribe() // Always cleanup
  }
}, [])

// Clear refs on unmount
const ref = useRef(null)
useEffect(() => {
  return () => {
    ref.current = null
  }
}, [])
```

### State Management Errors

**Problem**: Zustand store not updating
```typescript
// State changes but component doesn't re-render
```

**Solution**:
```typescript
// Ensure proper selector usage
const transactions = useTransactionsStore(state => state.transactions)

// Not this
const store = useTransactionsStore()

// Check store mutations
const updateTransaction = (id: string, updates: Partial<Transaction>) => {
  set(state => ({
    transactions: state.transactions.map(t => 
      t.id === id ? { ...t, ...updates } : t
    )
  }))
}
```

### Router Issues

**Problem**: 404 errors on refresh in production
```
Cannot GET /accounts
```

**Solution**:
```apache
# .htaccess for Apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

```nginx
# nginx configuration
location / {
  try_files $uri $uri/ /index.html;
}
```

## Database/IndexedDB Issues

### Connection Problems

**Problem**: Database fails to open
```javascript
Error: Failed to open database
```

**Solution**:
```typescript
// Check browser support
if (!('indexedDB' in window)) {
  console.error('IndexedDB not supported')
  // Fallback to localStorage or show error
  return
}

// Handle blocked database
db.on('blocked', () => {
  console.warn('Database blocked by another tab')
  // Show message to user
})

// Handle version change
db.on('versionchange', () => {
  db.close()
  location.reload()
})
```

### Schema Migration Issues

**Problem**: Migration fails during upgrade
```javascript
Error: Transaction aborted due to constraint failure
```

**Solution**:
```typescript
// Robust migration handling
this.version(3).stores({
  // Updated schema
}).upgrade(async tx => {
  try {
    // Safe migration
    await tx.table('transactions').toCollection().modify(transaction => {
      if (!transaction.metadata) {
        transaction.metadata = {}
      }
    })
  } catch (error) {
    console.error('Migration failed:', error)
    // Handle gracefully
    throw error
  }
})
```

### Query Performance Issues

**Problem**: Slow database queries
```javascript
Query taking longer than 1000ms
```

**Solution**:
```typescript
// Use proper indexes
const recentTransactions = await db.transactions
  .where('[accountId+date]') // Use compound index
  .between([accountId, startDate], [accountId, endDate])
  .reverse()
  .limit(100)
  .toArray()

// Add pagination
const PAGE_SIZE = 50
const getTransactionPage = async (cursor?: string) => {
  let query = db.transactions.orderBy('date').reverse()
  
  if (cursor) {
    query = query.offset(parseInt(cursor))
  }
  
  return query.limit(PAGE_SIZE).toArray()
}
```

### Data Corruption Issues

**Problem**: Invalid data in database
```javascript
Error: Invalid transaction format
```

**Solution**:
```typescript
// Validate data before insertion
const validateTransaction = (transaction: Transaction): boolean => {
  if (!transaction.id || typeof transaction.id !== 'string') return false
  if (!transaction.accountId) return false
  if (typeof transaction.amount !== 'number') return false
  if (!transaction.date || !(transaction.date instanceof Date)) return false
  return true
}

// Sanitize data on read
const sanitizeTransaction = (raw: any): Transaction | null => {
  try {
    return {
      id: String(raw.id),
      accountId: String(raw.accountId),
      amount: Number(raw.amount),
      date: new Date(raw.date),
      description: String(raw.description || ''),
      // ... other fields
    }
  } catch (error) {
    console.error('Failed to sanitize transaction:', raw, error)
    return null
  }
}
```

## PWA Installation Problems

### Installation Prompt Issues

**Problem**: Install prompt doesn't appear
```javascript
beforeinstallprompt event not fired
```

**Solution**:
```typescript
// Check PWA criteria
const checkPWARequirements = () => {
  // HTTPS check
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.warn('PWA requires HTTPS')
    return false
  }
  
  // Service worker check
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported')
    return false
  }
  
  // Manifest check
  const manifest = document.querySelector('link[rel="manifest"]')
  if (!manifest) {
    console.warn('Web App Manifest not found')
    return false
  }
  
  return true
}

// Manual installation prompt
let deferredPrompt: any
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  // Show custom install button
})

const installApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    console.log('User choice:', result.outcome)
    deferredPrompt = null
  }
}
```

### Service Worker Issues

**Problem**: Service worker not updating
```javascript
New version available but not activating
```

**Solution**:
```typescript
// Force service worker update
const updateServiceWorker = async () => {
  const registration = await navigator.serviceWorker.getRegistration()
  if (registration) {
    await registration.update()
    
    // Skip waiting and claim clients
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }
}

// Listen for updates
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload()
})
```

## Browser Compatibility Issues

### Safari Specific Issues

**Problem**: IndexedDB issues in Safari
```javascript
Error: The operation failed for reasons unrelated to the database itself
```

**Solution**:
```typescript
// Safari-specific handling
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

if (isSafari) {
  // Implement Safari-specific workarounds
  db.on('error', (error) => {
    if (error.name === 'QuotaExceededError') {
      // Handle Safari storage quota issues
      showStorageWarning()
    }
  })
}
```

**Problem**: CSS issues in older browsers
```css
/* Grid not supported */
display: grid;
```

**Solution**:
```css
/* Fallback support */
.grid-container {
  display: flex; /* Fallback */
  display: grid; /* Modern browsers */
  flex-wrap: wrap;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.grid-item {
  flex: 1 1 250px; /* Fallback */
}
```

### iOS Safari Issues

**Problem**: 100vh viewport issues
```css
height: 100vh; /* Doesn't account for Safari UI */
```

**Solution**:
```css
/* Use CSS custom properties */
:root {
  --vh: 1vh;
}

.full-height {
  height: calc(var(--vh, 1vh) * 100);
}
```

```javascript
// Update custom property
const updateVH = () => {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

window.addEventListener('resize', updateVH)
updateVH()
```

## Performance Problems

### Slow Rendering

**Problem**: Components re-rendering too often
```javascript
Component rendered 50 times in 1 second
```

**Solution**:
```typescript
// Use React.memo
const OptimizedComponent = memo(({ data }) => {
  return <div>{data.name}</div>
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id
})

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data)
}, [data])

// Use useCallback for functions
const handleClick = useCallback((id: string) => {
  onClick(id)
}, [onClick])
```

### Memory Issues

**Problem**: Memory usage keeps increasing
```javascript
Memory usage: 150MB and growing
```

**Solution**:
```typescript
// Implement cleanup
useEffect(() => {
  const timer = setInterval(cleanup, 60000) // Cleanup every minute
  
  return () => {
    clearInterval(timer)
  }
}, [])

// Clear large objects
const clearLargeData = useCallback(() => {
  setLargeDataset(null)
}, [])

// Use WeakMap for object associations
const objectCache = new WeakMap()
```

## Data Sync Issues

### Offline/Online Sync

**Problem**: Data conflicts when coming back online
```javascript
Error: Conflict detected during sync
```

**Solution**:
```typescript
// Implement conflict resolution
const resolveConflict = (local: Transaction, remote: Transaction) => {
  // Last write wins strategy
  return local.updatedAt > remote.updatedAt ? local : remote
}

// Queue offline changes
const offlineQueue: PendingChange[] = []

const syncOfflineChanges = async () => {
  for (const change of offlineQueue) {
    try {
      await syncChange(change)
      // Remove from queue on success
      offlineQueue.splice(offlineQueue.indexOf(change), 1)
    } catch (error) {
      console.error('Sync failed for change:', change, error)
      // Keep in queue for retry
    }
  }
}
```

## Debug Logging Strategies

### Development Logging

```typescript
// Environment-based logging
const logger = {
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },
  
  error: (message: string, error?: Error, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, error, ...args)
    
    // Send to error tracking in production
    if (import.meta.env.PROD) {
      // sendToErrorTracking(message, error, args)
    }
  },
  
  performance: (name: string, fn: () => void) => {
    const start = performance.now()
    fn()
    const end = performance.now()
    console.log(`[PERF] ${name}: ${end - start}ms`)
  }
}
```

### Database Debugging

```typescript
// Enable Dexie debugging
import Dexie from 'dexie'

if (import.meta.env.DEV) {
  Dexie.debug = true
}

// Custom query logging
const loggedQuery = async (queryName: string, query: () => Promise<any>) => {
  const start = performance.now()
  try {
    const result = await query()
    const end = performance.now()
    logger.debug(`Query ${queryName} completed in ${end - start}ms`)
    return result
  } catch (error) {
    logger.error(`Query ${queryName} failed`, error)
    throw error
  }
}
```

### Network Debugging

```typescript
// Log all fetch requests
const originalFetch = window.fetch
window.fetch = async (...args) => {
  const start = performance.now()
  logger.debug('Fetch request:', args[0])
  
  try {
    const response = await originalFetch(...args)
    const end = performance.now()
    logger.debug(`Fetch completed in ${end - start}ms:`, response.status)
    return response
  } catch (error) {
    logger.error('Fetch failed:', error)
    throw error
  }
}
```

## FAQ Section

### Q: Why is my app not working offline?

**A**: Check the following:
1. Service worker is registered correctly
2. IndexedDB is available and working
3. All critical assets are cached
4. Network requests have offline fallbacks

### Q: How do I clear all app data for testing?

**A**: Use the browser's developer tools:
```javascript
// In console
indexedDB.deleteDatabase('KiteDatabase')
localStorage.clear()
sessionStorage.clear()
// Reload page
location.reload()
```

### Q: Why are my transactions not saving?

**A**: Common causes:
1. Browser storage quota exceeded
2. IndexedDB transaction conflicts
3. Invalid data format
4. Missing required fields

Check the console for specific error messages.

### Q: How do I report a bug?

**A**: Include the following information:
1. Browser and version
2. Operating system
3. Steps to reproduce
4. Console error messages
5. Network requests (if applicable)

### Q: Why is the app slow on mobile?

**A**: Optimize for mobile:
1. Reduce bundle size
2. Implement virtual scrolling for large lists
3. Use CSS containment
4. Minimize main thread blocking
5. Test on actual devices, not just browser dev tools

### Q: How do I backup my data?

**A**: Use the built-in export feature:
1. Go to Settings > Data Management
2. Click "Export Data"
3. Save the JSON file securely
4. To restore, use "Import Data"

### Q: App won't install as PWA

**A**: Requirements for PWA installation:
1. HTTPS connection (or localhost)
2. Valid web app manifest
3. Service worker registered
4. App must meet engagement heuristics

### Q: How do I update the app?

**A**: The app updates automatically. If you see an update notification:
1. Close all tabs with the app
2. Reopen the app
3. The new version will load automatically

For manual updates, go to Settings > About and check for updates.

### Q: Data disappeared after browser update

**A**: Browser updates sometimes clear data. Prevention:
1. Regular data exports
2. Enable browser sync if available
3. Check if data is in browser's recovery/restore options

### Q: App crashes on startup

**A**: Try these steps:
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Reset app data
4. Check browser console for errors
5. Try incognito/private mode

If issues persist, check if your browser supports all required features:
- IndexedDB
- Service Workers
- ES2020 JavaScript features

Remember: When in doubt, check the browser's developer console for specific error messages. Most issues have detailed error logs that can guide you to the solution.