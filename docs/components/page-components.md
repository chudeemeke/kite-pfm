# Page Components Documentation

This document provides detailed documentation for the page-level components that serve as the main route handlers in the Kite Personal Finance Manager.

## Table of Contents

1. [Home (Dashboard)](#home-dashboard)
2. [Activity (Transactions)](#activity-transactions)
3. [Budgets](#budgets)
4. [Accounts](#accounts)
5. [AccountDetail](#accountdetail)
6. [Insights](#insights)
7. [Settings](#settings)

---

## Home (Dashboard)

The main dashboard providing an overview of the user's financial status.

**File**: `src/pages/Home.tsx`

### Features

- **Financial Overview**: Net worth display with privacy mode support
- **Quick Stats**: Income, expenses, and balance summaries
- **Recent Activity**: Latest transactions preview
- **Budget Status**: Current month budget overview
- **Account Summaries**: Balance totals by account type
- **Loading States**: Graceful loading and error handling

### Data Dependencies

```typescript
// Store integrations
const { accounts, getTotalBalance, isLoading: accountsLoading, error: accountsError, fetchAccounts } = useAccountsStore()
const { isLoading: transactionsLoading, error: transactionsError, fetchTransactions } = useTransactionsStore()
const { privacy } = useSettingsStore()
```

### Key Components Used

- `LoadingSpinner` - Loading states
- `formatCurrency` - Currency formatting with privacy mode
- `AlertCircle` - Error state indicators
- `TrendingUp/TrendingDown` - Trend indicators

### State Management

```typescript
const [netWorth, setNetWorth] = useState(0)

useEffect(() => {
  setNetWorth(getTotalBalance())
}, [accounts, getTotalBalance])
```

### Error Handling

```typescript
if (hasError) {
  return (
    <div className="p-4">
      <div className="card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Error Loading Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {accountsError || transactionsError}
        </p>
        <div className="flex gap-2 justify-center">
          {accountsError && (
            <button onClick={() => fetchAccounts()} className="btn-primary">
              Retry Accounts
            </button>
          )}
          {transactionsError && (
            <button onClick={() => fetchTransactions()} className="btn-primary">
              Retry Transactions
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### Privacy Mode Integration

```typescript
<p className={`text-3xl font-bold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
  {formatCurrency(netWorth)}
</p>
```

### Responsive Design

- **Mobile-first layout**: Optimized for mobile screens
- **Grid system**: Responsive grid for quick stats
- **Card-based design**: Consistent card components
- **Touch-friendly**: Appropriate touch targets

---

## Activity (Transactions)

Transaction management page with search, filtering, and bulk operations.

**File**: `src/pages/Activity.tsx`

### Features

- **Transaction List**: Paginated transaction history
- **Advanced Search**: Text search across description and merchant
- **Multi-level Filtering**: Date range, amount range, account, category, transaction type
- **Bulk Operations**: Multi-select for bulk actions
- **Inline Editing**: Edit transactions directly in the list
- **Real-time Updates**: Live updates when transactions change

### Data Dependencies

```typescript
const { 
  transactions, 
  isLoading, 
  error, 
  fetchTransactions, 
  updateTransaction, 
  deleteTransaction,
  filters,
  setFilters,
  getFilteredTransactions
} = useTransactionsStore()

const { getCategoryById, fetchCategories, categories } = useCategoriesStore()
const { getAccountById, fetchAccounts, accounts } = useAccountsStore()
```

### State Management

```typescript
// Local state for UI interactions
const [searchTerm, setSearchTerm] = useState('')
const [showFilters, setShowFilters] = useState(false)
const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
const [editingTransaction, setEditingTransaction] = useState<any>(null)
const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; transactionId: string | null }>({ isOpen: false, transactionId: null })

// Filter state
const [dateRange, setDateRange] = useState({ start: '', end: '' })
const [amountRange, setAmountRange] = useState({ min: '', max: '' })
const [selectedAccount, setSelectedAccount] = useState('')
const [selectedCategory, setSelectedCategory] = useState('')
const [transactionType, setTransactionType] = useState<'all' | 'income' | 'expense'>('all')
```

### Advanced Filtering

```typescript
// Apply filters with real-time updates
useEffect(() => {
  const newFilters: any = {}
  
  if (searchTerm) newFilters.searchTerm = searchTerm
  if (selectedAccount) newFilters.accountId = selectedAccount
  if (selectedCategory) newFilters.categoryId = selectedCategory
  if (dateRange.start && dateRange.end) {
    newFilters.dateRange = {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end)
    }
  }
  
  setFilters(newFilters)
}, [searchTerm, selectedAccount, selectedCategory, dateRange, setFilters])

// Complex filtering with memoization
const filteredTransactions = useMemo(() => {
  let filtered = getFilteredTransactions()
  
  // Apply amount range filter
  if (amountRange.min || amountRange.max) {
    filtered = filtered.filter(t => {
      const amount = Math.abs(t.amount)
      const min = amountRange.min ? parseFloat(amountRange.min) : 0
      const max = amountRange.max ? parseFloat(amountRange.max) : Infinity
      return amount >= min && amount <= max
    })
  }
  
  // Apply transaction type filter
  if (transactionType !== 'all') {
    filtered = filtered.filter(t => {
      if (transactionType === 'income') return t.amount > 0
      if (transactionType === 'expense') return t.amount < 0
      return true
    })
  }
  
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}, [getFilteredTransactions, amountRange, transactionType])
```

### Filter Interface

```typescript
interface FilterOptions {
  searchTerm?: string
  accountId?: string
  categoryId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  amountRange?: {
    min: number
    max: number
  }
  transactionType?: 'all' | 'income' | 'expense'
}
```

### Bulk Operations

```typescript
// Multi-select functionality
const handleSelectTransaction = (transactionId: string) => {
  setSelectedTransactions(prev => 
    prev.includes(transactionId)
      ? prev.filter(id => id !== transactionId)
      : [...prev, transactionId]
  )
}

const handleSelectAll = () => {
  setSelectedTransactions(
    selectedTransactions.length === filteredTransactions.length
      ? []
      : filteredTransactions.map(t => t.id)
  )
}

// Bulk actions
const handleBulkDelete = async () => {
  for (const transactionId of selectedTransactions) {
    await deleteTransaction(transactionId)
  }
  setSelectedTransactions([])
  toast.success('Transactions deleted', `${selectedTransactions.length} transactions removed`)
}
```

### Inline Editing

```typescript
const handleInlineEdit = (transaction: Transaction) => {
  setEditingTransaction(transaction)
}

const handleSaveEdit = async (updatedTransaction: Transaction) => {
  try {
    await updateTransaction(updatedTransaction.id, updatedTransaction)
    setEditingTransaction(null)
    toast.success('Transaction updated')
  } catch (error) {
    toast.error('Failed to update transaction')
  }
}
```

### Accessibility Features

- Keyboard navigation for transaction list
- Screen reader announcements for filter changes
- ARIA labels for bulk selection checkboxes
- Focus management for inline editing

---

## Budgets

Budget management page with ledger system and carryover strategies.

**File**: `src/pages/Budgets.tsx`

### Features

- **Monthly Budget View**: Navigate between months
- **Budget Cards**: Visual budget progress with spending indicators
- **Carryover Strategies**: Flexible budget carryover rules
- **Budget Ledger**: Detailed transaction breakdown
- **Smart Alerts**: Overspending and threshold warnings
- **Category Integration**: Budget assignment to categories

### Data Dependencies

```typescript
const { 
  budgets, 
  isLoading, 
  error, 
  fetchBudgets, 
  setBudgetForCategory, 
  deleteBudget,
  getBudgetForCategoryMonth 
} = useBudgetsStore()

const { categories, fetchCategories } = useCategoriesStore()
const { transactions, fetchTransactions } = useTransactionsStore()
const { privacy } = useSettingsStore()
```

### Month Navigation

```typescript
const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'))

const navigateMonth = (direction: 'prev' | 'next') => {
  const date = new Date(currentMonth + '-01')
  if (direction === 'prev') {
    date.setMonth(date.getMonth() - 1)
  } else {
    date.setMonth(date.getMonth() + 1)
  }
  setCurrentMonth(format(date, 'yyyy-MM'))
}
```

### Budget Card Component

```typescript
interface BudgetCardProps {
  budget: Budget
  ledger: BudgetLedger
  categoryName: string
  categoryColor: string
  onEdit: (budget: Budget) => void
  onDelete: (budgetId: string) => void
  privacyMode?: boolean
}

const BudgetCard = ({ budget, ledger, categoryName, categoryColor, onEdit, onDelete, privacyMode }: BudgetCardProps) => {
  const progress = ledger.totalBudgeted > 0 ? (ledger.totalSpent / ledger.totalBudgeted) * 100 : 0
  const isOverspent = ledger.totalSpent > ledger.totalBudgeted
  const remaining = ledger.totalBudgeted - ledger.totalSpent
  
  const getProgressColor = () => {
    if (isOverspent) return 'bg-danger-500'
    if (progress > 80) return 'bg-warning-500'
    return 'bg-success-500'
  }
  
  const getStatusIcon = () => {
    if (isOverspent) return <AlertTriangle className="w-4 h-4 text-danger-500" />
    if (progress > 80) return <AlertTriangle className="w-4 h-4 text-warning-500" />
    return <TrendingUp className="w-4 h-4 text-success-500" />
  }
  
  // Component JSX...
}
```

### Budget Ledger System

```typescript
interface BudgetLedger {
  categoryId: string
  month: string
  entries: BudgetLedgerEntry[]
  totalBudgeted: number
  totalSpent: number
  totalCarriedIn: number
  totalCarriedOut: number
  remaining: number
}

interface BudgetLedgerEntry {
  type: 'carryIn' | 'carryOut' | 'spent' | 'budgeted'
  amount: number
  description: string
  date: Date
}
```

### Carryover Strategies

```typescript
type CarryStrategy = 'carryNone' | 'carryUnspent' | 'carryOverspend'

const applyCarryoverStrategy = (budget: Budget, ledger: BudgetLedger) => {
  switch (budget.carryStrategy) {
    case 'carryUnspent':
      // Carry forward unspent amounts to next month
      if (ledger.remaining > 0) {
        return { carryAmount: ledger.remaining, type: 'carryIn' }
      }
      break
    
    case 'carryOverspend':
      // Carry forward overspent amounts as debt
      if (ledger.remaining < 0) {
        return { carryAmount: Math.abs(ledger.remaining), type: 'carryOut' }
      }
      break
    
    case 'carryNone':
    default:
      // No carryover
      return null
  }
}
```

### Budget Progress Visualization

```typescript
const renderProgressBar = (progress: number, isOverspent: boolean) => (
  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
    <div
      className={`h-2 rounded-full transition-all duration-300 ${
        isOverspent ? 'bg-danger-500' : progress > 80 ? 'bg-warning-500' : 'bg-success-500'
      }`}
      style={{ width: `${Math.min(progress, 100)}%` }}
    />
    {progress > 100 && (
      <div className="absolute inset-0 bg-danger-500 rounded-full animate-pulse opacity-50" />
    )}
  </div>
)
```

### Smart Budget Alerts

```typescript
const checkBudgetAlerts = (ledger: BudgetLedger) => {
  const progress = (ledger.totalSpent / ledger.totalBudgeted) * 100
  
  if (progress >= 100) {
    return {
      type: 'danger',
      message: 'Budget exceeded!',
      icon: AlertTriangle
    }
  } else if (progress >= 80) {
    return {
      type: 'warning',
      message: 'Approaching budget limit',
      icon: AlertTriangle
    }
  }
  
  return null
}
```

---

## Accounts

Account management page with account operations and transaction filtering.

**File**: `src/pages/Accounts.tsx`

### Features

- **Account Overview**: List of all accounts with balances
- **Account Actions**: Edit, archive, delete, set as default
- **Quick Filters**: Filter transactions by account
- **Account Types**: Support for multiple account types
- **Balance Tracking**: Real-time balance calculations
- **Default Account**: Mark primary account for transactions

### Data Dependencies

```typescript
const { 
  accounts, 
  isLoading, 
  error, 
  fetchAccounts, 
  updateAccount, 
  archiveAccount, 
  deleteAccount 
} = useAccountsStore()

const { setFilters } = useTransactionsStore()
const { privacy } = useSettingsStore()
```

### Account Types

```typescript
type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'loan' | 'other'

const getAccountTypeIcon = (type: AccountType) => {
  switch (type) {
    case 'checking': return <CreditCard className="w-5 h-5 text-blue-500" />
    case 'savings': return <PiggyBank className="w-5 h-5 text-green-500" />
    case 'credit': return <CreditCard className="w-5 h-5 text-red-500" />
    case 'investment': return <TrendingUp className="w-5 h-5 text-purple-500" />
    case 'cash': return <Banknote className="w-5 h-5 text-yellow-500" />
    case 'loan': return <ArrowDownCircle className="w-5 h-5 text-orange-500" />
    default: return <Wallet className="w-5 h-5 text-gray-500" />
  }
}
```

### Account Actions

```typescript
const handleSetAsDefault = async (accountId: string) => {
  try {
    await useAccountsStore.getState().setDefaultAccount(accountId)
    await useSettingsStore.getState().updateBudget({ defaultAccountId: accountId })
    toast.success('Default account updated', 'This account is now your default')
    setOpenDropdown(null)
  } catch (error) {
    toast.error('Failed to set default account', 'Please try again')
  }
}

const handleViewTransactions = (accountId: string, accountName: string) => {
  setFilters({ accountId })
  navigate('/activity')
  setOpenDropdown(null)
  toast.info(`Viewing transactions`, `Showing transactions for ${accountName}`)
}

const handleArchive = async (accountId: string, accountName: string) => {
  try {
    await archiveAccount(accountId)
    toast.success('Account archived', `${accountName} has been archived`)
    setOpenDropdown(null)
  } catch (error) {
    toast.error('Failed to archive account', 'Please try again')
  }
}
```

### Balance Calculations

```typescript
const calculateAccountBalance = (accountId: string) => {
  const accountTransactions = transactions.filter(t => t.accountId === accountId)
  return accountTransactions.reduce((sum, t) => sum + t.amount, 0)
}

const getTotalsByType = () => {
  const totals = accounts.reduce((acc, account) => {
    const balance = calculateAccountBalance(account.id)
    acc[account.type] = (acc[account.type] || 0) + balance
    return acc
  }, {} as Record<AccountType, number>)
  
  return totals
}
```

### Account Card Component

```typescript
interface AccountCardProps {
  account: Account
  balance: number
  isDefault: boolean
  onEdit: (account: Account) => void
  onDelete: (accountId: string) => void
  onSetDefault: (accountId: string) => void
  onViewTransactions: (accountId: string, accountName: string) => void
  privacyMode?: boolean
}
```

---

## AccountDetail

Detailed view for individual accounts with transaction history and analytics.

**File**: `src/pages/AccountDetail.tsx`

### Features

- **Account Overview**: Detailed account information
- **Transaction History**: Account-specific transaction list
- **Balance Trends**: Historical balance visualization
- **Account Analytics**: Spending patterns and insights
- **Quick Actions**: Transfer, edit, archive account

### URL Parameters

```typescript
// Route: /accounts/:accountId
const { accountId } = useParams<{ accountId: string }>()
```

### Data Loading

```typescript
const [account, setAccount] = useState<Account | null>(null)
const [accountTransactions, setAccountTransactions] = useState<Transaction[]>([])

useEffect(() => {
  if (accountId) {
    const accountData = getAccountById(accountId)
    setAccount(accountData)
    
    const transactions = getTransactionsByAccount(accountId)
    setAccountTransactions(transactions)
  }
}, [accountId, getAccountById, getTransactionsByAccount])
```

---

## Insights

Analytics and reporting page with charts and financial insights.

**File**: `src/pages/Insights.tsx`

### Features

- **Spending Analytics**: Category breakdowns and trends
- **Income vs Expenses**: Cashflow visualization
- **Net Worth Tracking**: Historical net worth progression
- **Budget Performance**: Budget vs actual spending analysis
- **Custom Date Ranges**: Flexible time period selection
- **Export Options**: Export charts and data

### Chart Components Used

```typescript
import { SpendingByCategory, CashflowChart, NetWorthChart } from '@/components/Charts'
```

### Data Aggregation

```typescript
const aggregateSpendingByCategory = (transactions: Transaction[], categories: Category[]) => {
  const spending = transactions
    .filter(t => t.amount < 0) // Only expenses
    .reduce((acc, t) => {
      const categoryId = t.categoryId || 'uncategorized'
      acc[categoryId] = (acc[categoryId] || 0) + Math.abs(t.amount)
      return acc
    }, {} as Record<string, number>)
  
  return Object.entries(spending).map(([categoryId, amount]) => {
    const category = categories.find(c => c.id === categoryId)
    return {
      name: category?.name || 'Uncategorized',
      value: amount,
      color: category?.color || '#gray-500'
    }
  })
}
```

### Time Period Selection

```typescript
type TimePeriod = '7d' | '30d' | '90d' | '1y' | 'custom'

const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d')
const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })

const getDateRange = (period: TimePeriod) => {
  const now = new Date()
  switch (period) {
    case '7d':
      return { start: subDays(now, 7), end: now }
    case '30d':
      return { start: subDays(now, 30), end: now }
    case '90d':
      return { start: subDays(now, 90), end: now }
    case '1y':
      return { start: subYears(now, 1), end: now }
    case 'custom':
      return {
        start: new Date(customDateRange.start),
        end: new Date(customDateRange.end)
      }
  }
}
```

---

## Settings

Application configuration and preferences page.

**File**: `src/pages/Settings.tsx`

### Features

- **User Preferences**: Theme, currency, date format
- **Privacy Settings**: Privacy mode, data visibility
- **Data Management**: Export, import, backup settings
- **Account Settings**: Default account, notifications
- **App Information**: Version, storage usage, help

### Settings Categories

```typescript
interface SettingsCategory {
  title: string
  description?: string
  items: SettingsItem[]
}

interface SettingsItem {
  key: string
  title: string
  description?: string
  type: 'toggle' | 'select' | 'slider' | 'button' | 'color'
  value?: any
  options?: Array<{ value: string; label: string }>
  onChange?: (value: any) => void
  onClick?: () => void
}
```

### Settings Structure

```typescript
const settingsCategories: SettingsCategory[] = [
  {
    title: 'Appearance',
    description: 'Customize the look and feel',
    items: [
      {
        key: 'theme',
        title: 'Theme',
        description: 'Choose your preferred color scheme',
        type: 'select',
        value: theme,
        options: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' }
        ],
        onChange: setTheme
      },
      {
        key: 'accentColor',
        title: 'Accent Color',
        description: 'Primary color for buttons and highlights',
        type: 'color',
        value: accentColor,
        onChange: setAccentColor
      }
    ]
  },
  {
    title: 'Privacy & Security',
    description: 'Control your data visibility and security',
    items: [
      {
        key: 'privacyMode',
        title: 'Privacy Mode',
        description: 'Hide sensitive financial information',
        type: 'toggle',
        value: privacyMode,
        onChange: setPrivacyMode
      },
      {
        key: 'biometricAuth',
        title: 'Biometric Authentication',
        description: 'Use fingerprint or face recognition',
        type: 'toggle',
        value: biometricAuth,
        onChange: setBiometricAuth
      }
    ]
  }
]
```

### Settings Component Integration

```typescript
import { SettingsItem, ToggleSwitch, SelectDropdown, ColorPicker, Slider } from '@/components/settings'

const renderSettingItem = (item: SettingsItem) => {
  const renderControl = () => {
    switch (item.type) {
      case 'toggle':
        return (
          <ToggleSwitch
            checked={item.value}
            onChange={item.onChange}
          />
        )
      case 'select':
        return (
          <SelectDropdown
            value={item.value}
            onChange={item.onChange}
            options={item.options}
          />
        )
      case 'color':
        return (
          <ColorPicker
            value={item.value}
            onChange={item.onChange}
          />
        )
      case 'slider':
        return (
          <Slider
            value={item.value}
            onChange={item.onChange}
            min={item.min}
            max={item.max}
            step={item.step}
          />
        )
      default:
        return null
    }
  }

  return (
    <SettingsItem
      key={item.key}
      title={item.title}
      description={item.description}
    >
      {renderControl()}
    </SettingsItem>
  )
}
```

---

## Common Page Patterns

### Loading States

```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  )
}
```

### Error States

```typescript
if (hasError) {
  return (
    <div className="p-4">
      <div className="card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Error Loading Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={retry} className="btn-primary">
          Retry
        </button>
      </div>
    </div>
  )
}
```

### Empty States

```typescript
const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📊</div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
      {title}
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mb-6">
      {description}
    </p>
    {action && (
      <button onClick={action.onClick} className="btn-primary">
        {action.label}
      </button>
    )}
  </div>
)
```

### Data Refresh Pattern

```typescript
const useDataRefresh = (fetchFunctions: Array<() => Promise<void>>) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all(fetchFunctions.map(fn => fn()))
      toast.success('Data refreshed')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchFunctions])
  
  return { isRefreshing, refresh }
}
```

---

## Navigation Integration

### Route Configuration

```typescript
// App.tsx route configuration
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/activity" element={<Activity />} />
  <Route path="/budgets" element={<Budgets />} />
  <Route path="/accounts" element={<Accounts />} />
  <Route path="/accounts/:accountId" element={<AccountDetail />} />
  <Route path="/insights" element={<Insights />} />
  <Route path="/settings" element={<Settings />} />
</Routes>
```

### Navigation Helpers

```typescript
const usePageNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const goToAccount = (accountId: string) => {
    navigate(`/accounts/${accountId}`)
  }
  
  const goToTransactions = (filters?: TransactionFilters) => {
    if (filters) {
      // Set filters in store before navigation
      useTransactionsStore.getState().setFilters(filters)
    }
    navigate('/activity')
  }
  
  const getCurrentPage = () => {
    return location.pathname.split('/')[1] || 'home'
  }
  
  return { goToAccount, goToTransactions, getCurrentPage }
}
```

---

## Performance Optimizations

### Code Splitting

```typescript
// Lazy load page components
const Home = lazy(() => import('./pages/Home'))
const Activity = lazy(() => import('./pages/Activity'))
const Budgets = lazy(() => import('./pages/Budgets'))
const Accounts = lazy(() => import('./pages/Accounts'))
const Insights = lazy(() => import('./pages/Insights'))
const Settings = lazy(() => import('./pages/Settings'))

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner size="lg" />}>
  <Routes>
    <Route path="/" element={<Home />} />
    {/* Other routes */}
  </Routes>
</Suspense>
```

### Data Optimization

```typescript
// Memoize expensive calculations
const expensiveData = useMemo(() => {
  return processLargeDataset(transactions, categories, accounts)
}, [transactions, categories, accounts])

// Debounce search inputs
const debouncedSearch = useDebounce(searchTerm, 300)

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch)
  }
}, [debouncedSearch])
```

### Virtual Scrolling

```typescript
// For large transaction lists
import { FixedSizeList as List } from 'react-window'

const TransactionList = ({ transactions }: TransactionListProps) => (
  <List
    height={600}
    itemCount={transactions.length}
    itemSize={60}
    itemData={transactions}
  >
    {TransactionRow}
  </List>
)
```

This documentation provides a comprehensive overview of all page components in the Kite application, including their features, data dependencies, state management patterns, and integration points. Each page component follows consistent patterns for loading states, error handling, and user interactions while providing unique functionality specific to their domain.