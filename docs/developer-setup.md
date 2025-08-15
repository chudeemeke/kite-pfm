# Developer Setup Guide

This guide will help you set up your development environment for the Kite Personal Finance Manager PWA.

## Prerequisites

### Required Software

1. **Node.js** (version 18.0 or higher)
   ```bash
   # Check your Node.js version
   node --version
   
   # Recommended: Use Node Version Manager (nvm)
   nvm install 18
   nvm use 18
   ```

2. **npm** (comes with Node.js)
   ```bash
   # Check npm version
   npm --version
   ```

3. **Git**
   ```bash
   # Check Git version
   git --version
   ```

### Optional but Recommended

- **VS Code**: Preferred IDE with excellent TypeScript support
- **Chrome DevTools**: For PWA testing and debugging
- **React Developer Tools**: Browser extension for React debugging

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd Kite

# Install dependencies
npm install

# Verify installation
npm run typecheck
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# Development settings
VITE_BASE=/
VITE_DEV_MODE=true

# Optional: Analytics (for production)
# VITE_ANALYTICS_ID=your-analytics-id

# Optional: Sentry (for error tracking)
# VITE_SENTRY_DSN=your-sentry-dsn
```

## IDE Configuration

### VS Code Recommended Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.useAliasesForRenames": false,
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### VS Code Recommended Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright",
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

## Development Workflow

### 1. Start Development Server

```bash
# Start the development server (port 5173)
npm run dev

# The app will be available at:
# http://localhost:5173
```

The development server includes:
- **Hot Module Replacement (HMR)**: Instant updates without page refresh
- **TypeScript checking**: Real-time type error reporting
- **PWA development mode**: Service worker enabled for testing

### 2. Code Quality Checks

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Run all checks before committing
npm run typecheck && npm run lint
```

### 3. Testing During Development

```bash
# Run unit tests in watch mode
npm run test

# Run tests with UI (recommended)
npm run test:ui

# Run E2E tests
npm run test:e2e

# Check test coverage
npm run test:coverage
```

## Debugging Tips

### 1. React Developer Tools

Install the React Developer Tools browser extension:
- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Firefox: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

Usage:
- **Components tab**: Inspect React component tree and props
- **Profiler tab**: Analyze component render performance

### 2. Zustand State Debugging

Add the Redux DevTools extension for Zustand debugging:

```typescript
// In your store files (already configured)
import { devtools } from 'zustand/middleware'

export const useAccountsStore = create<AccountsState>()(
  devtools(
    (set, get) => ({
      // Store implementation
    }),
    { name: 'accounts-store' }
  )
)
```

### 3. IndexedDB Debugging

Use Chrome DevTools to inspect the Dexie database:
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Navigate to **Storage** → **IndexedDB** → **KiteDB**
4. Inspect tables: accounts, transactions, budgets, etc.

### 4. PWA Debugging

Test PWA features in Chrome DevTools:
1. **Application** tab → **Service Workers**: Check SW registration
2. **Application** tab → **Manifest**: Verify PWA manifest
3. **Lighthouse** tab: Run PWA audit

### 5. Network Debugging

Monitor API calls and caching:
1. **Network** tab: Check all requests
2. **Application** tab → **Storage**: Check Cache Storage for PWA assets

## Hot Reload and Development Server

### Configuration

The development server is configured in `vite.config.ts`:

```typescript
server: {
  port: 5173,
  host: true, // Allows access from other devices on network
  open: true  // Auto-opens browser
}
```

### Features

- **Fast HMR**: Changes reflect instantly
- **TypeScript compilation**: Real-time error checking
- **Asset optimization**: Automatic image and asset processing
- **Proxy support**: Can proxy API calls to backend servers

### Performance Tips

```bash
# Clear Vite cache if experiencing issues
rm -rf node_modules/.vite

# Restart development server
npm run dev
```

## Environment Variables

### Available Variables

```env
# Base URL for deployment (default: '/')
VITE_BASE=/kite/

# Development mode flag
VITE_DEV_MODE=true

# Analytics configuration
VITE_ANALYTICS_ID=GA_MEASUREMENT_ID

# Error tracking
VITE_SENTRY_DSN=https://...

# Feature flags
VITE_ENABLE_ADVANCED_CHARTS=true
VITE_ENABLE_EXPORT_FEATURE=true
```

### Usage in Code

```typescript
// Access environment variables
const isDev = import.meta.env.VITE_DEV_MODE === 'true'
const baseUrl = import.meta.env.VITE_BASE || '/'
const analyticsId = import.meta.env.VITE_ANALYTICS_ID
```

## Troubleshooting Common Setup Issues

### 1. Node.js Version Issues

**Problem**: Build fails with Node.js errors
```bash
# Solution: Use correct Node.js version
nvm install 18
nvm use 18
npm install
```

### 2. Package Installation Errors

**Problem**: `npm install` fails
```bash
# Solution: Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 3. TypeScript Errors

**Problem**: Type checking fails
```bash
# Check for missing type definitions
npm install --save-dev @types/node

# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### 4. Port Already in Use

**Problem**: Port 5173 is occupied
```bash
# Use different port
npm run dev -- --port 3000

# Or kill process using port 5173
lsof -ti:5173 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5173   # Windows
```

### 5. PWA Service Worker Issues

**Problem**: Service worker not updating
```bash
# Solution: Clear browser cache
# Chrome DevTools → Application → Storage → Clear storage
```

### 6. Vite Cache Issues

**Problem**: Changes not reflecting
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### 7. Import Path Issues

**Problem**: Module imports fail with `@/` alias
```bash
# Verify tsconfig.json paths configuration:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 8. Testing Setup Issues

**Problem**: Tests fail to run
```bash
# Verify test setup
npm run test -- --reporter=verbose

# Check test configuration in vitest.config.ts
# Ensure jsdom environment is properly configured
```

### 9. Mobile Testing

**Problem**: Testing on mobile devices
```bash
# Enable network access
npm run dev -- --host

# Access from mobile device using your computer's IP
# http://YOUR_IP:5173
```

### 10. Database Issues in Development

**Problem**: IndexedDB errors in tests
```typescript
// Ensure proper test setup in src/test/setup.ts
// Mock IndexedDB for tests that don't need real database
```

## Development Best Practices

### 1. Code Organization

- Use the `@/` alias for imports from `src/`
- Keep components small and focused
- Use custom hooks for shared logic
- Organize by feature, not by file type

### 2. State Management

- Use Zustand stores for global state
- Keep local state with `useState` for component-specific data
- Use derived state with store selectors

### 3. Styling

- Use Tailwind CSS utility classes
- Create reusable component variants
- Follow the design system in `tailwind.config.js`

### 4. Performance

- Use React.memo for expensive components
- Implement proper loading states
- Optimize bundle size with proper imports

### 5. Testing

- Write tests alongside your code
- Test user interactions, not implementation details
- Use data-testid for reliable element selection

## Getting Help

- **Documentation**: Check `/docs` folder for API and architecture docs
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: All changes require code review before merging

## Next Steps

After setup is complete:

1. Read the [Testing Guide](./testing.md) for testing strategies
2. Review the [Deployment Guide](./deployment.md) for build and deployment
3. Check the [API Documentation](./api/) for architecture details
4. Explore the codebase starting with `src/App.tsx`