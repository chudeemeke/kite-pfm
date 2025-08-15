// Export all stores
export { useUIStore, toast } from './ui'
export { useAccountsStore } from './accounts'
export { useTransactionsStore } from './transactions'
export { useCategoriesStore } from './categories'
export { useBudgetsStore } from './budgets'
export { useRulesStore } from './rules'
export { useSubscriptionsStore } from './subscriptions'
export { useSettingsStore } from './settings'
export type { 
  ProfileSettings, 
  AppearanceSettings, 
  NotificationSettings, 
  PrivacySettings, 
  CurrencySettings, 
  BudgetSettings, 
  TransactionSettings, 
  DataSettings, 
  AdvancedSettings,
  AllSettings 
} from './settings'

// Store initialization hook
import { useAccountsStore } from './accounts'
import { useTransactionsStore } from './transactions'
import { useCategoriesStore } from './categories'
import { useBudgetsStore } from './budgets'
import { useRulesStore } from './rules'
import { useSubscriptionsStore } from './subscriptions'

export const useInitializeStores = () => {
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts)
  const fetchTransactions = useTransactionsStore((state) => state.fetchTransactions)
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories)
  const fetchBudgets = useBudgetsStore((state) => state.fetchBudgets)
  const fetchRules = useRulesStore((state) => state.fetchRules)
  const fetchSubscriptions = useSubscriptionsStore((state) => state.fetchSubscriptions)
  
  const initializeStores = async () => {
    await Promise.all([
      fetchAccounts(),
      fetchTransactions(),
      fetchCategories(),
      fetchBudgets(),
      fetchRules(),
      fetchSubscriptions()
    ])
  }
  
  return { initializeStores }
}