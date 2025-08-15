# Kite API Documentation

This documentation covers the service layer, store management, and data architecture of the Kite Personal Finance Manager.

## Architecture Overview

Kite follows a modern, client-side architecture with the following key components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │────│   Zustand       │────│   IndexedDB     │
│   Components    │    │   Stores        │    │   (Dexie)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   Service       │
                       │   Layer         │
                       └─────────────────┘
```

### Core Principles

- **State Management**: Zustand for reactive state management with persistence
- **Database**: Dexie (IndexedDB wrapper) for local-first data storage
- **Services**: Utility layer for business logic and data formatting
- **Repository Pattern**: Clean abstraction over database operations
- **Optimistic Updates**: Immediate UI feedback with rollback on errors

## Service Layer

The service layer provides business logic and utility functions across the application:

### Available Services

| Service | Purpose | Key Features |
|---------|---------|--------------|
| **Format Service** | Data formatting and localization | Currency, dates, numbers, validation |
| **Budgeting Service** | Budget calculations and ledger management | Carryover logic, spending analysis |
| **Rules Service** | Transaction categorization automation | Condition matching, priority handling |
| **CSV Service** | Data import/export functionality | Parsing, validation, mapping |
| **Security Service** | Data encryption and protection | PIN verification, biometric auth |
| **Notifications Service** | Alert and reminder system | Budget alerts, transaction notifications |

### Service Architecture

Services are implemented as classes with singleton instances:

```typescript
export class ServiceName {
  // Business logic methods
  async doSomething(): Promise<Result> {
    // Implementation
  }
}

// Export singleton
export const serviceName = new ServiceName()
```

## Store Management with Zustand

Kite uses Zustand for state management with the following stores:

### Core Stores

| Store | Purpose | Persistence |
|-------|---------|-------------|
| **Transactions** | Transaction CRUD and filtering | IndexedDB |
| **Accounts** | Account management and balances | IndexedDB |
| **Budgets** | Budget tracking and calculations | IndexedDB |
| **Categories** | Category hierarchy and management | IndexedDB |
| **Rules** | Automation rules for transactions | IndexedDB |
| **Subscriptions** | Recurring payment tracking | IndexedDB |
| **Settings** | User preferences and configuration | LocalStorage |
| **UI** | Interface state and theming | LocalStorage (partial) |

### Store Features

- **Optimistic Updates**: UI updates immediately with automatic rollback on errors
- **Error Handling**: Consistent error state management across all stores
- **Loading States**: Built-in loading indicators for async operations
- **Data Synchronization**: Automatic refresh and consistency checks

### Store Initialization

All stores are initialized together during app startup:

```typescript
const { initializeStores } = useInitializeStores()
await initializeStores()
```

## Data Flow Patterns

### 1. Data Creation Flow

```
UI Component → Store Action → Repository → Database → Store Update → UI Refresh
```

### 2. Optimistic Update Pattern

```typescript
// 1. Optimistic update
const originalData = get().data
set((state) => {
  // Update state optimistically
})

try {
  // 2. Persist to database
  await repository.update(id, data)
} catch (error) {
  // 3. Rollback on error
  set((state) => {
    state.data = originalData
  })
  throw error
}
```

### 3. Error Handling Pattern

```typescript
try {
  await operation()
} catch (error) {
  set((state) => {
    state.error = error instanceof Error ? error.message : 'Operation failed'
    state.isLoading = false
  })
  throw error
}
```

## Database Layer (Dexie/IndexedDB)

Kite uses Dexie as a wrapper around IndexedDB for local-first data storage:

### Key Features

- **Schema Versioning**: Automatic migrations with version tracking
- **Compound Indexes**: Optimized queries for date ranges and relationships
- **Transaction Support**: ACID compliance for complex operations
- **Performance**: Efficient querying with proper indexing

### Schema Evolution

The database schema is versioned and supports automatic migrations:

```typescript
// Version 1 - Initial schema
this.version(1).stores({
  transactions: 'id, accountId, date, amount'
})

// Version 2 - Add indexes
this.version(2).stores({
  transactions: 'id, accountId, date, amount, [accountId+date]'
})

// Version 3 - Add metadata field
this.version(3).stores({
  transactions: 'id, accountId, date, amount, metadata, [accountId+date]'
}).upgrade(tx => {
  // Migration logic
})
```

## Best Practices

### Store Usage

1. **Single Responsibility**: Each store manages one domain
2. **Immutable Updates**: Use Immer for safe state mutations
3. **Error Boundaries**: Always handle and display errors appropriately
4. **Loading States**: Provide feedback during async operations

### Service Integration

1. **Pure Functions**: Services should be stateless when possible
2. **Error Propagation**: Let stores handle error state management
3. **Validation**: Validate data at service boundaries
4. **Type Safety**: Use TypeScript interfaces for all data structures

### Performance Considerations

1. **Selective Subscriptions**: Only subscribe to needed store slices
2. **Memoization**: Use React.memo and useMemo for expensive operations
3. **Lazy Loading**: Load data on demand when possible
4. **Batch Operations**: Use bulk operations for multiple items

## Development Guidelines

### Adding New Stores

1. Define TypeScript interfaces for state and actions
2. Implement optimistic updates with rollback
3. Add proper error handling and loading states
4. Include selectors for computed values
5. Add to store initialization

### Adding New Services

1. Create class with singleton export pattern
2. Use dependency injection for repositories
3. Include comprehensive error handling
4. Add unit tests for business logic
5. Document public API methods

### Database Migrations

1. Never modify existing schema versions
2. Always add new version with proper upgrade logic
3. Test migrations with sample data
4. Document schema changes in commit messages

## Security Considerations

- **Data Encryption**: Sensitive data can be encrypted at rest
- **Input Validation**: All user inputs are validated and sanitized
- **XSS Protection**: React provides built-in XSS protection
- **Local Storage**: No sensitive data in localStorage, only in IndexedDB

## Related Documentation

- [Stores API Reference](./stores.md) - Detailed store documentation
- [Services API Reference](./services.md) - Service method documentation  
- [Database Schema](./database.md) - Database structure and operations
- [User Guide](../user-guide.md) - End-user documentation