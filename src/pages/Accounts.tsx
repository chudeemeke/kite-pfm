import { useEffect, useState, useRef } from 'react'
import { useAccountsStore, useTransactionsStore, useSettingsStore, toast } from '@/stores'
import { formatCurrency, formatAccountType, formatRelativeDate } from '@/services'
import { Plus, MoreVertical, AlertCircle, Edit2, Archive, Trash2, Star, Activity, X } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

const AccountsPage = () => {
  const { accounts, isLoading, error, fetchAccounts, updateAccount, archiveAccount, deleteAccount } = useAccountsStore()
  const { setFilters } = useTransactionsStore()
  const { privacy } = useSettingsStore()
  const navigate = useNavigate()
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    fetchAccounts()
  }, [])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
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
  
  const handleDelete = async (accountId: string, accountName: string) => {
    try {
      await deleteAccount(accountId)
      toast.success('Account deleted', `${accountName} has been permanently deleted`)
      setShowDeleteConfirm(null)
      setOpenDropdown(null)
    } catch (error) {
      toast.error('Failed to delete account', 'Please try again')
    }
  }
  
  const handleEdit = (account: any) => {
    setEditingAccount(account)
    setOpenDropdown(null)
  }
  
  const handleSaveEdit = async (updatedData: any) => {
    if (!editingAccount) return
    
    try {
      await updateAccount(editingAccount.id, updatedData)
      toast.success('Account updated', 'Account details have been saved')
      setEditingAccount(null)
    } catch (error) {
      toast.error('Failed to update account', 'Please try again')
    }
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
            Error Loading Accounts
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button 
            onClick={() => fetchAccounts()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  const activeAccounts = accounts.filter(a => !a.archivedAt)
  const archivedAccounts = accounts.filter(a => a.archivedAt)
  
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Accounts
        </h1>
        <button 
          onClick={() => setShowAddAccount(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>
      
      {/* Active Accounts */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Active Accounts
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activeAccounts.map((account) => (
            <div key={account.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => navigate(`/accounts/${account.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {account.name}
                    </h3>
                    <div className="relative" ref={dropdownRef}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenDropdown(openDropdown === account.id ? null : account.id)
                        }}
                        className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {openDropdown === account.id && (
                        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleEdit(account)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Account
                            </button>
                            
                            <button
                              onClick={() => handleSetAsDefault(account.id)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Star className={`w-4 h-4 ${account.isDefault ? 'text-yellow-500 fill-current' : ''}`} />
                              {account.isDefault ? 'Default Account' : 'Set as Default'}
                            </button>
                            
                            <button
                              onClick={() => handleViewTransactions(account.id, account.name)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Activity className="w-4 h-4" />
                              View Transactions
                            </button>
                            
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            
                            <button
                              onClick={() => handleArchive(account.id, account.name)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Archive className="w-4 h-4" />
                              Archive Account
                            </button>
                            
                            <button
                              onClick={() => setShowDeleteConfirm(account.id)}
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
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatAccountType(account.type)}</span>
                    <span>{account.currency}</span>
                    <span>Created {formatRelativeDate(account.createdAt)}</span>
                    {account.isDefault && (
                      <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                        <Star className="w-3 h-3 fill-current" />
                        Default
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-right">
                <p className={`text-2xl font-bold ${
                  account.balance >= 0 
                    ? 'text-gray-900 dark:text-gray-100' 
                    : 'text-danger-600 dark:text-danger-400'
                } ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                  {formatCurrency(account.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Archived Accounts */}
      {archivedAccounts.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Archived Accounts
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {archivedAccounts.map((account) => (
              <div key={account.id} className="p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {account.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Archived {formatRelativeDate(account.archivedAt!)}
                    </p>
                  </div>
                  
                  <p className={`font-semibold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeAccounts.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">💳</div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No accounts yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add your first account to start tracking your finances
          </p>
          <button 
            onClick={() => setShowAddAccount(true)}
            className="btn-primary"
          >
            Add Account
          </button>
        </div>
      )}
      
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
              Are you sure you want to permanently delete this account? All associated transactions will also be deleted.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const account = accounts.find(a => a.id === showDeleteConfirm)
                  if (account) handleDelete(account.id, account.name)
                }}
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
      
      {/* Add Account Modal */}
      {showAddAccount && (
        <AddAccountModal
          onSave={async (data) => {
            try {
              await useAccountsStore.getState().createAccount(data)
              toast.success('Account created', 'New account has been added')
              setShowAddAccount(false)
            } catch (error) {
              toast.error('Failed to create account', 'Please try again')
            }
          }}
          onCancel={() => setShowAddAccount(false)}
        />
      )}
    </div>
  )
}

// Edit Account Modal Component
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

// Add Account Modal Component
const AddAccountModal = ({ onSave, onCancel }: {
  onSave: (data: any) => void
  onCancel: () => void
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as const,
    currency: 'USD',
    balance: 0
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
            Add New Account
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
              placeholder="e.g., Chase Checking"
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
              Starting Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
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
              Add Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AccountsPage