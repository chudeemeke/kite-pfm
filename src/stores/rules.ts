import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { ruleRepo } from '@/db/repositories'
import type { Rule } from '@/types'

interface RulesStore {
  rules: Rule[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchRules: () => Promise<void>
  createRule: (data: Omit<Rule, 'id'>) => Promise<Rule>
  updateRule: (id: string, data: Partial<Rule>) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  reorderRules: (ruleIds: string[]) => Promise<void>
  
  // Rule specific actions
  toggleRuleEnabled: (id: string) => Promise<void>
  
  // Selectors
  getRuleById: (id: string) => Rule | undefined
  getEnabledRules: () => Rule[]
  getRulesByPriority: () => Rule[]
}

export const useRulesStore = create<RulesStore>()(
  immer((set, get) => ({
    rules: [],
    isLoading: false,
    error: null,
    
    fetchRules: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const rules = await ruleRepo.getAll()
        set((state) => {
          state.rules = rules
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch rules'
          state.isLoading = false
        })
      }
    },
    
    createRule: async (data) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const rule = await ruleRepo.create(data)
        
        set((state) => {
          state.rules.push(rule)
          // Sort by priority to maintain order
          state.rules.sort((a, b) => a.priority - b.priority)
          state.isLoading = false
        })
        
        return rule
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create rule'
          state.isLoading = false
        })
        throw error
      }
    },
    
    updateRule: async (id, data) => {
      // Optimistic update
      const originalRule = get().rules.find(r => r.id === id)
      if (!originalRule) return
      
      set((state) => {
        const rule = state.rules.find(r => r.id === id)
        if (rule) {
          Object.assign(rule, data)
        }
        // Re-sort if priority changed
        if (data.priority !== undefined) {
          state.rules.sort((a, b) => a.priority - b.priority)
        }
      })
      
      try {
        await ruleRepo.update(id, data)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          const index = state.rules.findIndex(r => r.id === id)
          if (index !== -1) {
            state.rules[index] = originalRule
            state.rules.sort((a, b) => a.priority - b.priority)
          }
        })
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update rule'
        })
        throw error
      }
    },
    
    deleteRule: async (id) => {
      // Optimistic update
      const originalRules = [...get().rules]
      
      set((state) => {
        state.rules = state.rules.filter(r => r.id !== id)
      })
      
      try {
        await ruleRepo.delete(id)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.rules = originalRules
          state.error = error instanceof Error ? error.message : 'Failed to delete rule'
        })
        throw error
      }
    },
    
    reorderRules: async (ruleIds) => {
      // Optimistic update
      const originalRules = [...get().rules]
      
      set((state) => {
        // Reorder rules based on the new order
        const reorderedRules = ruleIds.map(id => 
          state.rules.find(r => r.id === id)!
        ).filter(Boolean)
        
        // Update priorities
        reorderedRules.forEach((rule, index) => {
          rule.priority = index
        })
        
        state.rules = reorderedRules
      })
      
      try {
        await ruleRepo.reorder(ruleIds)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.rules = originalRules
          state.error = error instanceof Error ? error.message : 'Failed to reorder rules'
        })
        throw error
      }
    },
    
    toggleRuleEnabled: async (id) => {
      const rule = get().getRuleById(id)
      if (!rule) return
      
      await get().updateRule(id, { enabled: !rule.enabled })
    },
    
    getRuleById: (id) => {
      return get().rules.find(rule => rule.id === id)
    },
    
    getEnabledRules: () => {
      return get().rules.filter(rule => rule.enabled)
    },
    
    getRulesByPriority: () => {
      return [...get().rules].sort((a, b) => a.priority - b.priority)
    }
  }))
)