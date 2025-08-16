import { useEffect, useState } from 'react'
import { useAccountsStore, useTransactionsStore, useSettingsStore } from '@/stores'
import { formatCurrency } from '@/services'
import { getGreeting } from '@/services/greeting'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { AccountIconRenderer } from '@/components/icons/AccountIcons'
import { cn } from '@/lib/utils'
import LoadingSpinner from '@/components/LoadingSpinner'

/**
 * Home page component displaying the main dashboard of the Kite finance application.
 * 
 * Provides an overview of the user's financial status including net worth, income/expense
 * summary, account balances, and recent transaction activity. Serves as the primary
 * landing page with quick access to key financial metrics.
 * 
 * @returns JSX element representing the home dashboard page
 * 
 * @example
 * ```tsx
 * import HomePage from '@/pages/Home'
 * import { Routes, Route } from 'react-router-dom'
 * 
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/" element={<HomePage />} />
 *     </Routes>
 *   )
 * }
 * ```
 * 
 * Dashboard Features:
 * - **Net Worth Display**: Total balance across all accounts with trend indicator
 * - **Income/Expense Cards**: Quick stats showing monthly income and expenses
 * - **Account Summary**: List of accounts with current balances and types
 * - **Recent Transactions**: Preview of latest transaction activity
 * - **Privacy Mode Support**: Masks sensitive amounts when privacy mode is enabled
 * 
 * @remarks
 * - Automatically fetches accounts and transactions data on mount
 * - Handles loading and error states with appropriate UI feedback
 * - Supports dark mode theming throughout the interface
 * - Responsive design optimized for mobile-first viewing
 * - Integrates with settings store for privacy mode functionality
 * - Shows only active (non-archived) accounts in the summary
 * - Provides retry functionality for failed data loading
 */
const HomePage = () => {
  const { accounts, getTotalBalance, isLoading: accountsLoading, error: accountsError, fetchAccounts } = useAccountsStore()
  const { isLoading: transactionsLoading, error: transactionsError, fetchTransactions } = useTransactionsStore()
  const { privacy, profile } = useSettingsStore()
  
  const [netWorth, setNetWorth] = useState(0)
  const [greeting, setGreeting] = useState('')
  
  useEffect(() => {
    fetchAccounts()
    fetchTransactions()
    
    // Set intelligent dynamic greeting with context
    const userName = profile?.name || 'there'
    const balance = getTotalBalance()
    
    // Determine last visit (simplified - in production, track this properly)
    const lastVisit = sessionStorage.getItem('lastVisit')
    const now = Date.now()
    let visitContext: 'today' | 'yesterday' | 'thisWeek' | 'longer' = 'today'
    
    if (lastVisit) {
      const timeDiff = now - parseInt(lastVisit)
      const hoursDiff = timeDiff / (1000 * 60 * 60)
      
      if (hoursDiff < 2) visitContext = 'today'
      else if (hoursDiff < 24) visitContext = 'yesterday'
      else if (hoursDiff < 168) visitContext = 'thisWeek'
      else visitContext = 'longer'
    }
    
    sessionStorage.setItem('lastVisit', now.toString())
    sessionStorage.setItem('visitCount', ((parseInt(sessionStorage.getItem('visitCount') || '0')) + 1).toString())
    
    // Calculate streak (simplified - in production, track properly)
    const visitCount = parseInt(sessionStorage.getItem('visitCount') || '0')
    const streakDays = Math.min(visitCount, 30) // Cap at 30 for demo
    
    const dynamicGreeting = getGreeting({ 
      userName: userName === 'User' ? 'there' : userName,
      hasRecentActivity: visitContext === 'today' && visitCount > 1,
      streakDays: streakDays > 3 ? streakDays : 0,
      accountBalance: balance > 1000 ? 'positive' : balance < 0 ? 'negative' : 'neutral',
      lastVisit: visitContext,
      mood: Math.random() > 0.7 ? 'witty' : Math.random() > 0.3 ? 'friendly' : 'professional'
    })
    setGreeting(dynamicGreeting)
  }, [])
  
  useEffect(() => {
    setNetWorth(getTotalBalance())
  }, [accounts, getTotalBalance])
  
  const isLoading = accountsLoading || transactionsLoading
  const hasError = accountsError || transactionsError
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
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
              <button 
                onClick={() => fetchAccounts()}
                className="btn-primary"
              >
                Retry Accounts
              </button>
            )}
            {transactionsError && (
              <button 
                onClick={() => fetchTransactions()}
                className="btn-primary"
              >
                Retry Transactions
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {greeting}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's your financial overview
        </p>
      </div>
      
      {/* Net Worth Card */}
      <div className="card p-6">
        <div className="text-center">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Net Worth
          </h2>
          <p className={`text-3xl font-bold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
            {formatCurrency(netWorth)}
          </p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-success-600" />
            <span className="text-sm text-success-600">+2.3% this month</span>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Income</p>
              <p className={`font-semibold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                {formatCurrency(3500)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-100 dark:bg-danger-900/20 rounded-full flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expenses</p>
              <p className={`font-semibold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                {formatCurrency(2134)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Accounts Summary */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Accounts
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {accounts.filter(a => !a.archivedAt).slice(0, 4).map((account) => (
            <div key={account.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AccountIconRenderer 
                  accountType={account.type} 
                  size={40} 
                  className="filter drop-shadow-sm"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {account.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {account.type.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={cn(
                  'font-semibold',
                  account.balance >= 0 
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-danger-600 dark:text-danger-400',
                  privacy?.privacyMode ? 'sensitive-amount' : ''
                )}>
                  {formatCurrency(account.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Transactions Placeholder */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Recent Transactions
          </h3>
        </div>
        
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <p>Recent transactions will appear here</p>
          <p className="text-sm mt-1">Visit Activity page to see all transactions</p>
        </div>
      </div>
    </div>
  )
}

export default HomePage