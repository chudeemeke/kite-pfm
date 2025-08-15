import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { budgetRepo } from '@/db/repositories'
import type { Budget, BudgetLedger } from '@/types'

interface BudgetsStore {
  budgets: Budget[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchBudgets: () => Promise<void>
  createBudget: (data: Omit<Budget, 'id'>) => Promise<Budget>
  updateBudget: (id: string, data: Partial<Budget>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  
  // Budget specific actions
  setBudgetForCategory: (categoryId: string, month: string, amount: number, carryStrategy: Budget['carryStrategy']) => Promise<void>
  
  // Selectors
  getBudgetById: (id: string) => Budget | undefined
  getBudgetsForMonth: (month: string) => Budget[]
  getBudgetForCategoryAndMonth: (categoryId: string, month: string) => Budget | undefined
  getBudgetLedger: (categoryId: string, month: string) => Promise<BudgetLedger>
}

export const useBudgetsStore = create<BudgetsStore>()(
  immer((set, get) => ({
    budgets: [],
    isLoading: false,
    error: null,
    
    fetchBudgets: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const budgets = await budgetRepo.getAll()
        set((state) => {
          state.budgets = budgets
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch budgets'
          state.isLoading = false
        })
      }
    },
    
    createBudget: async (data) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const budget = await budgetRepo.create(data)
        
        set((state) => {
          state.budgets.push(budget)
          state.isLoading = false
        })
        
        return budget
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create budget'
          state.isLoading = false
        })
        throw error
      }
    },
    
    updateBudget: async (id, data) => {
      // Optimistic update
      const originalBudget = get().budgets.find(b => b.id === id)
      if (!originalBudget) return
      
      set((state) => {
        const budget = state.budgets.find(b => b.id === id)
        if (budget) {
          Object.assign(budget, data)
        }
      })
      
      try {
        await budgetRepo.update(id, data)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          const index = state.budgets.findIndex(b => b.id === id)
          if (index !== -1) {
            state.budgets[index] = originalBudget
          }
        })
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update budget'
        })
        throw error
      }
    },
    
    deleteBudget: async (id) => {
      // Optimistic update
      const originalBudgets = [...get().budgets]
      
      set((state) => {
        state.budgets = state.budgets.filter(b => b.id !== id)
      })
      
      try {
        await budgetRepo.delete(id)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.budgets = originalBudgets
          state.error = error instanceof Error ? error.message : 'Failed to delete budget'
        })
        throw error
      }
    },
    
    setBudgetForCategory: async (categoryId, month, amount, carryStrategy) => {
      const existingBudget = get().getBudgetForCategoryAndMonth(categoryId, month)
      
      if (existingBudget) {
        await get().updateBudget(existingBudget.id, { amount, carryStrategy })
      } else {
        await get().createBudget({
          categoryId,
          month,
          amount,
          carryStrategy
        })
      }
    },
    
    getBudgetById: (id) => {
      return get().budgets.find(budget => budget.id === id)
    },
    
    getBudgetsForMonth: (month) => {
      return get().budgets.filter(budget => budget.month === month)
    },
    
    getBudgetForCategoryAndMonth: (categoryId, month) => {
      return get().budgets.find(budget => 
        budget.categoryId === categoryId && budget.month === month
      )
    },
    
    getBudgetLedger: async (categoryId, month) => {
      // This would need to be implemented with proper budget calculation logic
      // For now, returning a placeholder structure
      const budget = get().getBudgetForCategoryAndMonth(categoryId, month)
      
      return {
        categoryId,
        month,
        entries: [],
        totalBudgeted: budget?.amount || 0,
        totalSpent: 0,
        totalCarriedIn: 0,
        totalCarriedOut: 0,
        remaining: budget?.amount || 0
      }
    }
  }))
)