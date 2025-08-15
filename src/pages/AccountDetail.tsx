import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccountsStore, useTransactionsStore, useSettingsStore, toast } from '@/stores'
import { formatCurrency, formatAccountType, formatRelativeDate } from '@/services'
import { 
  ArrowLeft, 
  Edit2, 
  Archive, 
  Trash2, 
  Star, 
  Activity,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  X
} from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'

const AccountDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getAccountById, updateAccount, archiveAccount, deleteAccount, setDefaultAccount } = useAccountsStore()
  const { transactions, setFilters, fetchTransactions } = useTransactionsStore()
  const { privacy } = useSettingsStore()
  
  const [account, setAccount] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showActions, setShowActions] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!id) {
      navigate('/accounts')
      return
    }

    const loadAccountData = async () => {
      setIsLoading(true)
      try {
        const accountData = getAccountById(id)
        if (!accountData) {
          toast.error('Account not found', 'The account you are looking for does not exist')
          navigate('/accounts')
          return
        }
        
        setAccount(accountData)
        
        // Load recent transactions for this account
        await fetchTransactions()
        const accountTransactions = transactions
          .filter(tx => tx.accountId === id)
          .slice(0, 10)
        setRecentTransactions(accountTransactions)
        
      } catch (error) {
        toast.error('Failed to load account', 'Please try again')
        navigate('/accounts')
      } finally {
        setIsLoading(false)
      }
    }

    loadAccountData()
  }, [id, getAccountById, navigate, fetchTransactions])

  const handleEdit = () => {
    setEditingAccount(account)
    setShowActions(false)
  }

  const handleSaveEdit = async (updatedData: any) => {
    if (!account) return
    
    try {
      await updateAccount(account.id, updatedData)
      setAccount({ ...account, ...updatedData })
      toast.success('Account updated', 'Account details have been saved')
      setEditingAccount(null)
    } catch (error) {
      toast.error('Failed to update account', 'Please try again')
    }
  }

  const handleSetAsDefault = async () => {
    if (!account) return
    
    try {
      await setDefaultAccount(account.id)
      setAccount({ ...account, isDefault: true })
      toast.success('Default account updated', 'This account is now your default')
      setShowActions(false)
    } catch (error) {
      toast.error('Failed to set default account', 'Please try again')
    }
  }

  const handleArchive = async () => {
    if (!account) return
    
    try {
      await archiveAccount(account.id)
      toast.success('Account archived', `${account.name} has been archived`)
      navigate('/accounts')
    } catch (error) {
      toast.error('Failed to archive account', 'Please try again')
    }
  }

  const handleDelete = async () => {
    if (!account) return
    
    try {
      await deleteAccount(account.id)
      toast.success('Account deleted', `${account.name} has been permanently deleted`)
      navigate('/accounts')
    } catch (error) {
      toast.error('Failed to delete account', 'Please try again')
    }
  }

  const handleViewAllTransactions = () => {
    setFilters({ accountId: account.id })
    navigate('/activity')
  }

  const calculateStats = () => {
    if (!account || recentTransactions.length === 0) {
      return { income: 0, expenses: 0, transactionCount: 0 }
    }

    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    
    const recentTxs = recentTransactions.filter(tx => new Date(tx.date) >= last30Days)
    
    const income = recentTxs
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const expenses = Math.abs(recentTxs
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0))
    
    return {
      income,
      expenses,
      transactionCount: recentTxs.length
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="p-4">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Account Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The account you are looking for does not exist.
          </p>
          <button 
            onClick={() => navigate('/accounts')}
            className="btn-primary"
          >
            Back to Accounts
          </button>
        </div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/accounts')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {account.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {formatAccountType(account.type)} • {account.currency}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={handleEdit}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Account
                </button>
                
                <button
                  onClick={handleSetAsDefault}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Star className={`w-4 h-4 ${account.isDefault ? 'text-yellow-500 fill-current' : ''}`} />
                  {account.isDefault ? 'Default Account' : 'Set as Default'}
                </button>
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                
                <button
                  onClick={handleArchive}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive Account
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Balance Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Current Balance
            </p>
            <p className={`text-3xl font-bold ${
              account.balance >= 0 
                ? 'text-gray-900 dark:text-gray-100' 
                : 'text-danger-600 dark:text-danger-400'
            } ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
              {formatCurrency(account.balance, account.currency)}
            </p>
          </div>
          
          {account.isDefault && (
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Default</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Created {formatRelativeDate(account.createdAt)}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Income (30d)</p>
              <p className={`font-semibold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                {formatCurrency(stats.income, account.currency)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expenses (30d)</p>
              <p className={`font-semibold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                {formatCurrency(stats.expenses, account.currency)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transactions (30d)</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {stats.transactionCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Recent Transactions
          </h3>
          {recentTransactions.length > 0 && (
            <button
              onClick={handleViewAllTransactions}
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All
            </button>
          )}
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {transaction.description}
                  </h4>
                  {transaction.merchant && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.merchant}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatRelativeDate(transaction.date)}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.amount >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  } ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                    {transaction.amount >= 0 ? '+' : ''}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No transactions yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to permanently delete "{account.name}"? All associated transactions will also be deleted.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onSave={handleSaveEdit}
          onCancel={() => setEditingAccount(null)}
        />
      )}
    </div>
  )
}

// Edit Account Modal Component (reused from Accounts page)
const EditAccountModal = ({ account, onSave, onCancel }: {
  account: any
  onSave: (data: any) => void
  onCancel: () => void
}) => {
  const [formData, setFormData] = useState({
    name: account.name,
    type: account.type,
    currency: account.currency,
    balance: account.balance
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit Account
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
              Account Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
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
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
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

export default AccountDetail