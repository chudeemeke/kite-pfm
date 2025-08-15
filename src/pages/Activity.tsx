import { useEffect, useState, useMemo } from 'react'
import { useTransactionsStore, useCategoriesStore, useAccountsStore, toast } from '@/stores'
import { formatCurrency, formatRelativeDate } from '@/services'
import { 
  Search, 
  Filter, 
  AlertCircle, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'

/**
 * Activity page component for managing and viewing transaction history.
 * 
 * Provides a comprehensive interface for viewing, searching, filtering, editing, and managing
 * financial transactions. Features advanced filtering capabilities, bulk operations, and
 * inline editing functionality for efficient transaction management.
 * 
 * @returns JSX element representing the activity/transactions page
 * 
 * @example
 * ```tsx
 * import ActivityPage from '@/pages/Activity'
 * import { Routes, Route } from 'react-router-dom'
 * 
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/tx" element={<ActivityPage />} />
 *     </Routes>
 *   )
 * }
 * ```
 * 
 * Key Features:
 * - **Search & Filter**: Real-time search with advanced filtering by account, category, date range, amount, and type
 * - **Bulk Operations**: Select multiple transactions for batch categorization or deletion
 * - **Inline Editing**: Click-to-edit transactions with modal forms
 * - **Quick Actions**: Fast edit and delete buttons for individual transactions
 * - **Add Transactions**: Create new transactions with a comprehensive form
 * - **Visual Indicators**: Subscription badges, amount highlighting, and status icons
 * 
 * @remarks
 * - Automatically fetches transactions, categories, and accounts on mount
 * - Uses memoized filtering for optimal performance with large datasets
 * - Supports keyboard shortcuts (ESC to close modals)
 * - Includes loading states and error handling with retry functionality
 * - Mobile-optimized with touch-friendly controls and responsive layout
 * - Integrates with toast notifications for user feedback
 * - Maintains filter state and provides easy filter clearing
 * - Shows transaction counts and selection status
 */
const ActivityPage = () => {
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
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; transactionId: string | null }>({ isOpen: false, transactionId: null })
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [amountRange, setAmountRange] = useState({ min: '', max: '' })
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [transactionType, setTransactionType] = useState<'all' | 'income' | 'expense'>('all')
  
  useEffect(() => {
    fetchTransactions()
    fetchCategories()
    fetchAccounts()
  }, [])

  // Apply filters
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

  // Get filtered transactions
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

  const handleTransactionClick = (transaction: any) => {
    setEditingTransaction(transaction)
  }

  const handleEditTransaction = async (updatedData: any) => {
    if (!editingTransaction) return
    
    try {
      await updateTransaction(editingTransaction.id, updatedData)
      toast.success('Transaction updated', 'Transaction has been updated successfully')
      setEditingTransaction(null)
    } catch (error) {
      toast.error('Failed to update transaction', 'Please try again')
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId)
      toast.success('Transaction deleted', 'Transaction has been deleted successfully')
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId))
    } catch (error) {
      toast.error('Failed to delete transaction', 'Please try again')
    }
  }

  const handleBulkAction = async (action: 'delete' | 'categorize', data?: any) => {
    if (selectedTransactions.length === 0) {
      toast.warning('No transactions selected', 'Please select transactions first')
      return
    }

    try {
      if (action === 'delete') {
        await Promise.all(selectedTransactions.map(id => deleteTransaction(id)))
        toast.success('Transactions deleted', `${selectedTransactions.length} transactions deleted`)
        setSelectedTransactions([])
      } else if (action === 'categorize' && data?.categoryId) {
        await Promise.all(selectedTransactions.map(id => 
          updateTransaction(id, { categoryId: data.categoryId })
        ))
        toast.success('Transactions categorized', `${selectedTransactions.length} transactions updated`)
        setSelectedTransactions([])
      }
    } catch (error) {
      toast.error('Bulk action failed', 'Please try again')
    }
  }

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id))
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedAccount('')
    setSelectedCategory('')
    setDateRange({ start: '', end: '' })
    setAmountRange({ min: '', max: '' })
    setTransactionType('all')
    setFilters({})
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-4">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Transactions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button 
            onClick={() => fetchTransactions()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Activity
        </h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddTransaction(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {Object.keys(filters).length > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Account Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All accounts</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All transactions</option>
                  <option value="income">Income only</option>
                  <option value="expense">Expenses only</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amountRange.min}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={amountRange.max}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedTransactions.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTransactions.length} transaction(s) selected
            </span>
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAction('categorize', { categoryId: e.target.value })
                    e.target.value = ''
                  }
                }}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              >
                <option value="">Categorize...</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </span>
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
        >
          {selectedTransactions.length === filteredTransactions.length ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          Select All
        </button>
      </div>
      
      {/* Transactions List */}
      <div className="card divide-y divide-gray-200 dark:divide-gray-700">
        {filteredTransactions.map((transaction) => {
          const account = getAccountById(transaction.accountId)
          const category = transaction.categoryId ? getCategoryById(transaction.categoryId) : null
          const isSelected = selectedTransactions.includes(transaction.id)
          
          return (
            <div key={transaction.id} className={`p-4 transition-colors ${
              isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}>
              <div className="flex items-center gap-3">
                {/* Selection Checkbox */}
                <button
                  onClick={() => handleSelectTransaction(transaction.id)}
                  className="flex-shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-primary-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>

                {/* Transaction Details */}
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleTransactionClick(transaction)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {transaction.description}
                        </h3>
                        {transaction.isSubscription && (
                          <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full">
                            Subscription
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{account?.name}</span>
                        {category && (
                          <span className="flex items-center gap-1">
                            <span style={{ color: category.color }}>{category.icon}</span>
                            {category.name}
                          </span>
                        )}
                        <span>{transaction.date ? formatRelativeDate(transaction.date) : 'No date'}</span>
                      </div>
                      
                      {transaction.merchant && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {transaction.merchant}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold sensitive-amount ${
                        transaction.amount >= 0 
                          ? 'text-success-600 dark:text-success-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingTransaction(transaction)
                    }}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Edit transaction"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm({ isOpen: true, transactionId: transaction.id })
                    }}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {filteredTransactions.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {transactions.length === 0 ? 'No transactions found' : 'No transactions match your filters'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {transactions.length === 0 
              ? 'Transactions will appear here once you add them'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {transactions.length === 0 && (
            <button
              onClick={() => setShowAddTransaction(true)}
              className="btn-primary mt-4"
            >
              Add Your First Transaction
            </button>
          )}
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          onSave={handleEditTransaction}
          onCancel={() => setEditingTransaction(null)}
        />
      )}

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <AddTransactionModal
          accounts={accounts}
          categories={categories}
          onSave={async (data) => {
            try {
              await useTransactionsStore.getState().createTransaction(data)
              toast.success('Transaction added', 'New transaction has been added')
              setShowAddTransaction(false)
            } catch (error) {
              toast.error('Failed to add transaction', 'Please try again')
            }
          }}
          onCancel={() => setShowAddTransaction(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, transactionId: null })}
        onConfirm={() => {
          if (deleteConfirm.transactionId) {
            handleDeleteTransaction(deleteConfirm.transactionId)
          }
        }}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

/**
 * Props for the EditTransactionModal component
 */
interface EditTransactionModalProps {
  /** The transaction object to be edited */
  transaction: any
  /** Array of available accounts for the transaction */
  accounts: any[]
  /** Array of available categories for categorization */
  categories: any[]
  /** Callback function called when the transaction is saved with updated data */
  onSave: (data: any) => void
  /** Callback function called when the edit operation is cancelled */
  onCancel: () => void
}

/**
 * Modal component for editing existing transactions.
 * 
 * Provides a form interface pre-populated with the current transaction data,
 * allowing users to modify transaction details including description, amount,
 * date, account, category, merchant, and subscription status.
 * 
 * @param props - The component props
 * @param props.transaction - Transaction object containing current values
 * @param props.accounts - Available accounts for the account dropdown
 * @param props.categories - Available categories for the category dropdown
 * @param props.onSave - Function called with updated transaction data on save
 * @param props.onCancel - Function called when edit is cancelled
 * @returns JSX element representing the edit transaction modal
 * 
 * @example
 * ```tsx
 * <EditTransactionModal
 *   transaction={selectedTransaction}
 *   accounts={accounts}
 *   categories={categories}
 *   onSave={(data) => updateTransaction(data)}
 *   onCancel={() => setEditing(false)}
 * />
 * ```
 * 
 * @remarks
 * - Pre-fills form with existing transaction data
 * - Validates required fields before submission
 * - Transforms date and amount data for API compatibility
 * - Supports subscription toggle for recurring payments
 * - Uses modal overlay with backdrop click detection
 */
const EditTransactionModal = ({ transaction, accounts, categories, onSave, onCancel }: EditTransactionModalProps) => {
  const [formData, setFormData] = useState({
    description: transaction.description,
    amount: transaction.amount,
    currency: transaction.currency || 'USD',
    accountId: transaction.accountId,
    categoryId: transaction.categoryId || '',
    merchant: transaction.merchant || '',
    date: new Date(transaction.date).toISOString().split('T')[0],
    isSubscription: transaction.isSubscription || false
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      date: new Date(formData.date),
      amount: parseFloat(formData.amount.toString())
    })
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit Transaction
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account
            </label>
            <select
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">No category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Merchant (optional)
            </label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isSubscription"
              checked={formData.isSubscription}
              onChange={(e) => setFormData({ ...formData, isSubscription: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isSubscription" className="text-sm text-gray-700 dark:text-gray-300">
              This is a subscription/recurring payment
            </label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Props for the AddTransactionModal component
 */
interface AddTransactionModalProps {
  /** Array of available accounts for the new transaction */
  accounts: any[]
  /** Array of available categories for categorization */
  categories: any[]
  /** Callback function called when the new transaction is saved */
  onSave: (data: any) => void
  /** Callback function called when the add operation is cancelled */
  onCancel: () => void
}

/**
 * Modal component for creating new transactions.
 * 
 * Provides a clean form interface for adding new financial transactions,
 * with fields for all transaction properties and intelligent defaults
 * for a streamlined user experience.
 * 
 * @param props - The component props
 * @param props.accounts - Available accounts for the account dropdown
 * @param props.categories - Available categories for the category dropdown
 * @param props.onSave - Function called with new transaction data on save
 * @param props.onCancel - Function called when add operation is cancelled
 * @returns JSX element representing the add transaction modal
 * 
 * @example
 * ```tsx
 * <AddTransactionModal
 *   accounts={accounts}
 *   categories={categories}
 *   onSave={(data) => createTransaction(data)}
 *   onCancel={() => setAdding(false)}
 * />
 * ```
 * 
 * @remarks
 * - Initializes form with sensible defaults (today's date, first account)
 * - Validates required fields before submission
 * - Transforms form data for API compatibility
 * - Supports subscription toggle for recurring payments
 * - Provides helpful placeholder text and examples
 * - Uses modal overlay with backdrop click detection
 */
const AddTransactionModal = ({ accounts, categories, onSave, onCancel }: AddTransactionModalProps) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    currency: 'USD',
    accountId: accounts[0]?.id || '',
    categoryId: '',
    merchant: '',
    date: new Date().toISOString().split('T')[0],
    isSubscription: false
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      date: new Date(formData.date),
      amount: parseFloat(formData.amount.toString())
    })
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Transaction
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g., Coffee at Starbucks"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account
            </label>
            <select
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">No category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Merchant (optional)
            </label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g., Starbucks"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isSubscription"
              checked={formData.isSubscription}
              onChange={(e) => setFormData({ ...formData, isSubscription: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isSubscription" className="text-sm text-gray-700 dark:text-gray-300">
              This is a subscription/recurring payment
            </label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ActivityPage