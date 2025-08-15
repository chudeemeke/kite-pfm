# Database Schema Documentation

Kite uses Dexie.js as a wrapper around IndexedDB for client-side data storage. All data remains on the user's device.

## Schema Overview

The database consists of 7 main tables with proper indexing for performance:

### Accounts Table
```typescript
interface Account {
  id: string                    // Primary key (nanoid)
  name: string                 // Display name
  type: AccountType            // checking, savings, credit, etc.
  currency: string             // ISO currency code (GBP, USD, etc.)
  balance: number              // Current balance
  createdAt: Date             // Creation timestamp
  archivedAt?: Date           // Archive timestamp (soft delete)
}
```

**Indexes**: `id`, `name`, `type`, `currency`, `balance`, `createdAt`, `archivedAt`

### Transactions Table
```typescript
interface Transaction {
  id: string                   // Primary key (nanoid)
  accountId: string           // Foreign key to accounts
  date: Date                  // Transaction date
  amount: number              // Amount (negative for expenses)
  currency: string            // ISO currency code
  description: string         // Transaction description
  merchant?: string           // Merchant name
  categoryId?: string         // Foreign key to categories
  isSubscription?: boolean    // Subscription flag
  metadata?: Record<string, unknown> // Additional data
}
```

**Indexes**: `id`, `accountId`, `date`, `amount`, `categoryId`, `[accountId+date]`, `[categoryId+date]`

### Categories Table
```typescript
interface Category {
  id: string                  // Primary key (nanoid)
  name: string               // Display name
  icon: string               // Emoji or icon identifier
  color: string              // Hex color code
  parentId?: string          // Parent category (for hierarchies)
}
```

**Indexes**: `id`, `name`, `parentId`

### Budgets Table
```typescript
interface Budget {
  id: string                 // Primary key (nanoid)
  categoryId: string        // Foreign key to categories
  month: string             // Format: YYYY-MM
  amount: number            // Budget amount
  carryStrategy: CarryStrategy // carryNone, carryUnspent, carryOverspend
  notes?: string            // Optional notes
}
```

**Indexes**: `id`, `categoryId`, `month`, `[categoryId+month]`

### Rules Table
```typescript
interface Rule {
  id: string                // Primary key (nanoid)
  name: string             // Display name
  enabled: boolean         // Active status
  priority: number         // Execution order (0 = highest)
  conditions: RuleCondition[] // Match conditions
  actions: RuleAction[]    // Actions to perform
  stopProcessing: boolean  // Stop rule chain if matched
}
```

**Indexes**: `id`, `name`, `enabled`, `priority`

### Subscriptions Table
```typescript
interface Subscription {
  id: string               // Primary key (nanoid)
  name: string            // Display name
  cadence: Cadence        // monthly, yearly, custom
  amount: number          // Subscription cost
  currency: string        // ISO currency code
  nextDueDate: Date       // Next payment due
  accountId?: string      // Associated account
  categoryId?: string     // Associated category
  notes?: string          // Optional notes
}
```

**Indexes**: `id`, `name`, `cadence`, `nextDueDate`

### App Metadata Table
```typescript
interface AppMeta {
  id: 'singleton'         // Always 'singleton' (single record)
  schemaVersion: number   // Current schema version
  appVersion: string      // App version at creation
  createdAt: Date         // Database creation time
  updatedAt: Date         // Last update time
  migrations: string[]    // Migration history
}
```

**Indexes**: `id`

## Schema Migrations

The database uses versioned migrations to handle schema changes:

### Version 1 (Initial)
- Basic table structure
- Primary keys and basic indexes

### Version 2 (Performance)
- Added compound indexes for better query performance
- `[accountId+date]` for transaction queries by account and date range
- `[categoryId+date]` for spending analysis
- `[categoryId+month]` for budget lookups

### Version 3 (Metadata)
- Added `metadata` field to transactions
- Automatic upgrade preserves existing data

## Data Relationships

```
Account 1:N Transaction
Category 1:N Transaction
Category 1:N Budget
Category 1:N Subscription (optional)
Account 1:N Subscription (optional)
Category 1:N Category (parent-child)
```

## Indexing Strategy

### Compound Indexes
- `transactions[accountId+date]`: Fast account statement queries
- `transactions[categoryId+date]`: Efficient spending analysis
- `budgets[categoryId+month]`: Quick budget lookups

### Single Field Indexes
- All primary keys (`id`)
- Frequently queried fields (`date`, `amount`, `enabled`, `priority`)
- Foreign keys (`accountId`, `categoryId`)

## Performance Considerations

1. **Query Optimization**: Use compound indexes for multi-field queries
2. **Data Types**: Store dates as Date objects for proper indexing
3. **Pagination**: Limit large result sets using Dexie's `.limit()`
4. **Soft Deletes**: Use `archivedAt` field instead of actual deletion

## Migration Strategy

```typescript
// Example migration
this.version(3).stores({
  // Updated schema
}).upgrade(tx => {
  // Data transformation logic
  return tx.table('transactions').toCollection().modify(transaction => {
    if (!transaction.metadata) {
      transaction.metadata = {}
    }
  })
})
```

## Backup and Restore

While not implemented in v1.0, the schema supports:

1. **Export**: JSON serialization of all tables
2. **Import**: Validation and restoration from JSON
3. **Sync**: Future multi-device synchronization

## Security Notes

- All data stored locally in IndexedDB
- No external transmission of financial data
- Future encryption will use per-record AES-GCM
- Key derivation via PBKDF2 or Argon2