import { useState, useEffect } from 'react'
import { useBudgetsStore, useCategoriesStore, useTransactionsStore, useSettingsStore } from '@/stores'
import { formatCurrency, formatBudgetMonth } from '@/services'
import { budgetingService } from '@/services/budgeting'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Edit3, Trash2, TrendingUp, AlertTriangle } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import type { Budget, BudgetLedger } from '@/types'

/**
 * Props for the BudgetCard component
 */
interface BudgetCardProps {
  /** The budget object containing amount and carryover strategy */
  budget: Budget
  /** Calculated ledger data showing spent amounts and carryover */
  ledger: BudgetLedger
  /** Display name of the category this budget applies to */
  categoryName: string
  /** Color associated with the category for visual distinction */
  categoryColor: string
  /** Callback function called when edit button is clicked */
  onEdit: (budget: Budget) => void
  /** Callback function called when delete button is clicked */
  onDelete: (budgetId: string) => void
  /** Whether privacy mode is enabled to mask sensitive amounts */
  privacyMode?: boolean
}

/**
 * Individual budget card component displaying budget progress and controls.
 * 
 * Shows budget vs. actual spending with visual progress indicators, status icons,
 * and quick action buttons for editing or deleting the budget. Supports carryover
 * amounts and provides color-coded progress feedback.
 * 
 * @param props - The component props
 * @param props.budget - Budget configuration and amount
 * @param props.ledger - Calculated spending data for the budget period
 * @param props.categoryName - Name of the budget category
 * @param props.categoryColor - Category color for visual consistency
 * @param props.onEdit - Handler for edit button clicks
 * @param props.onDelete - Handler for delete button clicks
 * @param props.privacyMode - Whether to mask financial amounts
 * @returns JSX element representing a budget card
 * 
 * @remarks
 * - Shows progress bar with color coding (green/yellow/red based on usage)
 * - Displays carryover amounts when applicable
 * - Includes visual status indicators for overspending or nearing limits
 * - Supports hover effects and smooth transitions
 * - Respects privacy mode for sensitive data display
 */
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
  
  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: categoryColor }}
          />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {categoryName}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <button
            onClick={() => onEdit(budget)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="p-1 text-gray-400 hover:text-danger-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Spent</span>
          <span className={`font-medium ${
            isOverspent ? 'text-danger-600 dark:text-danger-400' : 'text-gray-900 dark:text-gray-100'
          } ${privacyMode ? 'sensitive-amount' : ''}`}>
            {formatCurrency(ledger.totalSpent)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Budgeted</span>
          <span className={`font-medium text-gray-900 dark:text-gray-100 ${privacyMode ? 'sensitive-amount' : ''}`}>
            {formatCurrency(ledger.totalBudgeted)}
          </span>
        </div>
        {ledger.totalCarriedIn !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Carried in</span>
            <span className={`font-medium text-primary-600 dark:text-primary-400 ${privacyMode ? 'sensitive-amount' : ''}`}>
              {formatCurrency(ledger.totalCarriedIn)}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress)}% used
          </span>
          <span className={`text-sm font-medium ${
            remaining >= 0 
              ? 'text-success-600 dark:text-success-400' 
              : 'text-danger-600 dark:text-danger-400'
          } ${privacyMode ? 'sensitive-amount' : ''}`}>
            {remaining >= 0 ? formatCurrency(remaining) + ' left' : formatCurrency(Math.abs(remaining)) + ' over'}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        {budget.carryStrategy !== 'carryNone' && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Strategy: {budget.carryStrategy === 'carryUnspent' ? 'Carry unspent' : 'Carry overspend'}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Props for the BudgetForm component
 */
interface BudgetFormProps {
  /** Existing budget to edit (undefined for creating new budget) */
  budget?: Budget
  /** Month string (YYYY-MM format) for which the budget is being created/edited */
  month: string
  /** Callback function called when the form is saved with budget data */
  onSave: (data: { categoryId: string; amount: number; carryStrategy: Budget['carryStrategy'] }) => void
  /** Callback function called when the form is cancelled */
  onCancel: () => void
}

/**
 * Form component for creating or editing budget entries.
 * 
 * Provides a modal form interface for setting budget amounts, selecting categories,
 * and configuring carryover strategies. Supports both creating new budgets and
 * editing existing ones with pre-populated data.
 * 
 * @param props - The component props
 * @param props.budget - Existing budget object for editing, undefined for new budget
 * @param props.month - Target month for the budget in YYYY-MM format
 * @param props.onSave - Function called with form data when budget is saved
 * @param props.onCancel - Function called when form is cancelled
 * @returns JSX element representing the budget form modal
 * 
 * @example
 * ```tsx
 * <BudgetForm
 *   budget={existingBudget} // or undefined for new
 *   month="2024-01"
 *   onSave={(data) => saveBudget(data)}
 *   onCancel={() => closeForm()}
 * />
 * ```
 * 
 * @remarks
 * - Filters categories to exclude income/investment categories
 * - Disables category selection when editing existing budgets
 * - Provides explanatory text for carryover strategy options
 * - Validates required fields before submission
 * - Uses modal overlay with full-screen on mobile
 */
const BudgetForm = ({ budget, month, onSave, onCancel }: BudgetFormProps) => {
  const { categories } = useCategoriesStore()
  const [formData, setFormData] = useState({
    categoryId: budget?.categoryId || '',
    amount: budget?.amount || 0,
    carryStrategy: budget?.carryStrategy || 'carryNone' as Budget['carryStrategy']
  })
  
  const expenseCategories = categories.filter(cat => 
    !cat.name.includes('💰') && !cat.name.includes('💼') && !cat.name.includes('📈')
  )
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.categoryId && formData.amount > 0) {
      onSave(formData)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {budget ? 'Edit Budget' : 'Create Budget'} - {formatBudgetMonth(month)}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
              disabled={!!budget}
            >
              <option value="">Select a category</option>
              {expenseCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Carryover Strategy
            </label>
            <select
              value={formData.carryStrategy}
              onChange={(e) => setFormData(prev => ({ ...prev, carryStrategy: e.target.value as Budget['carryStrategy'] }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="carryNone">No Carryover</option>
              <option value="carryUnspent">Carry Unspent</option>
              <option value="carryOverspend">Carry Overspend</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.carryStrategy === 'carryNone' && 'Budget resets each month'}
              {formData.carryStrategy === 'carryUnspent' && 'Unused budget carries to next month'}
              {formData.carryStrategy === 'carryOverspend' && 'Overspend reduces next month\'s budget'}
            </p>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {budget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Budgets page component for managing spending budgets and tracking financial goals.
 * 
 * Provides a comprehensive interface for creating, editing, and monitoring monthly budgets
 * across different spending categories. Features month navigation, budget progress tracking,
 * carryover handling, and intelligent budget calculations.
 * 
 * @returns JSX element representing the budgets management page
 * 
 * @example
 * ```tsx
 * import BudgetsPage from '@/pages/Budgets'
 * import { Routes, Route } from 'react-router-dom'
 * 
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/budgets" element={<BudgetsPage />} />
 *     </Routes>
 *   )
 * }
 * ```
 * 
 * Key Features:
 * - **Month Navigation**: Browse budgets across different months with intuitive controls
 * - **Budget Cards**: Visual progress indicators showing spent vs. budgeted amounts
 * - **Smart Calculations**: Automatic budget ledger calculations including carryover amounts
 * - **Carryover Strategies**: Support for carrying unspent amounts or overspend to next month
 * - **Progress Tracking**: Color-coded progress bars and status indicators
 * - **Privacy Mode**: Mask sensitive financial amounts when privacy mode is enabled
 * - **Bulk Statistics**: Monthly totals showing overall budget performance
 * 
 * @remarks
 * - Automatically fetches budgets, categories, and transactions on component mount
 * - Recalculates budget ledgers when month changes or data updates
 * - Uses the budgeting service for complex carryover calculations
 * - Provides loading states during budget calculations
 * - Includes error handling with retry functionality
 * - Mobile-optimized with responsive grid layout
 * - Integrates with confirmation dialogs for destructive actions
 * - Shows empty state with guidance for first-time users
 */
const BudgetsPage = () => {
  const { budgets, isLoading, fetchBudgets, setBudgetForCategory, deleteBudget } = useBudgetsStore()
  const { categories, fetchCategories } = useCategoriesStore()
  const { fetchTransactions } = useTransactionsStore()
  const { privacy } = useSettingsStore()
  
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [budgetLedgers, setBudgetLedgers] = useState<Record<string, BudgetLedger>>({})
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>()
  const [isCalculating, setIsCalculating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; budgetId: string | null }>({ isOpen: false, budgetId: null })
  
  useEffect(() => {
    fetchBudgets()
    fetchCategories()
    fetchTransactions()
  }, [])
  
  useEffect(() => {
    calculateBudgetLedgers()
  }, [budgets, currentMonth])
  
  const calculateBudgetLedgers = async () => {
    setIsCalculating(true)
    const monthBudgets = budgets.filter(b => b.month === currentMonth)
    const ledgers: Record<string, BudgetLedger> = {}
    
    for (const budget of monthBudgets) {
      try {
        const ledger = await budgetingService.calculateBudgetLedger(budget.categoryId, currentMonth)
        ledgers[budget.id] = ledger
      } catch (error) {
        console.error('Error calculating budget ledger:', error)
      }
    }
    
    setBudgetLedgers(ledgers)
    setIsCalculating(false)
  }
  
  const handlePreviousMonth = () => {
    const date = new Date(currentMonth + '-01')
    date.setMonth(date.getMonth() - 1)
    setCurrentMonth(format(date, 'yyyy-MM'))
  }
  
  const handleNextMonth = () => {
    const date = new Date(currentMonth + '-01')
    date.setMonth(date.getMonth() + 1)
    setCurrentMonth(format(date, 'yyyy-MM'))
  }
  
  const handleCreateBudget = () => {
    setEditingBudget(undefined)
    setShowForm(true)
  }
  
  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setShowForm(true)
  }
  
  const handleSaveBudget = async (data: { categoryId: string; amount: number; carryStrategy: Budget['carryStrategy'] }) => {
    try {
      await setBudgetForCategory(data.categoryId, currentMonth, data.amount, data.carryStrategy)
      setShowForm(false)
      setEditingBudget(undefined)
      // Recalculate ledgers after save
      calculateBudgetLedgers()
    } catch (error) {
      console.error('Error saving budget:', error)
      // Toast notification is handled in the store
    }
  }
  
  const handleDeleteBudget = async (budgetId: string) => {
    setDeleteConfirm({ isOpen: true, budgetId })
  }

  const confirmDeleteBudget = async () => {
    if (!deleteConfirm.budgetId) return
    
    try {
      await deleteBudget(deleteConfirm.budgetId)
      // Recalculate ledgers after delete
      calculateBudgetLedgers()
    } catch (error) {
      console.error('Error deleting budget:', error)
      // Toast notification is handled in the store
    }
  }
  
  const monthBudgets = budgets.filter(b => b.month === currentMonth)
  const totalBudgeted = monthBudgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = Object.values(budgetLedgers).reduce((sum, ledger) => sum + ledger.totalSpent, 0)
  const totalRemaining = totalBudgeted - totalSpent
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Budgets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your spending with smart budgets
          </p>
        </div>
        <button
          onClick={handleCreateBudget}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Budget
        </button>
      </div>
      
      {/* Month Selector */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatBudgetMonth(currentMonth)}
            </h2>
            {monthBudgets.length > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {monthBudgets.length} budget{monthBudgets.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {totalBudgeted > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Budgeted</p>
                <p className={`font-semibold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                  {formatCurrency(totalBudgeted)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Spent</p>
                <p className={`font-semibold ${
                  totalSpent > totalBudgeted 
                    ? 'text-danger-600 dark:text-danger-400' 
                    : 'text-gray-900 dark:text-gray-100'
                } ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
                <p className={`font-semibold ${
                  totalRemaining >= 0 
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400'
                } ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Budget Cards */}
      {isCalculating ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner size="md" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Calculating budgets...
            </p>
          </div>
        </div>
      ) : monthBudgets.length > 0 ? (
        <div className="grid gap-4">
          {monthBudgets.map(budget => {
            const category = categories.find(c => c.id === budget.categoryId)
            const ledger = budgetLedgers[budget.id]
            
            if (!category || !ledger) return null
            
            return (
              <BudgetCard
                key={budget.id}
                budget={budget}
                ledger={ledger}
                categoryName={category.name}
                categoryColor={category.color}
                onEdit={handleEditBudget}
                onDelete={handleDeleteBudget}
                privacyMode={privacy?.privacyMode}
              />
            )
          })}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No budgets for {formatBudgetMonth(currentMonth)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first budget to start tracking your spending
          </p>
          <button
            onClick={handleCreateBudget}
            className="btn-primary"
          >
            Create Budget
          </button>
        </div>
      )}
      
      {/* Budget Form Modal */}
      {showForm && (
        <BudgetForm
          budget={editingBudget}
          month={currentMonth}
          onSave={handleSaveBudget}
          onCancel={() => {
            setShowForm(false)
            setEditingBudget(undefined)
          }}
        />
      )}

      {/* Delete Budget Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, budgetId: null })}
        onConfirm={confirmDeleteBudget}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default BudgetsPage