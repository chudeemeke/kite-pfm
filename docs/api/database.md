# Database API Reference

This document covers the Dexie database operations, IndexedDB schema, migration strategies, and performance considerations for the Kite application.

## Database Architecture

Kite uses Dexie as a wrapper around IndexedDB for client-side data storage, providing a local-first architecture with the following benefits:

- **Offline Support**: Full functionality without internet connection
- **Fast Performance**: Local data access with proper indexing
- **ACID Transactions**: Reliable data consistency
- **Schema Evolution**: Automatic migrations with version control
- **Type Safety**: TypeScript integration with strong typing

## Schema Overview

The database consists of the following main tables:

```typescript
interface KiteSchema {
  accounts: Account[]
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  rules: Rule[]
  subscriptions: Subscription[]
  appMeta: AppMeta[]
}
```

### Current Schema (Version 3)

```typescript
// Version 3 - Current
this.version(3).stores({
  accounts: 'id, name, type, currency, balance, createdAt, archivedAt',
  transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, metadata, [accountId+date], [categoryId+date]',
  categories: 'id, name, icon, color, parentId',
  budgets: 'id, categoryId, month, amount, carryStrategy, [categoryId+month]',
  rules: 'id, name, enabled, priority, stopProcessing',
  subscriptions: 'id, name, cadence, amount, currency, nextDueDate, accountId, categoryId',
  appMeta: 'id, schemaVersion, appVersion, createdAt, updatedAt'
})
```

## Table Schemas

### Accounts Table

Stores financial account information.

```typescript
interface Account {
  id: string              // Primary key
  name: string           // Account display name
  type: AccountType      // Account classification
  currency: string       // Currency code (ISO 4217)
  balance: number        // Current balance
  createdAt: Date       // Creation timestamp
  archivedAt?: Date     // Soft delete timestamp
  isDefault?: boolean   // Default account flag
}

type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'loan' | 'other'
```

**Indexes:**
- Primary: `id`
- Secondary: `name`, `type`, `currency`, `balance`, `createdAt`, `archivedAt`

**Relationships:**
- One-to-many with `transactions` (via `accountId`)
- One-to-many with `subscriptions` (via `accountId`)

### Transactions Table

Stores all financial transactions.

```typescript
interface Transaction {
  id: string              // Primary key
  accountId: string       // Foreign key to accounts
  date: Date             // Transaction date
  amount: number         // Transaction amount (negative = expense)
  currency: string       // Currency code
  description: string    // Transaction description
  merchant?: string      // Merchant name
  categoryId?: string    // Foreign key to categories
  isSubscription?: boolean // Subscription flag
  metadata?: Record<string, unknown> // Additional data
}
```

**Indexes:**
- Primary: `id`
- Secondary: `accountId`, `date`, `amount`, `currency`, `description`, `merchant`, `categoryId`, `isSubscription`, `metadata`
- Compound: `[accountId+date]`, `[categoryId+date]` for optimized queries

**Relationships:**
- Many-to-one with `accounts` (via `accountId`)
- Many-to-one with `categories` (via `categoryId`)

### Categories Table

Manages transaction categories with hierarchical support.

```typescript
interface Category {
  id: string        // Primary key
  name: string      // Category name
  icon: string      // Emoji or icon identifier
  color: string     // Hex color code
  parentId?: string // Parent category for hierarchy
}
```

**Indexes:**
- Primary: `id`
- Secondary: `name`, `icon`, `color`, `parentId`

**Relationships:**
- One-to-many with `transactions` (via `categoryId`)
- One-to-many with `budgets` (via `categoryId`)
- Self-referencing hierarchy (via `parentId`)

### Budgets Table

Tracks budget allocations by category and month.

```typescript
interface Budget {
  id: string                    // Primary key
  categoryId: string           // Foreign key to categories
  month: string               // Budget month (YYYY-MM format)
  amount: number              // Budget amount
  carryStrategy: CarryStrategy // Carryover behavior
  notes?: string              // Optional notes
}

type CarryStrategy = 'carryNone' | 'carryUnspent' | 'carryOverspend'
```

**Indexes:**
- Primary: `id`
- Secondary: `categoryId`, `month`, `amount`, `carryStrategy`
- Compound: `[categoryId+month]` for unique budget per category/month

**Relationships:**
- Many-to-one with `categories` (via `categoryId`)

### Rules Table

Automation rules for transaction categorization.

```typescript
interface Rule {
  id: string                  // Primary key
  name: string               // Rule display name
  enabled: boolean           // Rule active state
  priority: number           // Execution order (lower = higher priority)
  conditions: RuleCondition[] // Match conditions
  actions: RuleAction[]      // Actions to perform
  stopProcessing: boolean    // Stop rule chain after match
}

interface RuleCondition {
  field: 'merchant' | 'description' | 'amount'
  op: 'eq' | 'contains' | 'regex' | 'range'
  value: string | number | { min: number; max: number }
}

interface RuleAction {
  setCategoryId?: string
  setIsSubscription?: boolean
  setNotesAppend?: string
}
```

**Indexes:**
- Primary: `id`
- Secondary: `name`, `enabled`, `priority`, `stopProcessing`

**Processing Order:**
Rules are processed by `priority` (ascending) with `stopProcessing` controlling continuation.

### Subscriptions Table

Tracks recurring payments and subscriptions.

```typescript
interface Subscription {
  id: string           // Primary key
  name: string         // Subscription name
  cadence: Cadence     // Payment frequency
  amount: number       // Payment amount
  currency: string     // Currency code
  nextDueDate: Date    // Next payment date
  accountId?: string   // Associated account
  categoryId?: string  // Associated category
  notes?: string       // Optional notes
}

type Cadence = 'monthly' | 'yearly' | 'custom'
```

**Indexes:**
- Primary: `id`
- Secondary: `name`, `cadence`, `amount`, `currency`, `nextDueDate`, `accountId`, `categoryId`

**Relationships:**
- Many-to-one with `accounts` (via `accountId`)
- Many-to-one with `categories` (via `categoryId`)

### AppMeta Table

Application metadata and migration tracking.

```typescript
interface AppMeta {
  id: 'singleton'      // Fixed primary key
  schemaVersion: number // Current schema version
  appVersion: string   // Application version
  createdAt: Date      // Database creation date
  updatedAt: Date      // Last update timestamp
  migrations: string[] // Migration history
}
```

**Usage:**
- Single row with fixed ID 'singleton'
- Tracks schema migrations and app version
- Used for data integrity and upgrade logic

## Repository Pattern

Data access is abstracted through repository classes that provide a clean API over Dexie operations.

### Base Repository Operations

All repositories implement standard CRUD operations:

```typescript
interface BaseRepository<T> {
  create(data: Omit<T, 'id'>): Promise<T>
  getById(id: string): Promise<T | undefined>
  getAll(): Promise<T[]>
  update(id: string, data: Partial<T>): Promise<void>
  delete(id: string): Promise<void>
}
```

### Account Repository

```typescript
class AccountRepository {
  // Standard CRUD operations
  async create(data: Omit<Account, 'id' | 'createdAt'>): Promise<Account>
  async getById(id: string): Promise<Account | undefined>
  async getAll(): Promise<Account[]>
  async update(id: string, data: Partial<Account>): Promise<void>
  async delete(id: string): Promise<void>
  
  // Specialized operations
  async getActive(): Promise<Account[]>
  async archive(id: string): Promise<void>
  async getTotalBalance(): Promise<number>
  async setDefaultAccount(id: string): Promise<void>
}
```

**Key Features:**
- Soft delete through `archive()` method
- Balance aggregation across active accounts
- Default account management with automatic clearing

### Transaction Repository

```typescript
class TransactionRepository {
  // Standard CRUD operations
  async create(data: Omit<Transaction, 'id'>): Promise<Transaction>
  async getById(id: string): Promise<Transaction | undefined>
  async getAll(): Promise<Transaction[]>
  async update(id: string, data: Partial<Transaction>): Promise<void>
  async delete(id: string): Promise<void>
  
  // Bulk operations
  async bulkUpdate(ids: string[], data: Partial<Transaction>): Promise<void>
  async bulkDelete(ids: string[]): Promise<void>
  
  // Query operations
  async getByAccountId(accountId: string, limit?: number): Promise<Transaction[]>
  async getByCategoryId(categoryId: string, limit?: number): Promise<Transaction[]>
  async getByDateRange(start: Date, end: Date): Promise<Transaction[]>
  
  // Analytics
  async getSpendingByCategory(start: Date, end: Date): Promise<Array<{ categoryId: string; amount: number }>>
  async getCashflow(start: Date, end: Date): Promise<{ income: number; expenses: number; net: number }>
}
```

**Optimizations:**
- Compound indexes for `[accountId+date]` and `[categoryId+date]` queries
- Bulk operations for performance
- Optimized date range queries using Dexie's `between()` method

### Budget Repository

```typescript
class BudgetRepository {
  // Standard CRUD operations
  async create(data: Omit<Budget, 'id'>): Promise<Budget>
  async getById(id: string): Promise<Budget | undefined>
  async getAll(): Promise<Budget[]>
  async update(id: string, data: Partial<Budget>): Promise<void>
  async delete(id: string): Promise<void>
  
  // Specialized queries
  async getByMonth(month: string): Promise<Budget[]>
  async getByCategoryId(categoryId: string): Promise<Budget[]>
  async getByCategoryAndMonth(categoryId: string, month: string): Promise<Budget | undefined>
}
```

**Optimization:**
- Compound index `[categoryId+month]` ensures efficient unique lookups
- Month-based queries for budget period analysis

### Category Repository

```typescript
class CategoryRepository {
  // Standard CRUD operations with hierarchy support
  async create(data: Omit<Category, 'id'>): Promise<Category>
  async getById(id: string): Promise<Category | undefined>
  async getAll(): Promise<Category[]>
  async update(id: string, data: Partial<Category>): Promise<void>
  async delete(id: string): Promise<void>
  
  // Hierarchy operations
  async getTopLevel(): Promise<Category[]>
  async getChildren(parentId: string): Promise<Category[]>
}
```

**Integrity Checks:**
- Prevents deletion of categories with associated transactions or budgets
- Validates hierarchy consistency

## Migration Strategies

Kite implements automatic schema migrations with comprehensive tracking.

### Migration Lifecycle

```typescript
class KiteDatabase extends Dexie {
  constructor() {
    super('KiteDatabase')
    
    // Version 1 - Initial schema
    this.version(1).stores({
      accounts: 'id, name, type, currency, balance, createdAt, archivedAt',
      transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription',
      // ... other tables
    })
    
    // Version 2 - Add compound indexes
    this.version(2).stores({
      accounts: 'id, name, type, currency, balance, createdAt, archivedAt',
      transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, [accountId+date], [categoryId+date]',
      // ... compound indexes added
    })
    
    // Version 3 - Add metadata field
    this.version(3).stores({
      // ... same as v2 but with metadata field
      transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, metadata, [accountId+date], [categoryId+date]',
    }).upgrade(tx => {
      // Data migration logic
      return tx.table('transactions').toCollection().modify(transaction => {
        if (!transaction.metadata) {
          transaction.metadata = {}
        }
      })
    })
  }
}
```

### Migration Tracking

Migrations are automatically tracked in the `appMeta` table:

```typescript
private async trackMigration() {
  try {
    let meta = await this.appMeta.get('singleton')
    const currentVersion = this.verno
    const appVersion = '1.0.0'

    if (!meta) {
      // First time setup
      meta = {
        id: 'singleton',
        schemaVersion: currentVersion,
        appVersion,
        createdAt: new Date(),
        updatedAt: new Date(),
        migrations: [`v${currentVersion}-initial-setup`]
      }
      await this.appMeta.add(meta)
    } else if (meta.schemaVersion < currentVersion) {
      // Schema was upgraded
      const migrationName = `v${meta.schemaVersion}-to-v${currentVersion}`
      await this.appMeta.update('singleton', {
        schemaVersion: currentVersion,
        appVersion,
        updatedAt: new Date(),
        migrations: [...meta.migrations, migrationName]
      })
    }
  } catch (error) {
    console.error('Failed to track migration:', error)
  }
}
```

### Migration Best Practices

1. **Never Modify Previous Versions**: Always add new versions, never edit existing ones
2. **Use Upgrade Functions**: Implement data transformations in `.upgrade()` callbacks
3. **Test Migrations**: Verify migration logic with sample data before deployment
4. **Backup Data**: Provide export functionality before major migrations
5. **Graceful Degradation**: Handle migration failures gracefully

### Example Migration Patterns

#### Adding New Fields
```typescript
this.version(4).stores({
  // Same schema with new field
  transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, metadata, tags, [accountId+date], [categoryId+date]',
}).upgrade(tx => {
  return tx.table('transactions').toCollection().modify(transaction => {
    transaction.tags = [] // Initialize new field
  })
})
```

#### Restructuring Data
```typescript
this.version(5).stores({
  // Modified schema
}).upgrade(async tx => {
  const transactions = await tx.table('transactions').toArray()
  
  await Promise.all(transactions.map(async transaction => {
    // Transform data structure
    const newStructure = transformTransaction(transaction)
    await tx.table('transactions').update(transaction.id, newStructure)
  }))
})
```

#### Adding New Tables
```typescript
this.version(6).stores({
  // Existing tables
  accounts: 'id, name, type, currency, balance, createdAt, archivedAt',
  transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, metadata, [accountId+date], [categoryId+date]',
  // New table
  tags: 'id, name, color, icon'
}).upgrade(async tx => {
  // Populate new table with default data
  const defaultTags = [
    { id: 'tag-1', name: 'Important', color: '#ef4444', icon: '⭐' },
    { id: 'tag-2', name: 'Review', color: '#f59e0b', icon: '👁️' }
  ]
  
  await Promise.all(defaultTags.map(tag => tx.table('tags').add(tag)))
})
```

## Performance Considerations

### Indexing Strategy

Proper indexing is crucial for query performance:

```typescript
// Single column indexes
'id, name, type, currency, balance, createdAt, archivedAt'

// Compound indexes for common query patterns
'[accountId+date]'     // Transactions by account and date range
'[categoryId+date]'    // Transactions by category and date range
'[categoryId+month]'   // Budgets by category and month
```

### Query Optimization

#### Efficient Date Range Queries
```typescript
// Good: Uses compound index
async getTransactionsByAccountAndDate(accountId: string, start: Date, end: Date) {
  return db.transactions
    .where('[accountId+date]')
    .between([accountId, start], [accountId, end])
    .toArray()
}

// Avoid: Requires full table scan
async getTransactionsByAccountAndDateSlow(accountId: string, start: Date, end: Date) {
  return db.transactions
    .filter(t => t.accountId === accountId && t.date >= start && t.date <= end)
    .toArray()
}
```

#### Pagination for Large Datasets
```typescript
async getTransactionsPaginated(offset: number, limit: number) {
  return db.transactions
    .orderBy('date')
    .reverse()
    .offset(offset)
    .limit(limit)
    .toArray()
}
```

#### Bulk Operations
```typescript
// Good: Single transaction for multiple operations
async bulkUpdateTransactions(updates: Array<{ id: string; data: Partial<Transaction> }>) {
  return db.transaction('rw', db.transactions, async () => {
    await Promise.all(
      updates.map(({ id, data }) => db.transactions.update(id, data))
    )
  })
}

// Avoid: Multiple separate transactions
async bulkUpdateTransactionsSlow(updates: Array<{ id: string; data: Partial<Transaction> }>) {
  for (const { id, data } of updates) {
    await db.transactions.update(id, data) // Each update is a separate transaction
  }
}
```

### Memory Management

#### Streaming Large Results
```typescript
// Good: Process in chunks to avoid memory issues
async processAllTransactions(processor: (transaction: Transaction) => void) {
  await db.transactions.each(processor)
}

// Avoid: Loading all data into memory
async processAllTransactionsSlow(processor: (transaction: Transaction) => void) {
  const allTransactions = await db.transactions.toArray() // May cause memory issues
  allTransactions.forEach(processor)
}
```

#### Selective Field Loading
```typescript
// Good: Only load needed fields
async getTransactionSummaries() {
  return db.transactions.toCollection().modify(transaction => ({
    id: transaction.id,
    date: transaction.date,
    amount: transaction.amount,
    description: transaction.description
  }))
}
```

### Caching Strategies

#### Result Caching
```typescript
class CachedTransactionRepository extends TransactionRepository {
  private cache = new Map<string, Transaction[]>()
  
  async getByAccountId(accountId: string, limit?: number): Promise<Transaction[]> {
    const cacheKey = `${accountId}-${limit || 'all'}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    const result = await super.getByAccountId(accountId, limit)
    this.cache.set(cacheKey, result)
    
    return result
  }
  
  invalidateCache(accountId?: string) {
    if (accountId) {
      // Invalidate specific account cache
      for (const key of this.cache.keys()) {
        if (key.startsWith(accountId)) {
          this.cache.delete(key)
        }
      }
    } else {
      // Invalidate all cache
      this.cache.clear()
    }
  }
}
```

## Data Integrity

### Referential Integrity

While IndexedDB doesn't enforce foreign key constraints, the application implements logical integrity checks:

```typescript
// Account deletion check
async delete(id: string): Promise<void> {
  await db.transaction('rw', [db.accounts, db.transactions], async () => {
    const transactionCount = await db.transactions.where('accountId').equals(id).count()
    if (transactionCount > 0) {
      throw new Error('Cannot delete account with transactions. Archive it instead.')
    }
    await db.accounts.delete(id)
  })
}

// Category deletion check
async delete(id: string): Promise<void> {
  await db.transaction('rw', [db.categories, db.transactions, db.budgets], async () => {
    const [transactionCount, budgetCount] = await Promise.all([
      db.transactions.where('categoryId').equals(id).count(),
      db.budgets.where('categoryId').equals(id).count()
    ])
    
    if (transactionCount > 0 || budgetCount > 0) {
      throw new Error('Cannot delete category with associated transactions or budgets')
    }
    
    const children = await db.categories.where('parentId').equals(id).toArray()
    if (children.length > 0) {
      throw new Error('Cannot delete category with subcategories')
    }
    
    await db.categories.delete(id)
  })
}
```

### Data Validation

Input validation ensures data consistency:

```typescript
function validateTransaction(transaction: Partial<Transaction>): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!transaction.accountId) {
    errors.push({ field: 'accountId', message: 'Account is required' })
  }
  
  if (!transaction.date) {
    errors.push({ field: 'date', message: 'Date is required' })
  }
  
  if (transaction.amount === undefined || transaction.amount === null) {
    errors.push({ field: 'amount', message: 'Amount is required' })
  }
  
  if (!transaction.description?.trim()) {
    errors.push({ field: 'description', message: 'Description is required' })
  }
  
  return errors
}
```

### Backup and Recovery

#### Export Functionality
```typescript
async exportAllData(): Promise<DatabaseBackup> {
  const [accounts, transactions, categories, budgets, rules, subscriptions, appMeta] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.categories.toArray(),
    db.budgets.toArray(),
    db.rules.toArray(),
    db.subscriptions.toArray(),
    db.appMeta.toArray()
  ])
  
  return {
    version: '1.0',
    exportDate: new Date(),
    data: {
      accounts,
      transactions,
      categories,
      budgets,
      rules,
      subscriptions,
      appMeta
    }
  }
}
```

#### Import Functionality
```typescript
async importData(backup: DatabaseBackup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    // Clear existing data
    await this.clearAllData()
    
    // Import new data
    await Promise.all([
      db.accounts.bulkAdd(backup.data.accounts),
      db.transactions.bulkAdd(backup.data.transactions),
      db.categories.bulkAdd(backup.data.categories),
      db.budgets.bulkAdd(backup.data.budgets),
      db.rules.bulkAdd(backup.data.rules),
      db.subscriptions.bulkAdd(backup.data.subscriptions)
    ])
  })
}
```

## Database Utilities

### Clear All Data
```typescript
async clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all([
      db.accounts.clear(),
      db.transactions.clear(),
      db.categories.clear(),
      db.budgets.clear(),
      db.rules.clear(),
      db.subscriptions.clear()
    ])
    
    // Keep appMeta but update timestamp
    const meta = await db.appMeta.get('singleton')
    if (meta) {
      await db.appMeta.update('singleton', {
        updatedAt: new Date(),
        migrations: [...meta.migrations, `reset-${new Date().toISOString()}`]
      })
    }
  })
}
```

### Get Migration History
```typescript
async getMigrationHistory(): Promise<string[]> {
  const meta = await db.appMeta.get('singleton')
  return meta?.migrations || []
}
```

### Database Statistics
```typescript
async getDatabaseStats(): Promise<DatabaseStats> {
  const [accountCount, transactionCount, categoryCount, budgetCount, ruleCount, subscriptionCount] = await Promise.all([
    db.accounts.count(),
    db.transactions.count(),
    db.categories.count(),
    db.budgets.count(),
    db.rules.count(),
    db.subscriptions.count()
  ])
  
  return {
    accounts: accountCount,
    transactions: transactionCount,
    categories: categoryCount,
    budgets: budgetCount,
    rules: ruleCount,
    subscriptions: subscriptionCount,
    totalRecords: accountCount + transactionCount + categoryCount + budgetCount + ruleCount + subscriptionCount
  }
}
```

## Security Considerations

### Data Encryption
For sensitive data, consider client-side encryption:

```typescript
import { securityService } from '@/services'

async createEncryptedTransaction(data: TransactionData, userKey: string): Promise<Transaction> {
  const encryptedData = await securityService.encryptData(
    JSON.stringify(data.sensitiveFields),
    userKey
  )
  
  return transactionRepo.create({
    ...data,
    metadata: {
      ...data.metadata,
      encrypted: encryptedData
    }
  })
}
```

### Access Control
Implement access control at the application level:

```typescript
class SecureTransactionRepository extends TransactionRepository {
  constructor(private userPermissions: UserPermissions) {
    super()
  }
  
  async getByAccountId(accountId: string): Promise<Transaction[]> {
    if (!this.userPermissions.canAccessAccount(accountId)) {
      throw new Error('Access denied')
    }
    
    return super.getByAccountId(accountId)
  }
}
```

## Troubleshooting

### Common Issues

#### Database Corruption
```typescript
async checkDatabaseIntegrity(): Promise<boolean> {
  try {
    await db.open()
    const meta = await db.appMeta.get('singleton')
    return meta !== undefined
  } catch (error) {
    console.error('Database integrity check failed:', error)
    return false
  }
}
```

#### Migration Failures
```typescript
async repairDatabase(): Promise<void> {
  try {
    await db.delete()
    await db.open()
    console.log('Database recreated successfully')
  } catch (error) {
    console.error('Database repair failed:', error)
    throw new Error('Unable to repair database')
  }
}
```

#### Performance Issues
1. **Check Index Usage**: Verify queries use appropriate indexes
2. **Monitor Transaction Size**: Keep transactions small and focused
3. **Use Bulk Operations**: Prefer bulk operations for multiple records
4. **Implement Pagination**: Avoid loading large datasets at once

### Debugging Tools

#### Query Analysis
```typescript
// Enable Dexie debugging
import Dexie from 'dexie'

if (process.env.NODE_ENV === 'development') {
  Dexie.debug = true
}
```

#### Performance Monitoring
```typescript
async measureQueryPerformance<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = performance.now()
  const result = await operation()
  const end = performance.now()
  
  console.log(`${operationName} took ${end - start} milliseconds`)
  return result
}
```

This comprehensive database documentation provides the foundation for understanding and working with Kite's data layer. For implementation details, refer to the repository classes in `/src/db/repositories.ts` and the schema definition in `/src/db/schema.ts`.