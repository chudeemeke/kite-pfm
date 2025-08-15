import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { transactionRepo } from '@/db/repositories'
import type { Transaction } from '@/types'

interface TransactionsStore {
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  
  // Filters
  filters: {
    accountId?: string
    categoryId?: string
    dateRange?: { start: Date; end: Date }
    searchTerm?: string
  }
  
  // Actions
  fetchTransactions: () => Promise<void>
  createTransaction: (data: Omit<Transaction, 'id'>) => Promise<Transaction>
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  bulkUpdateTransactions: (ids: string[], data: Partial<Transaction>) => Promise<void>
  bulkDeleteTransactions: (ids: string[]) => Promise<void>
  
  // Filter actions
  setFilters: (filters: Partial<TransactionsStore['filters']>) => void
  clearFilters: () => void
  
  // Selectors
  getTransactionById: (id: string) => Transaction | undefined
  getFilteredTransactions: () => Transaction[]
  getSpendingByCategory: (start: Date, end: Date) => Promise<Array<{ categoryId: string; amount: number }>>
  getCashflow: (start: Date, end: Date) => Promise<{ income: number; expenses: number; net: number }>
}

export const useTransactionsStore = create<TransactionsStore>()(
  immer((set, get) => ({
    transactions: [],
    isLoading: false,
    error: null,
    filters: {},
    
    fetchTransactions: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const transactions = await transactionRepo.getAll()
        set((state) => {
          state.transactions = transactions
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch transactions'
          state.isLoading = false
        })
      }
    },
    
    createTransaction: async (data) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const transaction = await transactionRepo.create(data)
        
        set((state) => {
          // Insert at the beginning to maintain date order
          state.transactions.unshift(transaction)
          state.isLoading = false
        })
        
        return transaction
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create transaction'
          state.isLoading = false
        })
        throw error
      }
    },
    
    updateTransaction: async (id, data) => {
      // Optimistic update
      const originalTransaction = get().transactions.find(t => t.id === id)
      if (!originalTransaction) return
      
      set((state) => {
        const transaction = state.transactions.find(t => t.id === id)
        if (transaction) {
          Object.assign(transaction, data)
        }
      })
      
      try {
        await transactionRepo.update(id, data)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          const index = state.transactions.findIndex(t => t.id === id)
          if (index !== -1) {
            state.transactions[index] = originalTransaction
          }
        })
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update transaction'
        })
        throw error
      }
    },
    
    deleteTransaction: async (id) => {
      // Optimistic update
      const originalTransactions = [...get().transactions]
      
      set((state) => {
        state.transactions = state.transactions.filter(t => t.id !== id)
      })
      
      try {
        await transactionRepo.delete(id)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.transactions = originalTransactions
          state.error = error instanceof Error ? error.message : 'Failed to delete transaction'
        })
        throw error
      }
    },
    
    bulkUpdateTransactions: async (ids, data) => {
      // Optimistic update
      const originalTransactions = [...get().transactions]
      
      set((state) => {
        state.transactions = state.transactions.map(t => 
          ids.includes(t.id) ? { ...t, ...data } : t
        )
      })
      
      try {
        await transactionRepo.bulkUpdate(ids, data)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.transactions = originalTransactions
          state.error = error instanceof Error ? error.message : 'Failed to bulk update transactions'
        })
        throw error
      }
    },
    
    bulkDeleteTransactions: async (ids) => {
      // Optimistic update
      const originalTransactions = [...get().transactions]
      
      set((state) => {
        state.transactions = state.transactions.filter(t => !ids.includes(t.id))
      })
      
      try {
        await transactionRepo.bulkDelete(ids)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.transactions = originalTransactions
          state.error = error instanceof Error ? error.message : 'Failed to bulk delete transactions'
        })
        throw error
      }
    },
    
    setFilters: (filters) => {
      set((state) => {
        Object.assign(state.filters, filters)
      })
    },
    
    clearFilters: () => {
      set((state) => {
        state.filters = {}
      })
    },
    
    getTransactionById: (id) => {
      return get().transactions.find(transaction => transaction.id === id)
    },
    
    getFilteredTransactions: () => {
      const { transactions, filters } = get()
      
      return transactions.filter(transaction => {
        // Filter by account
        if (filters.accountId && transaction.accountId !== filters.accountId) {
          return false
        }
        
        // Filter by category
        if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
          return false
        }
        
        // Filter by date range
        if (filters.dateRange) {
          const transactionDate = new Date(transaction.date)
          if (transactionDate < filters.dateRange.start || transactionDate > filters.dateRange.end) {
            return false
          }
        }
        
        // Filter by search term
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase()
          const description = transaction.description.toLowerCase()
          const merchant = (transaction.merchant || '').toLowerCase()
          
          if (!description.includes(searchTerm) && !merchant.includes(searchTerm)) {
            return false
          }
        }
        
        return true
      })
    },
    
    getSpendingByCategory: async (start, end) => {
      return transactionRepo.getSpendingByCategory(start, end)
    },
    
    getCashflow: async (start, end) => {
      return transactionRepo.getCashflow(start, end)
    }
  }))
)