import { create } from 'zustand'
import { goalService } from '@/services/goals'
import type { Goal, GoalProgressSummary } from '@/types'

interface GoalsStore {
  goals: Goal[]
  isLoading: boolean
  error: string | null
  
  fetchGoals: () => Promise<void>
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>
  deleteGoal: (goalId: string) => Promise<void>
  contributeToGoal: (goalId: string, amount: number) => Promise<void>
  getGoalProgress: (goalId: string) => Promise<GoalProgressSummary | null>
}

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,
  
  fetchGoals: async () => {
    set({ isLoading: true, error: null })
    try {
      const goals = await goalService.getActiveGoals()
      set({ goals, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  
  createGoal: async (goal) => {
    try {
      const newGoal = await goalService.createGoal(goal)
      set(state => ({ goals: [...state.goals, newGoal] }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  
  updateGoal: async (goalId, updates) => {
    try {
      await goalService.updateGoal(goalId, updates)
      const goals = await goalService.getActiveGoals()
      set({ goals })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  
  deleteGoal: async (goalId) => {
    try {
      await goalService.deleteGoal(goalId)
      set(state => ({
        goals: state.goals.filter(g => g.id !== goalId)
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  
  contributeToGoal: async (goalId, amount) => {
    try {
      await goalService.addContribution({
        goalId,
        amount,
        date: new Date(),
        source: 'manual',
        description: 'Manual contribution'
      })
      const goals = await goalService.getActiveGoals()
      set({ goals })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  
  getGoalProgress: async (goalId) => {
    try {
      const goal = get().goals.find(g => g.id === goalId)
      if (!goal) return null
      return await goalService.calculateGoalProgress(goal)
    } catch (error) {
      set({ error: (error as Error).message })
      return null
    }
  }
}))