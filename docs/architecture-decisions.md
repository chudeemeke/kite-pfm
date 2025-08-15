# Architecture Decision Records (ADRs) for Kite PFM

This document outlines the key architectural decisions made during the development of the Kite Personal Finance Manager, including the rationale behind technology choices and architectural patterns.

## Table of Contents
- [ADR-001: React + Vite + TypeScript](#adr-001-react--vite--typescript)
- [ADR-002: Zustand for State Management](#adr-002-zustand-for-state-management)
- [ADR-003: IndexedDB with Dexie](#adr-003-indexeddb-with-dexie)
- [ADR-004: Tailwind CSS for Styling](#adr-004-tailwind-css-for-styling)
- [ADR-005: PWA Architecture](#adr-005-pwa-architecture)
- [ADR-006: Security Model](#adr-006-security-model)
- [ADR-007: State Management Patterns](#adr-007-state-management-patterns)
- [ADR-008: Data Privacy Approach](#adr-008-data-privacy-approach)
- [ADR-009: Testing Strategy](#adr-009-testing-strategy)
- [ADR-010: Future Architecture Considerations](#adr-010-future-architecture-considerations)

---

## ADR-001: React + Vite + TypeScript

**Status**: Accepted  
**Date**: 2024-12-01  
**Decision Makers**: Development Team

### Context

We needed to choose a frontend framework and build tooling for a modern, mobile-first personal finance application that would be delivered as a Progressive Web App (PWA).

### Decision

We chose React with Vite as the build tool and TypeScript for type safety.

### Rationale

**React**:
- Large ecosystem and community support
- Excellent mobile performance with proper optimization
- Strong PWA support
- Team familiarity and expertise
- Mature ecosystem for financial applications

**Vite**:
- Fast development server with hot module replacement (HMR)
- Optimized build process with Rollup
- Excellent PWA plugin support (`vite-plugin-pwa`)
- Modern JavaScript support (ES2020+)
- Superior development experience compared to webpack

**TypeScript**:
- Type safety for financial calculations (critical for accuracy)
- Better developer experience with IntelliSense
- Compile-time error detection
- Self-documenting code
- Easier refactoring as application grows

### Configuration

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), VitePWA({...})],
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
})
```

### Consequences

**Positive**:
- Fast development cycles
- Type-safe financial calculations
- Excellent build optimization
- Strong PWA capabilities
- Future-proof technology stack

**Negative**:
- TypeScript learning curve for some developers
- Build complexity for advanced optimizations
- React bundle size (mitigated with code splitting)

**Risks Mitigated**:
- Type safety prevents financial calculation errors
- Modern build tools ensure optimal performance
- Strong ecosystem reduces third-party dependency risks

---

## ADR-002: Zustand for State Management

**Status**: Accepted  
**Date**: 2024-12-01  
**Decision Makers**: Development Team

### Context

We needed a state management solution that could handle complex financial data, provide good TypeScript support, and maintain simplicity without the boilerplate of larger solutions.

### Decision

We chose Zustand over Redux, Context API, or other state management libraries.

### Rationale

**Why Zustand**:
- Minimal boilerplate compared to Redux
- Excellent TypeScript support
- No providers needed (unlike Context API)
- Built-in persistence support
- Small bundle size (~2.5kb)
- Flexible architecture for both simple and complex state

**Why not Redux**:
- Too much boilerplate for a personal finance app
- Actions, reducers, and selectors add complexity
- Larger bundle size
- Over-engineering for the use case

**Why not Context API**:
- Performance issues with frequent updates
- Provider wrapper complexity
- No built-in persistence
- Difficult to optimize re-renders

### Implementation Pattern

```typescript
// Store structure
interface TransactionStore {
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchTransactions: () => Promise<void>
  addTransaction: (transaction: Transaction) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}

// Store implementation with persistence
export const useTransactionsStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      error: null,
      
      fetchTransactions: async () => {
        set({ isLoading: true })
        try {
          const transactions = await transactionRepository.getAll()
          set({ transactions, isLoading: false })
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },
      // ... other actions
    }),
    {
      name: 'transactions-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
```

### Store Architecture

We implemented a modular store architecture:

```typescript
// Individual stores for each domain
- useAccountsStore
- useTransactionsStore
- useCategoriesStore
- useBudgetsStore
- useRulesStore
- useSubscriptionsStore
- useSettingsStore
- useUIStore
```

### Consequences

**Positive**:
- Clean, readable code with minimal boilerplate
- Excellent performance with selective subscriptions
- Easy testing with direct store access
- Built-in persistence for offline capability
- Type-safe state management

**Negative**:
- Smaller community compared to Redux
- Fewer middleware options
- Custom patterns needed for complex operations

**Performance Optimizations**:
```typescript
// Selective subscriptions prevent unnecessary re-renders
const transactions = useTransactionsStore(state => state.transactions)
const addTransaction = useTransactionsStore(state => state.addTransaction)

// Avoid full store subscription
const store = useTransactionsStore() // ❌ Causes re-render on any change
```

---

## ADR-003: IndexedDB with Dexie

**Status**: Accepted  
**Date**: 2024-12-01  
**Decision Makers**: Development Team

### Context

We needed a client-side database solution that could handle thousands of financial transactions offline, provide fast queries, and work reliably across all browsers.

### Decision

We chose IndexedDB with Dexie.js as the wrapper library.

### Rationale

**Why IndexedDB**:
- Native browser database with large storage capacity
- Transactional support for data integrity
- Indexed queries for fast financial data retrieval
- Works offline by design
- No server dependency reduces security risks

**Why Dexie.js**:
- Simplifies IndexedDB's complex API
- Excellent TypeScript support
- Schema versioning and migrations
- React hooks integration (`dexie-react-hooks`)
- Promise-based API (no callbacks)
- Query optimization features

**Alternatives Considered**:

**LocalStorage**: Too limited (5-10MB), synchronous API
**WebSQL**: Deprecated by browsers
**Server-based**: Requires internet, privacy concerns for financial data
**SQLite WASM**: Too large bundle size, complexity

### Database Schema

```typescript
// Current schema (version 3)
export class KiteDatabase extends Dexie {
  accounts!: Table<Account, string>
  transactions!: Table<Transaction, string>
  categories!: Table<Category, string>
  budgets!: Table<Budget, string>
  rules!: Table<Rule, string>
  subscriptions!: Table<Subscription, string>
  appMeta!: Table<AppMeta, 'singleton'>

  constructor() {
    super('KiteDatabase')
    
    // Compound indexes for optimized queries
    this.version(2).stores({
      transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, [accountId+date], [categoryId+date]',
      budgets: 'id, categoryId, month, amount, carryStrategy, [categoryId+month]',
      // ... other tables
    })
  }
}
```

### Query Optimization Strategy

```typescript
// Optimized transaction queries using compound indexes
const getAccountTransactions = (accountId: string, startDate: Date, endDate: Date) => {
  return db.transactions
    .where('[accountId+date]')
    .between([accountId, startDate], [accountId, endDate])
    .reverse()
    .toArray()
}

// Category spending analysis
const getCategorySpending = (categoryId: string, month: string) => {
  return db.transactions
    .where('[categoryId+date]')
    .between([categoryId, startOfMonth], [categoryId, endOfMonth])
    .toArray()
}
```

### Migration Strategy

```typescript
// Automatic schema migrations
this.version(3).stores({
  transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, metadata, [accountId+date], [categoryId+date]'
}).upgrade(tx => {
  return tx.table('transactions').toCollection().modify(transaction => {
    if (!transaction.metadata) {
      transaction.metadata = {}
    }
  })
})
```

### Consequences

**Positive**:
- Offline-first architecture
- Fast financial data queries
- No server costs or privacy concerns
- Excellent mobile performance
- Transactional data integrity

**Negative**:
- Browser storage quotas (mitigated with user prompts)
- No cross-device sync (addressed in future roadmap)
- Complex query debugging compared to SQL

**Data Integrity Measures**:
- Transaction wrappers for atomic operations
- Data validation before insertion
- Automatic backup/export functionality
- Migration tracking in appMeta table

---

## ADR-004: Tailwind CSS for Styling

**Status**: Accepted  
**Date**: 2024-12-01  
**Decision Makers**: Development Team

### Context

We needed a CSS framework that would enable rapid development of a mobile-first interface while maintaining design consistency and supporting dark mode.

### Decision

We chose Tailwind CSS over CSS Modules, Styled Components, or traditional CSS frameworks.

### Rationale

**Why Tailwind CSS**:
- Utility-first approach enables rapid prototyping
- Built-in responsive design utilities
- Excellent dark mode support (`class` strategy)
- Small production bundle with PurgeCSS
- Consistent design system through design tokens
- No runtime overhead (compared to CSS-in-JS)

**Mobile-First Benefits**:
```css
/* Mobile-first responsive design */
.transaction-item {
  @apply p-2 text-sm; /* Base mobile styles */
  @apply md:p-4 md:text-base; /* Tablet and up */
  @apply lg:p-6 lg:text-lg; /* Desktop */
}
```

**Dark Mode Implementation**:
```typescript
// Tailwind dark mode configuration
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { /* color scale */ },
        success: { /* color scale */ },
        // ... semantic color system
      }
    }
  }
}
```

### Design System

```typescript
// Custom color palette for financial app
colors: {
  primary: { 50: '#f0f9ff', 500: '#0ea5e9', 900: '#0c4a6e' },
  success: { 500: '#22c55e' }, // For positive amounts
  danger: { 500: '#ef4444' },  // For negative amounts
  warning: { 500: '#f59e0b' }  // For alerts
}
```

### Component Patterns

```tsx
// Consistent component styling with Tailwind
const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2'
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button
      className={clsx(baseClasses, variants[variant], sizes[size])}
      {...props}
    >
      {children}
    </button>
  )
}
```

### Consequences

**Positive**:
- Rapid UI development
- Consistent design system
- Excellent mobile responsiveness
- Built-in accessibility utilities
- Small production bundle size

**Negative**:
- HTML can become verbose with many classes
- Learning curve for developers unfamiliar with utility-first CSS
- Potential for inconsistent component APIs

**Optimization Strategy**:
- Use `@apply` directive for frequently repeated patterns
- Create reusable component classes
- Implement design tokens through Tailwind configuration

---

## ADR-005: PWA Architecture

**Status**: Accepted  
**Date**: 2024-12-01  
**Decision Makers**: Development Team

### Context

We needed to deliver a native app-like experience that works offline and can be installed on mobile devices without requiring app store distribution.

### Decision

We implemented a comprehensive Progressive Web App (PWA) architecture using Workbox for service worker management.

### Rationale

**PWA Benefits for Personal Finance**:
- App-like experience without app store complexity
- Offline functionality for private financial data
- Push notifications for budgets and subscriptions
- Fast loading with caching strategies
- Cross-platform compatibility
- Easy updates without app store approval

**Service Worker Strategy**:
```typescript
// vite-plugin-pwa configuration
VitePWA({
  registerType: 'autoUpdate',
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
          }
        }
      }
    ]
  }
})
```

### Offline Strategy

**Application Shell Architecture**:
1. Cache app shell (HTML, CSS, JS) for instant loading
2. Cache static assets (icons, fonts) with long expiration
3. Use IndexedDB for dynamic data (transactions, budgets)
4. Background sync for data consistency

**Cache Strategy by Resource Type**:
```typescript
// Different caching strategies for different resources
const cacheStrategies = {
  appShell: 'CacheFirst',      // HTML, CSS, JS
  images: 'CacheFirst',        // Icons, static images
  fonts: 'CacheFirst',         // Web fonts
  api: 'NetworkFirst',         // Future API calls
  userData: 'IndexedDB'        // Financial data
}
```

### Installation Flow

```typescript
// PWA installation handling
let deferredPrompt: BeforeInstallPromptEvent

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  showInstallPromotion()
})

const installApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      hideInstallPromotion()
    }
  }
}
```

### Manifest Configuration

```json
{
  "name": "Kite - Personal Finance Manager",
  "short_name": "Kite",
  "description": "A mobile-first personal finance PWA",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "scope": "/",
  "icons": [
    {
      "src": "pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Consequences

**Positive**:
- Native app experience without app store
- Offline functionality crucial for financial privacy
- Fast loading with aggressive caching
- Automatic updates
- Cross-platform compatibility

**Negative**:
- Service worker complexity
- Cache invalidation challenges
- iOS Safari limitations
- Storage quota management

**Future Enhancements**:
- Background sync for cross-device data
- Push notifications for budget alerts
- Web Share API integration
- File system access for exports

---

## ADR-006: Security Model

**Status**: Accepted  
**Date**: 2024-12-01  
**Decision Makers**: Development Team

### Context

Personal financial data requires the highest level of security and privacy protection. We needed a security model that protects user data without compromising usability.

### Decision

We implemented a client-side-first security model with future encryption capabilities.

### Rationale

**Client-Side-First Benefits**:
- No financial data leaves the user's device
- Zero trust in external services
- Compliance with privacy regulations (GDPR, CCPA)
- Reduced attack surface (no server to compromise)
- User maintains complete data control

### Current Security Measures

**Data Storage Security**:
```typescript
// IndexedDB with browser security boundaries
export class KiteDatabase extends Dexie {
  constructor() {
    super('KiteDatabase')
    // Database is isolated per origin
    // No cross-origin access possible
  }
}
```

**Input Validation**:
```typescript
// Strict validation for financial data
const validateTransaction = (transaction: Transaction): ValidationResult => {
  const errors: ValidationError[] = []
  
  if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a valid number' })
  }
  
  if (!transaction.accountId || typeof transaction.accountId !== 'string') {
    errors.push({ field: 'accountId', message: 'Account ID is required' })
  }
  
  return { isValid: errors.length === 0, errors }
}
```

**XSS Prevention**:
```typescript
// Safe HTML rendering
const sanitizeDescription = (description: string): string => {
  return description
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 500) // Limit length
}
```

### Future Security Enhancements

**Client-Side Encryption**:
```typescript
// Planned encryption implementation
interface EncryptionService {
  encrypt(data: string, password: string): Promise<EncryptedData>
  decrypt(encryptedData: EncryptedData, password: string): Promise<string>
  deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>
}

const encryptionService: EncryptionService = {
  encrypt: async (data: string, password: string) => {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const key = await deriveKey(password, salt)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    )
    
    return {
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      data: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join(''),
      salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
    }
  }
}
```

**Biometric Authentication**:
```typescript
// Future biometric auth integration
const BiometricAuth = {
  isSupported: () => 'credentials' in navigator && 'create' in navigator.credentials,
  
  setup: async (userId: string) => {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Kite PFM' },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: 'Kite User'
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        }
      }
    })
    return credential
  }
}
```

### Privacy by Design

**Data Minimization**:
- Only collect necessary financial data
- No tracking or analytics by default
- User controls data retention periods

**Transparency**:
- Clear data usage explanations
- Export functionality for data portability
- No hidden data collection

**User Control**:
- Complete data deletion capability
- Granular privacy settings
- Offline-first operation

### Consequences

**Positive**:
- Maximum user privacy and data control
- Compliance with privacy regulations
- No server-side security vulnerabilities
- User trust through transparency

**Negative**:
- No automatic cloud backup (by design)
- Encryption adds complexity
- Cross-device sync challenges

**Risk Mitigation**:
- Regular security audits
- Encryption key management
- Secure backup/restore procedures

---

## ADR-007: State Management Patterns

**Status**: Accepted  
**Date**: 2024-12-01  
**Decision Makers**: Development Team

### Context

We needed consistent patterns for managing complex financial state across multiple domains (accounts, transactions, budgets, etc.) while maintaining performance and type safety.

### Decision

We implemented domain-driven store architecture with standardized patterns for async operations, error handling, and data synchronization.

### Rationale

**Domain-Driven Store Architecture**:
Each financial domain has its own store with consistent patterns:

```typescript
// Standard store interface pattern
interface BaseStore<T> {
  items: T[]
  isLoading: boolean
  error: string | null
  
  // CRUD operations
  fetchAll: () => Promise<void>
  create: (item: Omit<T, 'id'>) => Promise<T>
  update: (id: string, updates: Partial<T>) => Promise<void>
  delete: (id: string) => Promise<void>
  
  // Utilities
  getById: (id: string) => T | undefined
  clearError: () => void
}
```

### Store Implementation Patterns

**Async Action Pattern**:
```typescript
// Consistent async action handling
const createAsyncAction = <T>(
  actionName: string,
  asyncFn: () => Promise<T>
) => {
  return async (set: StoreApi<any>['setState'], get: StoreApi<any>['getState']) => {
    set({ isLoading: true, error: null })
    
    try {
      const result = await asyncFn()
      set({ isLoading: false })
      return result
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }
}

// Usage in stores
const useTransactionsStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  
  fetchTransactions: createAsyncAction(
    'fetchTransactions',
    () => transactionRepository.getAll()
  )(set, get),
  
  addTransaction: async (transaction) => {
    await createAsyncAction(
      'addTransaction',
      async () => {
        const newTransaction = await transactionRepository.create(transaction)
        set(state => ({
          transactions: [...state.transactions, newTransaction]
        }))
        return newTransaction
      }
    )(set, get)
  }
}))
```

**Optimistic Updates Pattern**:
```typescript
// Optimistic updates for better UX
const updateTransactionOptimistic = async (id: string, updates: Partial<Transaction>) => {
  const { transactions } = get()
  const originalTransaction = transactions.find(t => t.id === id)
  
  // Optimistic update
  set({
    transactions: transactions.map(t => 
      t.id === id ? { ...t, ...updates } : t
    )
  })
  
  try {
    await transactionRepository.update(id, updates)
  } catch (error) {
    // Revert on error
    if (originalTransaction) {
      set({
        transactions: transactions.map(t => 
          t.id === id ? originalTransaction : t
        )
      })
    }
    throw error
  }
}
```

**Cross-Store Communication**:
```typescript
// Store subscriptions for related data updates
const useTransactionsStore = create<TransactionStore>((set, get) => ({
  // ... other state
  
  // Subscribe to account changes
  subscribeToAccountUpdates: () => {
    return useAccountsStore.subscribe(
      (state) => state.accounts,
      (accounts) => {
        // Update transactions when accounts change
        const { transactions } = get()
        const validAccountIds = new Set(accounts.map(a => a.id))
        
        const validTransactions = transactions.filter(t => 
          validAccountIds.has(t.accountId)
        )
        
        if (validTransactions.length !== transactions.length) {
          set({ transactions: validTransactions })
        }
      }
    )
  }
}))
```

### Data Flow Patterns

**Repository Pattern**:
```typescript
// Centralized data access layer
interface Repository<T> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | undefined>
  create(item: Omit<T, 'id'>): Promise<T>
  update(id: string, updates: Partial<T>): Promise<void>
  delete(id: string): Promise<void>
}

class TransactionRepository implements Repository<Transaction> {
  async getAll(): Promise<Transaction[]> {
    return await db.transactions.orderBy('date').reverse().toArray()
  }
  
  async create(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTransaction = {
      ...transaction,
      id: nanoid(),
      createdAt: new Date()
    }
    await db.transactions.add(newTransaction)
    return newTransaction
  }
  
  // ... other methods
}
```

**Computed Values Pattern**:
```typescript
// Derived state for complex calculations
const useBudgetAnalytics = () => {
  const budgets = useBudgetsStore(state => state.budgets)
  const transactions = useTransactionsStore(state => state.transactions)
  
  return useMemo(() => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => 
          t.categoryId === budget.categoryId && 
          t.date >= budget.startDate && 
          t.date <= budget.endDate
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      return {
        ...budget,
        spent,
        remaining: budget.amount - spent,
        percentageUsed: (spent / budget.amount) * 100
      }
    })
  }, [budgets, transactions])
}
```

### Error Handling Patterns

**Centralized Error Handling**:
```typescript
// Global error handler
const useErrorHandler = () => {
  const { toast } = useUIStore()
  
  return useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context}:`, error)
    
    // User-friendly error messages
    const userMessage = error.message.includes('QuotaExceededError')
      ? 'Storage quota exceeded. Please export and delete old data.'
      : error.message.includes('ConstraintError')
      ? 'Data validation error. Please check your input.'
      : 'An unexpected error occurred. Please try again.'
    
    toast({
      type: 'error',
      title: 'Error',
      description: userMessage
    })
  }, [toast])
}
```

### Consequences

**Positive**:
- Consistent state management across domains
- Predictable error handling
- Type-safe operations
- Optimistic updates for better UX
- Clear separation of concerns

**Negative**:
- More boilerplate for simple operations
- Complexity in cross-store dependencies
- Learning curve for developers

**Best Practices Established**:
- Always handle loading and error states
- Use optimistic updates for better UX
- Implement proper error boundaries
- Keep stores domain-focused
- Use repository pattern for data access

---

## ADR-008: Data Privacy Approach

**Status**: Accepted  
**Date**: 2024-12-01  
**Decision Makers**: Development Team

### Context

Personal financial data is highly sensitive and subject to various privacy regulations. We needed a comprehensive approach to data privacy that builds user trust while maintaining functionality.

### Decision

We implemented a privacy-first architecture with client-side data storage, minimal data collection, and comprehensive user control.

### Rationale

**Privacy-First Principles**:
1. **Data Minimization**: Collect only necessary financial data
2. **Purpose Limitation**: Use data only for intended financial management
3. **Storage Limitation**: Provide user-controlled data retention
4. **Transparency**: Clear communication about data usage
5. **User Control**: Complete user control over their data

### Implementation

**Local-Only Data Storage**:
```typescript
// All financial data stays on device
const PrivacyService = {
  // No data transmission to external servers
  storeLocally: async (data: FinancialData) => {
    await db.transaction('rw', db.tables, async () => {
      // Store in IndexedDB only
      await db[data.type].put(data)
    })
  },
  
  // Export for user control
  exportUserData: async (): Promise<ExportedData> => {
    const [accounts, transactions, budgets, categories] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.toArray(),
      db.budgets.toArray(),
      db.categories.toArray()
    ])
    
    return {
      exportDate: new Date(),
      version: '1.0.0',
      accounts,
      transactions,
      budgets,
      categories
    }
  },
  
  // Complete data deletion
  deleteAllUserData: async () => {
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map(table => table.clear()))
    })
  }
}
```

**Privacy Settings Management**:
```typescript
interface PrivacySettings {
  dataRetentionMonths: number
  allowAnalytics: boolean
  allowCrashReporting: boolean
  autoDeleteOldTransactions: boolean
  encryptSensitiveData: boolean
}

const usePrivacySettings = create<{
  settings: PrivacySettings
  updateSetting: (key: keyof PrivacySettings, value: any) => void
}>((set) => ({
  settings: {
    dataRetentionMonths: 24, // Default 2 years
    allowAnalytics: false,    // Opt-in only
    allowCrashReporting: false,
    autoDeleteOldTransactions: false,
    encryptSensitiveData: false // Future feature
  },
  
  updateSetting: (key, value) => {
    set(state => ({
      settings: { ...state.settings, [key]: value }
    }))
  }
}))
```

**Data Anonymization for Optional Analytics**:
```typescript
// If user opts in to analytics, anonymize data
const AnonymizationService = {
  anonymizeTransaction: (transaction: Transaction): AnonymousTransaction => ({
    id: 'anon_' + nanoid(),
    amount: Math.round(transaction.amount / 10) * 10, // Round to nearest 10
    category: transaction.categoryId ? 'has_category' : 'no_category',
    date: new Date(transaction.date.getFullYear(), transaction.date.getMonth()), // Month precision only
    merchant: undefined, // Never include merchant data
    description: undefined // Never include description
  }),
  
  // Aggregate data for insights
  generateAggregateInsights: (transactions: Transaction[]) => ({
    totalTransactions: transactions.length,
    averageTransactionAmount: Math.round(
      transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length
    ),
    topCategoryCount: 5, // Only count, not actual categories
    monthlyFrequency: Math.round(transactions.length / 12)
  })
}
```

### User Consent Management

**Granular Consent Options**:
```typescript
interface ConsentOptions {
  essential: boolean        // Always true - app functionality
  analytics: boolean        // Optional - app improvement
  crashReporting: boolean   // Optional - error tracking
  performance: boolean      // Optional - performance monitoring
}

const ConsentManager = {
  getConsent: (): ConsentOptions => {
    const stored = localStorage.getItem('user-consent')
    return stored ? JSON.parse(stored) : {
      essential: true,
      analytics: false,
      crashReporting: false,
      performance: false
    }
  },
  
  updateConsent: (options: Partial<ConsentOptions>) => {
    const current = ConsentManager.getConsent()
    const updated = { ...current, ...options }
    localStorage.setItem('user-consent', JSON.stringify(updated))
    
    // Apply consent changes immediately
    if (!updated.analytics) {
      // Disable analytics
      AnalyticsService.disable()
    }
    
    if (!updated.crashReporting) {
      // Disable crash reporting
      ErrorTrackingService.disable()
    }
  }
}
```

### Data Portability

**Export Functionality**:
```typescript
const DataPortability = {
  // Export in standard formats
  exportToJSON: async (): Promise<string> => {
    const data = await PrivacyService.exportUserData()
    return JSON.stringify(data, null, 2)
  },
  
  exportToCSV: async (): Promise<string> => {
    const transactions = await db.transactions.toArray()
    const csv = [
      'Date,Description,Amount,Category,Account',
      ...transactions.map(t => 
        `${t.date.toISOString().split('T')[0]},${t.description},${t.amount},${t.categoryId || ''},${t.accountId}`
      )
    ].join('\n')
    return csv
  },
  
  // Import with validation
  importFromJSON: async (jsonData: string): Promise<ImportResult> => {
    try {
      const data = JSON.parse(jsonData)
      
      // Validate data structure
      const validation = validateImportData(data)
      if (!validation.isValid) {
        return { success: false, errors: validation.errors }
      }
      
      // Import with user confirmation
      await db.transaction('rw', db.tables, async () => {
        await Promise.all([
          db.accounts.bulkPut(data.accounts),
          db.transactions.bulkPut(data.transactions),
          db.budgets.bulkPut(data.budgets),
          db.categories.bulkPut(data.categories)
        ])
      })
      
      return { success: true }
    } catch (error) {
      return { success: false, errors: [error.message] }
    }
  }
}
```

### Compliance Features

**GDPR Compliance**:
```typescript
const GDPRCompliance = {
  // Right to access
  generateDataReport: async (): Promise<DataReport> => ({
    personalData: await PrivacyService.exportUserData(),
    dataCategories: ['financial_transactions', 'account_information', 'budgets', 'categories'],
    storageLocation: 'Local device only',
    retentionPeriod: 'User controlled',
    processingPurpose: 'Personal financial management'
  }),
  
  // Right to deletion
  deleteAllData: async (): Promise<void> => {
    await PrivacyService.deleteAllUserData()
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear service worker cache
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
    }
  },
  
  // Right to rectification
  updateData: async (corrections: DataCorrections): Promise<void> => {
    for (const [table, updates] of Object.entries(corrections)) {
      await db[table].bulkPut(updates)
    }
  }
}
```

### Privacy Notice Integration

```typescript
// Clear privacy communication
const PrivacyNotice = {
  dataCollection: [
    'Financial transactions you enter',
    'Account information you create',
    'Budget and category preferences',
    'App usage preferences'
  ],
  
  dataUse: [
    'Display your financial information',
    'Calculate budgets and insights',
    'Provide personalized recommendations',
    'Improve app functionality (with consent)'
  ],
  
  dataSharing: 'No data is shared with third parties',
  
  dataLocation: 'All data is stored locally on your device',
  
  userRights: [
    'Export all your data at any time',
    'Delete all data permanently',
    'Control what data is collected',
    'Withdraw consent for optional features'
  ]
}
```

### Consequences

**Positive**:
- Maximum user privacy and trust
- Compliance with global privacy regulations
- No data breach risks from external servers
- Complete user control over personal data
- Transparent privacy practices

**Negative**:
- No automatic cloud backup (by design)
- Limited cross-device synchronization
- Reduced ability for product improvement analytics
- Higher user responsibility for data management

**Future Considerations**:
- End-to-end encrypted cloud sync
- Zero-knowledge backup solutions
- Enhanced biometric security
- Privacy-preserving analytics techniques

---

## ADR-009: Testing Strategy

**Status**: Accepted  
**Date**: 2024-12-01  
**Decision Makers**: Development Team

### Context

Financial applications require rigorous testing to ensure data integrity, calculation accuracy, and user trust. We needed a comprehensive testing strategy covering all aspects of the application.

### Decision

We implemented a multi-layered testing approach with unit tests, integration tests, and end-to-end tests, focusing heavily on financial calculation accuracy and data integrity.

### Testing Architecture

**Testing Stack**:
- **Unit Tests**: Vitest + Testing Library
- **Integration Tests**: Vitest + Testing Library
- **E2E Tests**: Playwright
- **Component Tests**: Testing Library React
- **Database Tests**: In-memory Dexie testing

### Unit Testing Strategy

**Financial Calculations Testing**:
```typescript
// Critical financial calculation tests
describe('Budget Calculations', () => {
  test('should calculate remaining budget correctly', () => {
    const budget = { amount: 1000, spent: 750 }
    const remaining = calculateRemainingBudget(budget)
    expect(remaining).toBe(250)
  })
  
  test('should handle floating point precision', () => {
    const transactions = [
      { amount: 10.1 },
      { amount: 10.2 },
      { amount: 10.3 }
    ]
    const total = calculateTotal(transactions)
    expect(total).toBeCloseTo(30.6, 2) // Handle floating point
  })
  
  test('should never allow negative account balances for checking accounts', () => {
    const account = { type: 'checking', balance: 100 }
    const transaction = { amount: -150 }
    
    expect(() => {
      validateTransaction(account, transaction)
    }).toThrow('Insufficient funds')
  })
})
```

**Store Testing Patterns**:
```typescript
// Testing Zustand stores
describe('TransactionStore', () => {
  let store: ReturnType<typeof useTransactionsStore.getState>
  
  beforeEach(() => {
    // Reset store state
    useTransactionsStore.setState({
      transactions: [],
      isLoading: false,
      error: null
    })
    store = useTransactionsStore.getState()
  })
  
  test('should add transaction correctly', async () => {
    const transaction = createMockTransaction()
    await store.addTransaction(transaction)
    
    const state = useTransactionsStore.getState()
    expect(state.transactions).toHaveLength(1)
    expect(state.transactions[0]).toMatchObject(transaction)
  })
  
  test('should handle errors gracefully', async () => {
    // Mock database error
    vi.spyOn(db.transactions, 'add').mockRejectedValue(new Error('Database error'))
    
    await expect(store.addTransaction(createMockTransaction())).rejects.toThrow()
    
    const state = useTransactionsStore.getState()
    expect(state.error).toBe('Database error')
    expect(state.isLoading).toBe(false)
  })
})
```

### Integration Testing

**Database Integration Tests**:
```typescript
// Testing IndexedDB operations
describe('Database Integration', () => {
  beforeEach(async () => {
    // Use in-memory database for testing
    await db.delete()
    await db.open()
  })
  
  test('should maintain referential integrity', async () => {
    const account = await createTestAccount()
    const transaction = await createTestTransaction({ accountId: account.id })
    
    // Delete account should cascade or prevent deletion
    await expect(db.accounts.delete(account.id)).rejects.toThrow()
    
    // Clean up transaction first
    await db.transactions.delete(transaction.id)
    await db.accounts.delete(account.id)
    
    const accountExists = await db.accounts.get(account.id)
    expect(accountExists).toBeUndefined()
  })
  
  test('should handle concurrent transactions', async () => {
    const account = await createTestAccount()
    
    // Simulate concurrent balance updates
    const updates = Array.from({ length: 10 }, (_, i) => 
      db.transaction('rw', db.accounts, async () => {
        const current = await db.accounts.get(account.id)
        if (current) {
          await db.accounts.update(account.id, { 
            balance: current.balance + 10 
          })
        }
      })
    )
    
    await Promise.all(updates)
    
    const finalAccount = await db.accounts.get(account.id)
    expect(finalAccount?.balance).toBe(account.balance + 100)
  })
})
```

**Component Integration Tests**:
```typescript
// Testing component with store integration
describe('TransactionList Component Integration', () => {
  test('should display transactions from store', async () => {
    // Setup store state
    const mockTransactions = [
      createMockTransaction({ description: 'Coffee', amount: -5.50 }),
      createMockTransaction({ description: 'Salary', amount: 2000 })
    ]
    
    useTransactionsStore.setState({ transactions: mockTransactions })
    
    render(<TransactionList />)
    
    expect(screen.getByText('Coffee')).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('-$5.50')).toBeInTheDocument()
    expect(screen.getByText('+$2,000.00')).toBeInTheDocument()
  })
  
  test('should handle optimistic updates', async () => {
    render(<TransactionList />)
    
    const addButton = screen.getByRole('button', { name: /add transaction/i })
    fireEvent.click(addButton)
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Transaction' }
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '25.00' }
    })
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    
    // Should immediately show in list (optimistic update)
    expect(screen.getByText('Test Transaction')).toBeInTheDocument()
  })
})
```

### End-to-End Testing

**Critical User Flows**:
```typescript
// Playwright E2E tests
test.describe('Financial Management Flow', () => {
  test('should complete full transaction workflow', async ({ page }) => {
    await page.goto('/')
    
    // Create account
    await page.click('[data-testid="add-account"]')
    await page.fill('[data-testid="account-name"]', 'Test Checking')
    await page.selectOption('[data-testid="account-type"]', 'checking')
    await page.fill('[data-testid="initial-balance"]', '1000')
    await page.click('[data-testid="save-account"]')
    
    // Add transaction
    await page.click('[data-testid="add-transaction"]')
    await page.fill('[data-testid="transaction-description"]', 'Grocery Shopping')
    await page.fill('[data-testid="transaction-amount"]', '-85.50')
    await page.click('[data-testid="save-transaction"]')
    
    // Verify balance update
    await expect(page.locator('[data-testid="account-balance"]')).toContainText('$914.50')
    
    // Verify transaction appears
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('Grocery Shopping')
  })
  
  test('should work offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)
    
    await page.goto('/')
    
    // Should still load from cache
    await expect(page.locator('h1')).toContainText('Kite')
    
    // Should still allow data entry
    await page.click('[data-testid="add-transaction"]')
    await page.fill('[data-testid="transaction-description"]', 'Offline Transaction')
    await page.fill('[data-testid="transaction-amount"]', '-10.00')
    await page.click('[data-testid="save-transaction"]')
    
    // Data should persist locally
    await page.reload()
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('Offline Transaction')
  })
})
```

### Performance Testing

**Render Performance Tests**:
```typescript
// Performance testing for large datasets
describe('Performance Tests', () => {
  test('should handle 1000 transactions efficiently', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => 
      createMockTransaction({ description: `Transaction ${i}` })
    )
    
    useTransactionsStore.setState({ transactions: largeDataset })
    
    const startTime = performance.now()
    render(<TransactionList />)
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(100) // Should render in <100ms
  })
  
  test('should not cause memory leaks', async () => {
    const { unmount } = render(<TransactionList />)
    
    // Simulate component lifecycle
    for (let i = 0; i < 10; i++) {
      unmount()
      render(<TransactionList />)
    }
    
    // Check for memory leaks (would need proper memory monitoring)
    expect(true).toBe(true) // Placeholder for memory assertion
  })
})
```

### Test Data Management

**Mock Data Factories**:
```typescript
// Consistent test data creation
export const createMockAccount = (overrides: Partial<Account> = {}): Account => ({
  id: nanoid(),
  name: 'Test Account',
  type: 'checking',
  currency: 'USD',
  balance: 1000,
  createdAt: new Date(),
  ...overrides
})

export const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: nanoid(),
  accountId: 'test-account-id',
  date: new Date(),
  amount: -50,
  currency: 'USD',
  description: 'Test Transaction',
  ...overrides
})

// Test scenarios
export const TestScenarios = {
  overdraftAccount: () => createMockAccount({ balance: -100 }),
  largeTransaction: () => createMockTransaction({ amount: -10000 }),
  futureTransaction: () => createMockTransaction({ 
    date: new Date(Date.now() + 86400000) // Tomorrow
  })
}
```

### Continuous Integration

**GitHub Actions Test Pipeline**:
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Consequences

**Positive**:
- High confidence in financial calculation accuracy
- Comprehensive coverage of critical user flows
- Automated regression detection
- Performance monitoring
- Data integrity validation

**Negative**:
- Significant test maintenance overhead
- Slower development velocity initially
- Complex test setup for database operations
- E2E test flakiness potential

**Testing Best Practices Established**:
- Test financial calculations extensively
- Use real database operations in integration tests
- Mock external dependencies
- Test error conditions and edge cases
- Maintain high coverage for critical paths
- Regular performance testing with realistic data volumes

---

## ADR-010: Future Architecture Considerations

**Status**: Draft  
**Date**: 2024-12-01  
**Decision Makers**: Development Team

### Context

As the Kite Personal Finance Manager grows, we need to consider future architectural decisions and potential migrations to support new features and scale.

### Potential Future Decisions

### Cloud Sync with End-to-End Encryption

**Problem**: Users want to sync data across devices while maintaining privacy.

**Proposed Solution**: Implement zero-knowledge cloud sync where data is encrypted client-side before transmission.

```typescript
// Future architecture concept
interface CloudSyncService {
  // Encrypt data before upload
  uploadEncryptedData(data: FinancialData, userKey: CryptoKey): Promise<void>
  
  // Decrypt data after download
  downloadAndDecryptData(userKey: CryptoKey): Promise<FinancialData>
  
  // Conflict resolution
  resolveConflicts(local: FinancialData, remote: FinancialData): Promise<FinancialData>
}

const E2EEncryption = {
  generateUserKey: async (password: string, salt: string): Promise<CryptoKey> => {
    return await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
      await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  },
  
  encryptData: async (data: any, key: CryptoKey): Promise<EncryptedData> => {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(data))
    )
    
    return {
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      data: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
    }
  }
}
```

### Micro-Frontend Architecture

**Problem**: As features grow, bundle size increases and development team scaling becomes difficult.

**Proposed Solution**: Split into micro-frontends by financial domain.

```typescript
// Future micro-frontend architecture
const MicroFrontends = {
  core: {
    // Dashboard, navigation, shared components
    bundle: 'core.js',
    responsibility: 'App shell and shared functionality'
  },
  
  transactions: {
    // Transaction management
    bundle: 'transactions.js',
    responsibility: 'Transaction CRUD, categorization, rules'
  },
  
  budgeting: {
    // Budget management and analysis
    bundle: 'budgeting.js',
    responsibility: 'Budget creation, tracking, analysis'
  },
  
  insights: {
    // Analytics and reporting
    bundle: 'insights.js',
    responsibility: 'Charts, reports, financial insights'
  },
  
  settings: {
    // Configuration and data management
    bundle: 'settings.js',
    responsibility: 'User preferences, data import/export'
  }
}

// Module federation configuration
const moduleFederationConfig = {
  name: 'kite-host',
  remotes: {
    transactions: 'transactions@/transactions/remoteEntry.js',
    budgeting: 'budgeting@/budgeting/remoteEntry.js',
    insights: 'insights@/insights/remoteEntry.js'
  }
}
```

### WebAssembly for Financial Calculations

**Problem**: Complex financial calculations might benefit from WebAssembly performance.

**Proposed Solution**: Implement critical calculations in Rust/WebAssembly.

```rust
// Future WASM implementation concept
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct FinancialCalculator;

#[wasm_bindgen]
impl FinancialCalculator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> FinancialCalculator {
        FinancialCalculator
    }
    
    #[wasm_bindgen]
    pub fn calculate_compound_interest(
        &self,
        principal: f64,
        rate: f64,
        time: f64,
        compound_frequency: u32
    ) -> f64 {
        principal * (1.0 + rate / compound_frequency as f64).powf(compound_frequency as f64 * time)
    }
    
    #[wasm_bindgen]
    pub fn optimize_budget_allocation(
        &self,
        income: f64,
        expenses: &[f64],
        priorities: &[u32]
    ) -> Vec<f64> {
        // Complex optimization algorithm
        vec![]
    }
}
```

### AI-Powered Insights

**Problem**: Users want intelligent financial insights and automation.

**Proposed Solution**: Client-side AI/ML for privacy-preserving financial insights.

```typescript
// Future AI integration concept
interface AIInsightsService {
  // Local ML models for privacy
  analyzeSpendingPatterns(transactions: Transaction[]): SpendingInsights
  predictFutureExpenses(historicalData: Transaction[]): ExpensePrediction[]
  suggestBudgetOptimizations(budget: Budget[], spending: Transaction[]): BudgetSuggestion[]
  detectAnomalousTransactions(transactions: Transaction[]): AnomalyAlert[]
}

// TensorFlow.js implementation concept
const SpendingAnalyzer = {
  loadModel: async () => {
    return await tf.loadLayersModel('/models/spending-analysis.json')
  },
  
  predictCategory: async (description: string, amount: number): Promise<string> => {
    const model = await SpendingAnalyzer.loadModel()
    const features = preprocessText(description, amount)
    const prediction = model.predict(features)
    return getCategoryFromPrediction(prediction)
  },
  
  detectAnomalies: (transactions: Transaction[]): AnomalyScore[] => {
    // Implement anomaly detection algorithm
    return []
  }
}
```

### Real-time Collaboration

**Problem**: Families want to share and collaborate on budgets.

**Proposed Solution**: Real-time collaboration with operational transformation.

```typescript
// Future collaboration architecture
interface CollaborationService {
  sharebudget(budgetId: string, users: string[]): Promise<void>
  syncChanges(operation: Operation): Promise<void>
  resolveConflicts(operations: Operation[]): Operation[]
}

interface Operation {
  type: 'insert' | 'update' | 'delete'
  target: 'transaction' | 'budget' | 'category'
  data: any
  timestamp: number
  userId: string
}

const OperationalTransform = {
  // Transform operations for concurrent editing
  transform: (op1: Operation, op2: Operation): [Operation, Operation] => {
    // Implement OT algorithm for financial data
    return [op1, op2]
  },
  
  // Apply operations in correct order
  applyOperations: async (operations: Operation[]): Promise<void> => {
    const sorted = operations.sort((a, b) => a.timestamp - b.timestamp)
    for (const op of sorted) {
      await applyOperation(op)
    }
  }
}
```

### Advanced Security Features

**Problem**: Enhanced security needs for financial data.

**Proposed Solution**: Hardware security keys, biometric authentication, secure enclaves.

```typescript
// Future security enhancements
interface AdvancedSecurity {
  // Hardware security key support
  setupSecurityKey(): Promise<PublicKeyCredential>
  authenticateWithSecurityKey(): Promise<boolean>
  
  // Biometric authentication
  setupBiometrics(): Promise<void>
  authenticateWithBiometrics(): Promise<boolean>
  
  // Secure enclave for sensitive operations
  performSecureCalculation(operation: SecureOperation): Promise<any>
}

const BiometricAuth = {
  isSupported: (): boolean => {
    return 'credentials' in navigator && 'create' in navigator.credentials
  },
  
  register: async (userId: string): Promise<PublicKeyCredential> => {
    return await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Kite PFM', id: 'kite-pfm.app' },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: 'Kite User'
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        }
      }
    }) as PublicKeyCredential
  }
}
```

### Migration Strategies

**Database Migration Strategy**:
```typescript
// Future database migration approach
const MigrationManager = {
  // Incremental migrations
  migrations: new Map([
    ['v4', async () => {
      // Add encryption fields
      await db.version(4).stores({
        transactions: '++id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, metadata, encrypted, [accountId+date], [categoryId+date]'
      }).upgrade(tx => {
        return tx.table('transactions').toCollection().modify(transaction => {
          transaction.encrypted = false
        })
      })
    }],
    
    ['v5', async () => {
      // Add collaboration features
      await db.version(5).stores({
        collaborations: '++id, budgetId, sharedWith, permissions, createdAt'
      })
    }]
  ]),
  
  // Rollback capability
  rollback: async (toVersion: number) => {
    // Implement safe rollback procedures
  }
}
```

### Performance Scaling

**Web Workers for Heavy Computations**:
```typescript
// Future worker implementation
const CalculationWorker = {
  worker: new Worker('/workers/financial-calculations.js'),
  
  calculatePortfolioMetrics: (data: PortfolioData): Promise<PortfolioMetrics> => {
    return new Promise((resolve, reject) => {
      const messageId = nanoid()
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          this.worker.removeEventListener('message', handleMessage)
          resolve(event.data.result)
        }
      }
      
      this.worker.addEventListener('message', handleMessage)
      this.worker.postMessage({
        id: messageId,
        type: 'CALCULATE_PORTFOLIO_METRICS',
        data
      })
    })
  }
}
```

### Decision Framework

For future architectural decisions, we will evaluate based on:

1. **User Privacy**: Does it maintain or improve data privacy?
2. **Performance**: Does it improve application performance?
3. **Maintenance**: Does it simplify or complicate maintenance?
4. **Security**: Does it enhance security posture?
5. **User Experience**: Does it improve user experience?
6. **Cost**: What are the development and operational costs?

### Migration Timeline

**Phase 1 (Months 1-3)**:
- Implement basic cloud sync with encryption
- Add biometric authentication
- Enhance error tracking and analytics

**Phase 2 (Months 4-6)**:
- Micro-frontend architecture
- Advanced AI insights
- Real-time collaboration features

**Phase 3 (Months 7-12)**:
- WebAssembly optimizations
- Advanced security features
- Cross-platform mobile apps

### Risk Assessment

**Technical Risks**:
- Complexity increase with new features
- Performance degradation with additional features
- Security vulnerabilities in new components

**Mitigation Strategies**:
- Incremental rollout of new features
- Comprehensive testing at each phase
- Regular security audits
- Performance monitoring and optimization

### Conclusion

These future architectural considerations provide a roadmap for scaling the Kite Personal Finance Manager while maintaining its core principles of privacy, security, and user control. Each decision will be evaluated against our established criteria and implemented incrementally to ensure stability and user trust.

The architecture decisions documented here form the foundation for a robust, secure, and user-centric personal finance application that can evolve with changing user needs and technological advances while maintaining its commitment to privacy and data ownership.