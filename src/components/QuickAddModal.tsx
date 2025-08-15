import React, { useState, useEffect } from 'react'
import { X, DollarSign, CreditCard, Target, Calendar, Settings } from 'lucide-react'
import { useAccountsStore, useCategoriesStore, useBudgetsStore, useTransactionsStore, useRulesStore, toast } from '@/stores'
import { format } from 'date-fns'
import type { RuleCondition } from '@/types'

/**
 * Props for the QuickAddModal component
 */
interface QuickAddModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Function called when the modal should be closed */
  onClose: () => void
}

/**
 * Type representing the different types of items that can be quickly added
 */
type QuickAddType = 'transaction' | 'account' | 'budget' | 'subscription' | 'rule' | null

/**
 * Quick Add Modal component for rapidly creating various types of financial data.
 * 
 * Provides a streamlined interface for adding transactions, accounts, budgets, subscriptions,
 * and categorization rules. Features a two-step process: first selecting the type of item
 * to create, then filling out a contextual form for that item type.
 * 
 * @param props - The component props
 * @param props.isOpen - Controls the modal visibility
 * @param props.onClose - Callback function executed when the modal is closed
 * @returns JSX element representing the quick add modal
 * 
 * @example
 * ```tsx
 * import QuickAddModal from '@/components/QuickAddModal'
 * 
 * function App() {
 *   const [showQuickAdd, setShowQuickAdd] = useState(false)
 * 
 *   return (
 *     <>
 *       <button onClick={() => setShowQuickAdd(true)}>
 *         Quick Add
 *       </button>
 *       <QuickAddModal 
 *         isOpen={showQuickAdd} 
 *         onClose={() => setShowQuickAdd(false)} 
 *       />
 *     </>
 *   )
 * }
 * ```
 * 
 * Supported Item Types:
 * - **Transaction**: Income or expense entries with account, category, and merchant info
 * - **Account**: Bank accounts, credit cards, or other financial accounts
 * - **Budget**: Monthly spending limits for specific categories with carryover strategies
 * - **Subscription**: Recurring payments tracked as special transactions
 * - **Rule**: Auto-categorization rules based on merchant, description, or amount patterns
 * 
 * @remarks
 * - Uses a multi-step wizard interface for better UX
 * - Integrates with all major application stores (transactions, accounts, budgets, rules)
 * - Supports keyboard navigation (ESC key to close)
 * - Includes form validation and error handling
 * - Provides visual feedback with loading states and success/error toasts
 * - Mobile-optimized with backdrop blur and smooth animations
 */
const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState<QuickAddType>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Store hooks
  const { accounts, createAccount, fetchAccounts } = useAccountsStore()
  const { categories, fetchCategories } = useCategoriesStore()
  const { setBudgetForCategory } = useBudgetsStore()
  const { createTransaction } = useTransactionsStore()
  const { createRule } = useRulesStore()

  useEffect(() => {
    if (isOpen) {
      fetchAccounts()
      fetchCategories()
    }
  }, [isOpen, fetchAccounts, fetchCategories])

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleClose = () => {
    setSelectedType(null)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  const quickAddOptions = [
    {
      type: 'transaction' as QuickAddType,
      title: 'Add Transaction',
      description: 'Record income or expense',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      type: 'account' as QuickAddType,
      title: 'Add Account',
      description: 'Create new bank account',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      type: 'budget' as QuickAddType,
      title: 'Create Budget',
      description: 'Set spending limits',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      type: 'subscription' as QuickAddType,
      title: 'Add Subscription',
      description: 'Track recurring payments',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      type: 'rule' as QuickAddType,
      title: 'Create Rule',
      description: 'Auto-categorize transactions',
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-red-500 hover:bg-red-600'
    }
  ]

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200">
        {!selectedType ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Quick Add
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  What would you like to add?
                </p>
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Options Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickAddOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setSelectedType(option.type)}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                  >
                    <div className={`p-3 rounded-lg text-white ${option.color} group-hover:scale-110 transition-transform`}>
                      {option.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <QuickAddForm
            type={selectedType}
            accounts={accounts}
            categories={categories}
            onSubmit={async (data) => {
              setIsLoading(true)
              try {
                switch (selectedType) {
                  case 'transaction':
                    await createTransaction(data)
                    toast.success('Transaction added', 'Transaction created successfully')
                    break
                  case 'account':
                    await createAccount(data)
                    toast.success('Account created', 'New account added successfully')
                    break
                  case 'budget':
                    await setBudgetForCategory(data.categoryId, data.month, data.amount, data.carryStrategy)
                    toast.success('Budget created', 'Budget set successfully')
                    break
                  case 'subscription':
                    await createTransaction({
                      ...data,
                      isSubscription: true
                    })
                    toast.success('Subscription added', 'Recurring payment tracked')
                    break
                  case 'rule':
                    // Build conditions array from form data
                    const conditions: RuleCondition[] = []
                    
                    if (data.merchantValue) {
                      conditions.push({
                        field: 'merchant',
                        op: data.merchantCondition || 'contains',
                        value: data.merchantValue
                      })
                    }
                    
                    if (data.descriptionValue) {
                      conditions.push({
                        field: 'description',
                        op: data.descriptionCondition || 'contains',
                        value: data.descriptionValue
                      })
                    }
                    
                    if (data.amountValue || (data.amountMin && data.amountMax)) {
                      conditions.push({
                        field: 'amount',
                        op: data.amountCondition === 'between' ? 'range' : 'eq',
                        value: data.amountCondition === 'between' 
                          ? { min: Number(data.amountMin) || 0, max: Number(data.amountMax) || 0 }
                          : Number(data.amountValue) || 0
                      })
                    }
                    
                    if (conditions.length === 0) {
                      throw new Error('At least one condition is required')
                    }
                    
                    // Map priority to number
                    const priorityMap = { high: 1, normal: 5, low: 10 }
                    
                    await createRule({
                      name: data.name,
                      conditions,
                      actions: [{ setCategoryId: data.categoryId }],
                      enabled: data.enabled !== false,
                      priority: priorityMap[data.priority as keyof typeof priorityMap] || 5,
                      stopProcessing: false
                    })
                    toast.success('Rule created', 'Auto-categorization rule added successfully')
                    break
                }
                handleClose()
              } catch (error) {
                toast.error('Failed to save', 'Please try again')
              } finally {
                setIsLoading(false)
              }
            }}
            onCancel={() => setSelectedType(null)}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Props for the QuickAddForm component
 */
interface QuickAddFormProps {
  /** The type of item being created (transaction, account, budget, etc.) */
  type: QuickAddType
  /** Available accounts for transaction/budget creation */
  accounts: any[]
  /** Available categories for transaction/budget creation */
  categories: any[]
  /** Function called when the form is submitted with form data */
  onSubmit: (data: any) => Promise<void>
  /** Function called when the form is cancelled */
  onCancel: () => void
  /** Whether the form is currently in a loading/submitting state */
  isLoading: boolean
}

/**
 * Dynamic form component that renders different input fields based on the selected item type.
 * 
 * This component provides context-specific forms for creating transactions, accounts, budgets,
 * subscriptions, and categorization rules. It handles form state, validation, and data
 * transformation before submission.
 * 
 * @param props - The component props
 * @param props.type - Determines which form fields to render
 * @param props.accounts - List of accounts for dropdowns
 * @param props.categories - List of categories for dropdowns
 * @param props.onSubmit - Callback for form submission with transformed data
 * @param props.onCancel - Callback for form cancellation
 * @param props.isLoading - Shows loading state and disables form controls
 * @returns JSX element representing the contextual form
 * 
 * Form Types:
 * - **Transaction/Subscription**: Description, amount, date, account, category, merchant
 * - **Account**: Name, type, initial balance
 * - **Budget**: Category, amount, carryover strategy
 * - **Rule**: Name, conditions (merchant/description/amount), target category, priority
 * 
 * @remarks
 * - Automatically initializes form data based on the selected type
 * - Includes client-side validation before submission
 * - Supports conditional form fields (e.g., amount ranges for rules)
 * - Provides helpful placeholder text and form hints
 * - Transforms form data into the correct format for API submission
 */
const QuickAddForm: React.FC<QuickAddFormProps> = ({
  type,
  accounts,
  categories,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    // Initialize form data based on type
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = format(new Date(), 'yyyy-MM')
    
    switch (type) {
      case 'transaction':
      case 'subscription':
        setFormData({
          description: '',
          amount: 0,
          currency: 'USD',
          accountId: accounts[0]?.id || '',
          categoryId: '',
          merchant: '',
          date: today,
          isSubscription: type === 'subscription'
        })
        break
      case 'account':
        setFormData({
          name: '',
          type: 'checking',
          currency: 'USD',
          balance: 0
        })
        break
      case 'budget':
        setFormData({
          categoryId: '',
          amount: 0,
          month: currentMonth,
          carryStrategy: 'carryNone'
        })
        break
      case 'rule':
        setFormData({
          name: '',
          categoryId: '',
          merchantCondition: 'contains',
          merchantValue: '',
          descriptionCondition: 'contains',
          descriptionValue: '',
          amountCondition: 'greater_than',
          amountValue: '',
          amountMin: '',
          amountMax: '',
          priority: 'normal',
          enabled: true
        })
        break
      default:
        setFormData({})
    }
  }, [type, accounts])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (type === 'transaction' || type === 'subscription') {
      if (!formData.description || !formData.amount || !formData.accountId) {
        toast.warning('Missing required fields', 'Please fill in all required fields')
        return
      }
    } else if (type === 'account') {
      if (!formData.name) {
        toast.warning('Missing required fields', 'Please enter an account name')
        return
      }
    } else if (type === 'budget') {
      if (!formData.categoryId || !formData.amount) {
        toast.warning('Missing required fields', 'Please select a category and enter an amount')
        return
      }
    }

    // Format data for submission
    const submitData = { ...formData }
    if (type === 'transaction' || type === 'subscription') {
      submitData.date = new Date(formData.date)
      submitData.amount = parseFloat(formData.amount)
    } else if (type === 'account') {
      submitData.balance = parseFloat(formData.balance || 0)
    } else if (type === 'budget') {
      submitData.amount = parseFloat(formData.amount)
    }

    onSubmit(submitData)
  }

  const getFormTitle = () => {
    switch (type) {
      case 'transaction': return 'Add Transaction'
      case 'account': return 'Add Account'
      case 'budget': return 'Create Budget'
      case 'subscription': return 'Add Subscription'
      case 'rule': return 'Create Rule'
      default: return 'Quick Add'
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {getFormTitle()}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fill in the details below
          </p>
        </div>
        
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Go back"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          {(type === 'transaction' || type === 'subscription') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={type === 'subscription' ? 'Netflix subscription' : 'Coffee at Starbucks'}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account *
                </label>
                <select
                  value={formData.accountId || ''}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  value={formData.merchant || ''}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Store or business name"
                />
              </div>
            </>
          )}

          {type === 'account' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Chase Checking"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Type
                </label>
                <select
                  value={formData.type || 'checking'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="investment">Investment</option>
                  <option value="cash">Cash</option>
                  <option value="loan">Loan</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Starting Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance || ''}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
            </>
          )}

          {type === 'budget' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.filter(c => !c.name.includes('💰')).map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budget Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="500.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Carryover Strategy
                </label>
                <select
                  value={formData.carryStrategy || 'carryNone'}
                  onChange={(e) => setFormData({ ...formData, carryStrategy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="carryNone">No Carryover</option>
                  <option value="carryUnspent">Carry Unspent</option>
                  <option value="carryOverspend">Carry Overspend</option>
                </select>
              </div>
            </>
          )}

          {type === 'rule' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Categorize Netflix as Entertainment"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Category *
                </label>
                <select
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conditions (at least one required) *
                </label>
                
                <div className="space-y-3">
                  {/* Merchant condition */}
                  <div className="flex items-center gap-2">
                    <select
                      value={formData.merchantCondition || 'contains'}
                      onChange={(e) => setFormData({ ...formData, merchantCondition: e.target.value })}
                      className="w-32 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="contains">Contains</option>
                      <option value="equals">Equals</option>
                      <option value="starts_with">Starts with</option>
                      <option value="ends_with">Ends with</option>
                    </select>
                    <input
                      type="text"
                      value={formData.merchantValue || ''}
                      onChange={(e) => setFormData({ ...formData, merchantValue: e.target.value })}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Merchant name (e.g., Netflix, Starbucks)"
                    />
                  </div>

                  {/* Description condition */}
                  <div className="flex items-center gap-2">
                    <select
                      value={formData.descriptionCondition || 'contains'}
                      onChange={(e) => setFormData({ ...formData, descriptionCondition: e.target.value })}
                      className="w-32 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="contains">Contains</option>
                      <option value="equals">Equals</option>
                      <option value="starts_with">Starts with</option>
                      <option value="ends_with">Ends with</option>
                    </select>
                    <input
                      type="text"
                      value={formData.descriptionValue || ''}
                      onChange={(e) => setFormData({ ...formData, descriptionValue: e.target.value })}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Description keyword"
                    />
                  </div>

                  {/* Amount condition */}
                  <div className="flex items-center gap-2">
                    <select
                      value={formData.amountCondition || 'greater_than'}
                      onChange={(e) => setFormData({ ...formData, amountCondition: e.target.value })}
                      className="w-32 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="greater_than">Greater than</option>
                      <option value="less_than">Less than</option>
                      <option value="equals">Equals</option>
                      <option value="between">Between</option>
                    </select>
                    {formData.amountCondition === 'between' ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.amountMin || ''}
                          onChange={(e) => setFormData({ ...formData, amountMin: e.target.value })}
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Min"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.amountMax || ''}
                          onChange={(e) => setFormData({ ...formData, amountMax: e.target.value })}
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Max"
                        />
                      </div>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amountValue || ''}
                        onChange={(e) => setFormData({ ...formData, amountValue: e.target.value })}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Amount"
                      />
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  At least one condition must be filled. Multiple conditions work as AND.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Priority
                </label>
                <select
                  value={formData.priority || 'normal'}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="high">High (runs first)</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low (runs last)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rule-enabled"
                  checked={formData.enabled !== false}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="rule-enabled" className="text-sm text-gray-700 dark:text-gray-300">
                  Enable this rule immediately
                </label>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors font-medium"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : getFormTitle()}
          </button>
        </div>
      </form>
    </>
  )
}

export default QuickAddModal