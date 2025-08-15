import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscriptionRepo } from '@/db/repositories'
import type { Subscription } from '@/types'

interface SubscriptionsStore {
  subscriptions: Subscription[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchSubscriptions: () => Promise<void>
  createSubscription: (data: Omit<Subscription, 'id'>) => Promise<Subscription>
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>
  deleteSubscription: (id: string) => Promise<void>
  
  // Subscription specific actions
  updateNextDueDate: (id: string, nextDueDate: Date) => Promise<void>
  
  // Selectors
  getSubscriptionById: (id: string) => Subscription | undefined
  getUpcomingSubscriptions: (days?: number) => Subscription[]
  getTotalMonthlyAmount: () => number
  getTotalYearlyAmount: () => number
}

export const useSubscriptionsStore = create<SubscriptionsStore>()(
  immer((set, get) => ({
    subscriptions: [],
    isLoading: false,
    error: null,
    
    fetchSubscriptions: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const subscriptions = await subscriptionRepo.getAll()
        set((state) => {
          state.subscriptions = subscriptions
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch subscriptions'
          state.isLoading = false
        })
      }
    },
    
    createSubscription: async (data) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const subscription = await subscriptionRepo.create(data)
        
        set((state) => {
          state.subscriptions.push(subscription)
          state.isLoading = false
        })
        
        return subscription
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create subscription'
          state.isLoading = false
        })
        throw error
      }
    },
    
    updateSubscription: async (id, data) => {
      // Optimistic update
      const originalSubscription = get().subscriptions.find(s => s.id === id)
      if (!originalSubscription) return
      
      set((state) => {
        const subscription = state.subscriptions.find(s => s.id === id)
        if (subscription) {
          Object.assign(subscription, data)
        }
      })
      
      try {
        await subscriptionRepo.update(id, data)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          const index = state.subscriptions.findIndex(s => s.id === id)
          if (index !== -1) {
            state.subscriptions[index] = originalSubscription
          }
        })
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update subscription'
        })
        throw error
      }
    },
    
    deleteSubscription: async (id) => {
      // Optimistic update
      const originalSubscriptions = [...get().subscriptions]
      
      set((state) => {
        state.subscriptions = state.subscriptions.filter(s => s.id !== id)
      })
      
      try {
        await subscriptionRepo.delete(id)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.subscriptions = originalSubscriptions
          state.error = error instanceof Error ? error.message : 'Failed to delete subscription'
        })
        throw error
      }
    },
    
    updateNextDueDate: async (id, nextDueDate) => {
      await get().updateSubscription(id, { nextDueDate })
    },
    
    getSubscriptionById: (id) => {
      return get().subscriptions.find(subscription => subscription.id === id)
    },
    
    getUpcomingSubscriptions: (days = 30) => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days)
      
      return get().subscriptions
        .filter(subscription => 
          new Date(subscription.nextDueDate) <= futureDate
        )
        .sort((a, b) => 
          new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
        )
    },
    
    getTotalMonthlyAmount: () => {
      return get().subscriptions
        .filter(sub => sub.cadence === 'monthly')
        .reduce((total, sub) => total + sub.amount, 0)
    },
    
    getTotalYearlyAmount: () => {
      const { subscriptions } = get()
      
      return subscriptions.reduce((total, sub) => {
        switch (sub.cadence) {
          case 'monthly':
            return total + (sub.amount * 12)
          case 'yearly':
            return total + sub.amount
          case 'custom':
            // For custom, we'll assume yearly for simplicity
            return total + sub.amount
          default:
            return total
        }
      }, 0)
    }
  }))
)