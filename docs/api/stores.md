# Zustand Stores API Reference

This document provides comprehensive documentation for all Zustand stores in the Kite application.

## Store Architecture

All stores follow a consistent pattern:

```typescript
interface StoreInterface {
  // State
  data: DataType[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchData: () => Promise<void>
  createData: (data: CreateType) => Promise<DataType>
  updateData: (id: string, data: UpdateType) => Promise<void>
  deleteData: (id: string) => Promise<void>
  
  // Selectors
  getDataById: (id: string) => DataType | undefined
}
```

## Transactions Store

Manages transaction data with filtering and analysis capabilities.

### State Shape

```typescript
interface TransactionsStore {
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  filters: {
    accountId?: string
    categoryId?: string
    dateRange?: { start: Date; end: Date }
    searchTerm?: string
  }
}
```

### Actions

#### `fetchTransactions(): Promise<void>`
Loads all transactions from the database.

```typescript
const { fetchTransactions } = useTransactionsStore()
await fetchTransactions()
```

#### `createTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction>`
Creates a new transaction with optimistic updates.

```typescript
const { createTransaction } = useTransactionsStore()
const transaction = await createTransaction({
  accountId: 'account-1',
  date: new Date(),
  amount: -50.00,
  currency: 'USD',
  description: 'Grocery shopping',
  merchant: 'Walmart',
  categoryId: 'category-food'
})
```

#### `updateTransaction(id: string, data: Partial<Transaction>): Promise<void>`
Updates an existing transaction with optimistic updates and rollback.

```typescript
const { updateTransaction } = useTransactionsStore()
await updateTransaction('transaction-1', {
  categoryId: 'new-category',
  description: 'Updated description'
})
```

#### `deleteTransaction(id: string): Promise<void>`
Deletes a transaction with optimistic updates.

#### `bulkUpdateTransactions(ids: string[], data: Partial<Transaction>): Promise<void>`
Updates multiple transactions in a single operation.

#### `bulkDeleteTransactions(ids: string[]): Promise<void>`
Deletes multiple transactions efficiently.

### Filter Actions

#### `setFilters(filters: Partial<TransactionsStore['filters']>): void`
Updates the current filter criteria.

```typescript
const { setFilters } = useTransactionsStore()
setFilters({
  accountId: 'account-1',
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  }
})
```

#### `clearFilters(): void`
Resets all filters to empty state.

### Selectors

#### `getTransactionById(id: string): Transaction | undefined`
Retrieves a specific transaction by ID.

#### `getFilteredTransactions(): Transaction[]`
Returns transactions matching current filter criteria.

```typescript
const { getFilteredTransactions } = useTransactionsStore()
const filteredTransactions = getFilteredTransactions()
```

#### `getSpendingByCategory(start: Date, end: Date): Promise<Array<{ categoryId: string; amount: number }>>`
Analyzes spending by category for a date range.

#### `getCashflow(start: Date, end: Date): Promise<{ income: number; expenses: number; net: number }>`
Calculates cashflow metrics for a date range.

### Usage Examples

```typescript
// Basic usage in a component
function TransactionList() {
  const { 
    transactions, 
    isLoading, 
    error, 
    fetchTransactions,
    getFilteredTransactions 
  } = useTransactionsStore()
  
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])
  
  const filteredTransactions = getFilteredTransactions()
  
  if (isLoading) return <Loading />
  if (error) return <Error message={error} />
  
  return (
    <div>
      {filteredTransactions.map(transaction => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  )
}
```

## Accounts Store

Manages financial accounts and their balances.

### State Shape

```typescript
interface AccountsStore {
  accounts: Account[]
  isLoading: boolean
  error: string | null
}
```

### Actions

#### `fetchAccounts(): Promise<void>`
Loads all accounts from the database.

#### `createAccount(data: Omit<Account, 'id' | 'createdAt'>): Promise<Account>`
Creates a new account.

```typescript
const { createAccount } = useAccountsStore()
const account = await createAccount({
  name: 'Checking Account',
  type: 'checking',
  currency: 'USD',
  balance: 1000.00
})
```

#### `updateAccount(id: string, data: Partial<Account>): Promise<void>`
Updates account details with optimistic updates.

#### `archiveAccount(id: string): Promise<void>`
Archives an account (soft delete).

#### `deleteAccount(id: string): Promise<void>`
Permanently deletes an account (only if no transactions).

#### `setDefaultAccount(id: string): Promise<void>`
Sets an account as the default for new transactions.

### Selectors

#### `getAccountById(id: string): Account | undefined`
Retrieves a specific account by ID.

#### `getActiveAccounts(): Account[]`
Returns only non-archived accounts.

#### `getTotalBalance(): number`
Calculates total balance across all active accounts.

```typescript
const { getActiveAccounts, getTotalBalance } = useAccountsStore()
const activeAccounts = getActiveAccounts()
const totalBalance = getTotalBalance()
```

## Budgets Store

Manages budget allocations and tracking.

### State Shape

```typescript
interface BudgetsStore {
  budgets: Budget[]
  isLoading: boolean
  error: string | null
}
```

### Actions

#### `fetchBudgets(): Promise<void>`
Loads all budgets from the database.

#### `createBudget(data: Omit<Budget, 'id'>): Promise<Budget>`
Creates a new budget allocation.

```typescript
const { createBudget } = useBudgetsStore()
const budget = await createBudget({
  categoryId: 'category-food',
  month: '2024-01',
  amount: 500.00,
  carryStrategy: 'carryUnspent'
})
```

#### `updateBudget(id: string, data: Partial<Budget>): Promise<void>`
Updates budget settings with optimistic updates.

#### `deleteBudget(id: string): Promise<void>`
Removes a budget allocation.

#### `setBudgetForCategory(categoryId: string, month: string, amount: number, carryStrategy: Budget['carryStrategy']): Promise<void>`
Convenience method to set or update a budget for a specific category and month.

### Selectors

#### `getBudgetById(id: string): Budget | undefined`
Retrieves a specific budget by ID.

#### `getBudgetsForMonth(month: string): Budget[]`
Returns all budgets for a specific month.

#### `getBudgetForCategoryAndMonth(categoryId: string, month: string): Budget | undefined`
Finds a specific budget by category and month.

#### `getBudgetLedger(categoryId: string, month: string): Promise<BudgetLedger>`
Calculates detailed budget performance including carryovers.

```typescript
const { getBudgetLedger } = useBudgetsStore()
const ledger = await getBudgetLedger('category-food', '2024-01')
console.log(ledger.remaining) // Remaining budget amount
```

## Categories Store

Manages transaction categories and hierarchy.

### State Shape

```typescript
interface CategoriesStore {
  categories: Category[]
  isLoading: boolean
  error: string | null
}
```

### Actions

#### `fetchCategories(): Promise<void>`
Loads all categories from the database.

#### `createCategory(data: Omit<Category, 'id'>): Promise<Category>`
Creates a new category.

```typescript
const { createCategory } = useCategoriesStore()
const category = await createCategory({
  name: 'Groceries',
  icon: '🛒',
  color: '#10b981',
  parentId: 'category-food' // Optional parent for subcategory
})
```

#### `updateCategory(id: string, data: Partial<Category>): Promise<void>`
Updates category details.

#### `deleteCategory(id: string): Promise<void>`
Deletes a category (only if no transactions or budgets).

### Selectors

#### `getCategoryById(id: string): Category | undefined`
Retrieves a specific category by ID.

#### `getTopLevelCategories(): Category[]`
Returns categories without parents.

#### `getSubcategories(parentId: string): Category[]`
Returns child categories of a parent.

#### `getCategoryHierarchy(): CategoryNode[]`
Returns full category tree structure.

```typescript
interface CategoryNode extends Category {
  children: CategoryNode[]
}
```

## Rules Store

Manages automation rules for transaction categorization.

### State Shape

```typescript
interface RulesStore {
  rules: Rule[]
  isLoading: boolean
  error: string | null
}
```

### Actions

#### `fetchRules(): Promise<void>`
Loads all rules from the database.

#### `createRule(data: Omit<Rule, 'id'>): Promise<Rule>`
Creates a new automation rule.

```typescript
const { createRule } = useRulesStore()
const rule = await createRule({
  name: 'Walmart Groceries',
  enabled: true,
  priority: 1,
  conditions: [{
    field: 'merchant',
    op: 'eq',
    value: 'Walmart'
  }],
  actions: [{
    setCategoryId: 'category-groceries'
  }],
  stopProcessing: false
})
```

#### `updateRule(id: string, data: Partial<Rule>): Promise<void>`
Updates rule configuration.

#### `deleteRule(id: string): Promise<void>`
Removes an automation rule.

#### `reorderRules(ruleIds: string[]): Promise<void>`
Updates rule priority order.

### Selectors

#### `getRuleById(id: string): Rule | undefined`
Retrieves a specific rule by ID.

#### `getEnabledRules(): Rule[]`
Returns only enabled rules sorted by priority.

#### `applyRulesToTransaction(transaction: Transaction): Partial<Transaction>`
Applies matching rules to a transaction and returns modifications.

## Subscriptions Store

Manages recurring payment tracking.

### State Shape

```typescript
interface SubscriptionsStore {
  subscriptions: Subscription[]
  isLoading: boolean
  error: string | null
}
```

### Actions

#### `fetchSubscriptions(): Promise<void>`
Loads all subscriptions from the database.

#### `createSubscription(data: Omit<Subscription, 'id'>): Promise<Subscription>`
Creates a new subscription.

```typescript
const { createSubscription } = useSubscriptionsStore()
const subscription = await createSubscription({
  name: 'Netflix',
  cadence: 'monthly',
  amount: 15.99,
  currency: 'USD',
  nextDueDate: new Date('2024-02-01'),
  accountId: 'account-1',
  categoryId: 'category-entertainment'
})
```

#### `updateSubscription(id: string, data: Partial<Subscription>): Promise<void>`
Updates subscription details.

#### `deleteSubscription(id: string): Promise<void>`
Removes a subscription.

### Selectors

#### `getSubscriptionById(id: string): Subscription | undefined`
Retrieves a specific subscription by ID.

#### `getUpcomingSubscriptions(days: number): Subscription[]`
Returns subscriptions due within specified days.

#### `getTotalMonthlyAmount(): number`
Calculates total monthly subscription cost.

```typescript
const { getUpcomingSubscriptions, getTotalMonthlyAmount } = useSubscriptionsStore()
const upcoming = getUpcomingSubscriptions(7) // Next 7 days
const monthlyTotal = getTotalMonthlyAmount()
```

## Settings Store

Manages user preferences and configuration.

### State Shape

```typescript
interface SettingsStore {
  profile: ProfileSettings
  appearance: AppearanceSettings
  notifications: NotificationSettings
  privacy: PrivacySettings
  currency: CurrencySettings
  budget: BudgetSettings
  transaction: TransactionSettings
  data: DataSettings
  advanced: AdvancedSettings
  searchTerm: string
}
```

### Actions

#### Update Methods
Each settings section has its own update method:

```typescript
const { 
  updateProfile,
  updateAppearance,
  updateNotifications,
  updatePrivacy,
  updateCurrency,
  updateBudget,
  updateTransaction,
  updateData,
  updateAdvanced
} = useSettingsStore()

// Update appearance settings
updateAppearance({
  theme: 'dark',
  accentColor: '#3b82f6',
  fontSize: 'large'
})
```

#### `resetAllSettings(): void`
Resets all settings to default values.

#### `exportSettings(): AllSettings`
Exports current settings for backup.

#### `importSettings(settings: Partial<AllSettings>): void`
Imports settings from backup.

#### `setSearchTerm(term: string): void`
Updates search filter for settings.

### Settings Sections

#### Profile Settings
```typescript
interface ProfileSettings {
  name: string
  email: string
  avatar?: string
  subscriptionStatus: 'free' | 'premium'
}
```

#### Appearance Settings
```typescript
interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  fontSize: 'small' | 'medium' | 'large'
  viewDensity: 'compact' | 'comfortable' | 'spacious'
  showBalance: boolean
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  numberFormat: 'us' | 'eu' | 'uk' | 'ca'
}
```

#### Currency Settings
```typescript
interface CurrencySettings {
  primaryCurrency: string
  multiCurrencySupport: boolean
  language: string
  region: string
  firstDayOfWeek: 'monday' | 'sunday'
  fiscalYearStart: string // MM-DD format
}
```

## UI Store

Manages interface state, theming, and notifications.

### State Shape

```typescript
interface UIStore {
  theme: 'light' | 'dark' | 'system'
  tourProgress: {
    completed: boolean
    currentStep?: number
  }
  toasts: Toast[]
  isLoading: boolean
}
```

### Actions

#### Theme Management
```typescript
const { setTheme, toggleTheme } = useUIStore()

setTheme('dark')
toggleTheme() // Switches between light and dark
```

#### Toast Notifications
```typescript
const { addToast, removeToast, clearToasts } = useUIStore()

addToast({
  type: 'success',
  title: 'Transaction saved',
  description: 'Your transaction has been saved successfully',
  duration: 5000
})
```

#### Convenience Toast Functions
```typescript
import { toast } from '@/stores'

toast.success('Operation completed')
toast.error('Something went wrong')
toast.warning('Please check your input')
toast.info('New feature available')
```

#### Tour Management
```typescript
const { startTour, completeTour, setTourStep } = useUIStore()

startTour() // Begin onboarding tour
setTourStep(2) // Go to specific step
completeTour() // Mark tour as completed
```

#### Loading State
```typescript
const { setIsLoading } = useUIStore()

setIsLoading(true) // Show global loading indicator
setIsLoading(false) // Hide loading indicator
```

## Store Initialization

All stores are initialized together during application startup:

```typescript
import { useInitializeStores } from '@/stores'

function App() {
  const { initializeStores } = useInitializeStores()
  
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeStores()
      } catch (error) {
        console.error('Failed to initialize stores:', error)
      }
    }
    
    initialize()
  }, [initializeStores])
  
  return <AppContent />
}
```

## Best Practices

### Store Usage
1. **Selective Subscriptions**: Only subscribe to the data you need
2. **Error Handling**: Always check for error states
3. **Loading States**: Show loading indicators during async operations
4. **Optimistic Updates**: Trust the store's optimistic update patterns

### Performance Tips
1. Use selectors for computed values to avoid unnecessary re-renders
2. Memoize expensive operations with `useMemo`
3. Use `React.memo` for components that don't need frequent updates
4. Avoid subscribing to entire store state when only partial data is needed

### Example: Optimized Component
```typescript
import { memo } from 'react'
import { useTransactionsStore } from '@/stores'

const TransactionItem = memo(({ transactionId }: { transactionId: string }) => {
  // Only subscribe to the specific transaction
  const transaction = useTransactionsStore(
    state => state.getTransactionById(transactionId)
  )
  
  if (!transaction) return null
  
  return <div>{transaction.description}</div>
})
```