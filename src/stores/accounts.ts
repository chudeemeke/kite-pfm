import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { accountRepo } from '@/db/repositories'
import type { Account } from '@/types'

interface AccountsStore {
  accounts: Account[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchAccounts: () => Promise<void>
  createAccount: (data: Omit<Account, 'id' | 'createdAt'>) => Promise<Account>
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>
  archiveAccount: (id: string) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  setDefaultAccount: (id: string) => Promise<void>
  
  // Selectors
  getAccountById: (id: string) => Account | undefined
  getActiveAccounts: () => Account[]
  getTotalBalance: () => number
}

export const useAccountsStore = create<AccountsStore>()(
  immer((set, get) => ({
    accounts: [],
    isLoading: false,
    error: null,
    
    fetchAccounts: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const accounts = await accountRepo.getAll()
        set((state) => {
          state.accounts = accounts
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch accounts'
          state.isLoading = false
        })
      }
    },
    
    createAccount: async (data) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const account = await accountRepo.create(data)
        
        set((state) => {
          state.accounts.push(account)
          state.isLoading = false
        })
        
        return account
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create account'
          state.isLoading = false
        })
        throw error
      }
    },
    
    updateAccount: async (id, data) => {
      // Optimistic update
      const originalAccount = get().accounts.find(a => a.id === id)
      if (!originalAccount) return
      
      set((state) => {
        const account = state.accounts.find(a => a.id === id)
        if (account) {
          Object.assign(account, data)
        }
      })
      
      try {
        await accountRepo.update(id, data)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          const index = state.accounts.findIndex(a => a.id === id)
          if (index !== -1) {
            state.accounts[index] = originalAccount
          }
        })
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update account'
        })
        throw error
      }
    },
    
    archiveAccount: async (id) => {
      // Optimistic update
      const originalAccount = get().accounts.find(a => a.id === id)
      if (!originalAccount) return
      
      set((state) => {
        const account = state.accounts.find(a => a.id === id)
        if (account) {
          account.archivedAt = new Date()
        }
      })
      
      try {
        await accountRepo.archive(id)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          const index = state.accounts.findIndex(a => a.id === id)
          if (index !== -1) {
            state.accounts[index] = originalAccount
          }
        })
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to archive account'
        })
        throw error
      }
    },
    
    deleteAccount: async (id) => {
      // Optimistic update
      const originalAccounts = [...get().accounts]
      
      set((state) => {
        state.accounts = state.accounts.filter(a => a.id !== id)
      })
      
      try {
        await accountRepo.delete(id)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.accounts = originalAccounts
          state.error = error instanceof Error ? error.message : 'Failed to delete account'
        })
        throw error
      }
    },
    
    getAccountById: (id) => {
      return get().accounts.find(account => account.id === id)
    },
    
    getActiveAccounts: () => {
      return get().accounts.filter(account => !account.archivedAt)
    },
    
    getTotalBalance: () => {
      return get().getActiveAccounts().reduce((total, account) => total + account.balance, 0)
    },

    setDefaultAccount: async (id) => {
      const accounts = get().accounts
      
      // First, clear any existing default
      const optimisticUpdate = accounts.map(account => ({
        ...account,
        isDefault: account.id === id
      }))
      
      set((state) => {
        state.accounts = optimisticUpdate
      })
      
      try {
        await accountRepo.setDefaultAccount(id)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.accounts = accounts
          state.error = error instanceof Error ? error.message : 'Failed to set default account'
        })
        throw error
      }
    }
  }))
)