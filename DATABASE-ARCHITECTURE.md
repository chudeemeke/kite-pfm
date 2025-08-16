# Enterprise-Grade Database Architecture

## Overview

Kite uses a sophisticated IndexedDB implementation via Dexie.js, completely eliminating localStorage dependency in favor of a robust, scalable database solution.

## 🏗️ Architecture Components

### 1. **DatabaseManager** (Core Engine)
Located at: `/src/db/DatabaseManager.ts`

#### Features:
- **Transaction Management**: ACID-compliant transactions with automatic rollback
- **Query Caching**: Intelligent caching with TTL and automatic invalidation
- **Offline Sync Queue**: Automatic sync when connection restored
- **Data Encryption**: AES-256-GCM encryption for sensitive data
- **Performance Monitoring**: Real-time metrics and query optimization
- **Data Integrity**: Automatic validation and consistency checks
- **Bulk Operations**: Optimized batch processing with progress tracking
- **Real-time Subscriptions**: Live data updates via observable pattern

#### Key Methods:
```typescript
// Execute transaction with retry logic
await databaseManager.executeTransaction(operation, {
  retries: 3,
  timeout: 5000,
  isolation: 'repeatable-read'
})

// Cached query execution
await databaseManager.queryCached(queryFn, cacheKey, ttl)

// Bulk operations with progress
await databaseManager.bulkOperation(table, 'add', data, {
  batchSize: 1000,
  onProgress: (processed, total) => console.log(`${processed}/${total}`)
})

// Data integrity verification
const integrity = await databaseManager.verifyDataIntegrity()
```

### 2. **Repository Pattern**
Located at: `/src/db/repositories/`

#### BaseRepository Features:
- **CRUD Operations**: Full create, read, update, delete with validation
- **Soft Delete**: Logical deletion with restoration capability
- **Optimistic Locking**: Version-based conflict prevention
- **Audit Trail**: Complete history of all data changes
- **Relationships**: Eager loading with hasOne, hasMany, belongsTo, belongsToMany
- **Query Builder**: Fluent interface for complex queries
- **Pagination**: Cursor and offset-based pagination
- **Aggregations**: Sum, average, min, max, count operations
- **Validation Framework**: Comprehensive data validation rules

#### TransactionRepository (Advanced Implementation):
```typescript
// Advanced search with filters
const transactions = await transactionRepository.search({
  accountIds: ['acc1', 'acc2'],
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-12-31'),
  amountMin: 100,
  type: 'expense',
  searchText: 'coffee'
})

// Analyze spending patterns
const patterns = await transactionRepository.analyzeSpendingPatterns(
  accountId,
  categoryId,
  { from: startDate, to: endDate }
)

// Detect and merge duplicates
const duplicates = await transactionRepository.detectDuplicates()
await transactionRepository.mergeDuplicates(duplicates[0], true, userId)

// Auto-categorization
const categorized = await transactionRepository.autoCategorize()
```

### 3. **Data Storage Strategy**

#### IndexedDB vs localStorage:

| Feature | IndexedDB (Current) | localStorage (Removed) |
|---------|-------------------|----------------------|
| **Storage Limit** | 50% of free disk space | 5-10MB |
| **Data Types** | All JavaScript types | Strings only |
| **Performance** | Asynchronous, non-blocking | Synchronous, blocks UI |
| **Transactions** | ACID compliant | None |
| **Indexes** | Multiple indexes | None |
| **Query Capability** | Complex queries | Key-value only |
| **Browser Support** | All modern browsers | All browsers |
| **Offline Support** | Full offline capability | Limited |
| **Encryption** | Supported | Manual only |

#### localStorage Usage:
localStorage is ONLY used as a **fallback** in extreme cases where IndexedDB is unavailable (rare browser restrictions). This is handled automatically by the `indexedDBStorage` adapter.

### 4. **Database Schema**

```typescript
// Version 7 Schema with comprehensive tables
KiteDatabase
├── accounts (financial accounts)
├── transactions (all transactions)
├── categories (transaction categories)
├── budgets (budget allocations)
├── rules (auto-categorization rules)
├── subscriptions (recurring payments)
├── goals (financial goals)
├── goalMilestones (goal progress markers)
├── goalContributions (goal funding history)
├── anomalyInsights (detected anomalies)
├── backups (backup metadata)
├── notifications (user notifications)
├── users (user profiles)
├── securityCredentials (auth credentials)
├── securitySettings (security preferences)
├── settings (app settings)
├── appMeta (database metadata)
├── performanceMetrics (query performance)
├── auditLogs (change history)
└── syncQueue (offline sync queue)
```

### 5. **Advanced Features**

#### Offline Synchronization:
```typescript
// Automatic queue management
window.addEventListener('offline', () => {
  // Operations queued automatically
})

window.addEventListener('online', () => {
  // Queue processed with exponential backoff
})
```

#### Data Encryption:
```typescript
// Sensitive data encryption
const encrypted = await databaseManager.encryptSensitiveData({
  accountNumber: '1234567890',
  pin: '1234'
})

// Automatic decryption
const decrypted = await databaseManager.decryptSensitiveData(encrypted)
```

#### Performance Optimization:
```typescript
// Database optimization
await databaseManager.optimizeDatabase()

// Get performance statistics
const stats = await databaseManager.getDatabaseStats()
console.log(`Avg query time: ${stats.performance.avgQueryTime}ms`)
console.log(`Cache hit rate: ${stats.performance.cacheHitRate * 100}%`)
```

#### Data Integrity:
```typescript
// Verify data integrity
const integrity = await databaseManager.verifyDataIntegrity()
if (!integrity.valid) {
  console.error('Issues found:', integrity.issues)
  console.log('Recommendations:', integrity.recommendations)
}

// Find and fix orphaned records
const orphaned = await databaseManager.findOrphanedTransactions()
```

### 6. **Migration Strategy**

#### From localStorage to IndexedDB:
1. **Automatic Detection**: System detects localStorage data on first run
2. **Data Migration**: Automatic transfer to IndexedDB
3. **Validation**: Data integrity verification
4. **Cleanup**: localStorage cleared after successful migration
5. **Fallback**: Maintains compatibility if IndexedDB unavailable

### 7. **Security Features**

- **Encryption at Rest**: AES-256-GCM for sensitive data
- **Audit Trail**: Complete change history
- **Access Control**: User-based permissions
- **Data Validation**: Input sanitization and validation
- **Version Control**: Optimistic locking prevents conflicts
- **Secure Backup**: Encrypted backup/restore functionality

### 8. **Performance Optimizations**

- **Indexed Queries**: Multi-field indexes for fast lookups
- **Query Caching**: LRU cache with TTL
- **Batch Processing**: Optimized bulk operations
- **Lazy Loading**: Load related data only when needed
- **Connection Pooling**: Reuse database connections
- **Compression**: Data compression for large datasets

### 9. **Monitoring & Debugging**

#### Developer Tools:
- **DatabaseStatus Component**: Real-time database monitoring
- **Performance Metrics**: Query timing and optimization hints
- **Audit Logs**: Complete operation history
- **Test Utilities**: Comprehensive testing framework

```typescript
// Test database operations
await testDatabaseOperations.runAllTests()

// Monitor in real-time
<DatabaseStatus /> // Shows live stats when dev mode enabled
```

### 10. **Best Practices**

#### DO:
✅ Use repositories for all data access
✅ Implement validation rules
✅ Use transactions for related operations
✅ Cache expensive queries
✅ Handle offline scenarios
✅ Encrypt sensitive data
✅ Regular integrity checks
✅ Monitor performance metrics

#### DON'T:
❌ Access IndexedDB directly (use repositories)
❌ Store sensitive data unencrypted
❌ Ignore validation errors
❌ Skip transaction boundaries
❌ Forget error handling
❌ Use localStorage for app data
❌ Bypass the caching layer
❌ Ignore performance warnings

## Implementation Examples

### Creating a New Repository:

```typescript
import { BaseRepository, ValidationRules } from './BaseRepository'

export class AccountRepository extends BaseRepository<Account> {
  constructor() {
    super('accounts', true) // Enable soft delete
  }
  
  protected setupRelationships() {
    this.relationships.set('transactions', {
      type: 'hasMany',
      relatedTable: 'transactions',
      foreignKey: 'accountId'
    })
  }
  
  protected setupValidation() {
    this.validationRules.set('name', [
      ValidationRules.required(),
      ValidationRules.min(3),
      ValidationRules.max(50)
    ])
    
    this.validationRules.set('balance', [
      ValidationRules.required(),
      ValidationRules.custom(v => typeof v === 'number')
    ])
  }
  
  protected setupIndexes() {
    this.indexes.add('name')
    this.indexes.add('type')
    this.indexes.add('currency')
  }
}
```

### Using the Repository:

```typescript
// Create with validation
const account = await accountRepository.create({
  name: 'Savings Account',
  type: 'savings',
  balance: 1000,
  currency: 'USD'
}, userId)

// Complex query with caching
const transactions = await transactionRepository.findAll({
  where: { accountId: account.id },
  orderBy: 'date',
  orderDirection: 'desc',
  limit: 50,
  include: ['category', 'attachments'],
  cache: true,
  cacheTTL: 60000
})

// Paginated results
const page = await transactionRepository.findPaginated(
  { page: 1, pageSize: 20 },
  { where: { accountId: account.id } }
)

// Aggregations
const stats = await transactionRepository.aggregate({
  groupBy: ['categoryId'],
  sum: ['amount'],
  count: true
})
```

## Conclusion

This sophisticated database implementation provides:
- **Enterprise-grade reliability**
- **Offline-first architecture**
- **Superior performance**
- **Complete data integrity**
- **Advanced querying capabilities**
- **Comprehensive security**
- **Real-time synchronization**
- **Extensive monitoring**

The system completely replaces localStorage with IndexedDB, using localStorage only as an emergency fallback when IndexedDB is unavailable (extremely rare edge cases).