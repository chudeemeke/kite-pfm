/**
 * Goal Management Service
 * Handles creation, tracking, and management of financial goals
 * Provides intelligent recommendations and progress analysis
 */

import { db } from '@/db/schema'
import type { 
  Goal, 
  GoalMilestone, 
  GoalContribution,
  GoalProgressSummary,
  Transaction 
} from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { differenceInDays, differenceInMonths, addMonths, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns'

export class GoalService {
  /**
   * Get all active goals
   */
  async getActiveGoals(): Promise<Goal[]> {
    return db.goals
      .where('status')
      .equals('active')
      .toArray()
  }
  /**
   * Create a new financial goal
   */
  async createGoal(goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const goal: Goal = {
      ...goalData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add default milestones based on goal type and amount
    if (!goal.milestones) {
      goal.milestones = this.generateDefaultMilestones(goal)
    }

    await db.goals.add(goal)
    
    // Track initial contribution if starting with existing funds
    if (goal.currentAmount > 0) {
      await this.addContribution({
        goalId: goal.id,
        amount: goal.currentAmount,
        date: new Date(),
        source: 'manual',
        description: 'Initial amount'
      })
    }

    return goal
  }

  /**
   * Update an existing goal
   */
  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
    await db.goals.update(goalId, {
      ...updates,
      updatedAt: new Date()
    })
  }

  /**
   * Delete a goal and all related data
   */
  async deleteGoal(goalId: string): Promise<void> {
    await db.transaction('rw', db.goals, db.goalMilestones, db.goalContributions, async () => {
      await db.goals.delete(goalId)
      await db.goalMilestones.where('goalId').equals(goalId).delete()
      await db.goalContributions.where('goalId').equals(goalId).delete()
    })
  }

  /**
   * Add a contribution to a goal
   */
  async addContribution(
    contributionData: Omit<GoalContribution, 'id' | 'createdAt'>
  ): Promise<GoalContribution> {
    const contribution: GoalContribution = {
      ...contributionData,
      id: uuidv4(),
      createdAt: new Date()
    }

    await db.goalContributions.add(contribution)

    // Update goal's current amount
    const goal = await db.goals.get(contributionData.goalId)
    if (goal) {
      const newAmount = goal.currentAmount + contributionData.amount
      await this.updateGoal(goal.id, { 
        currentAmount: newAmount,
        status: newAmount >= goal.targetAmount ? 'completed' : goal.status,
        completedAt: newAmount >= goal.targetAmount ? new Date() : undefined
      })

      // Check milestones
      await this.checkMilestones(goal.id)
    }

    return contribution
  }

  /**
   * Get all goals for a user
   */
  async getUserGoals(userId: string, status?: Goal['status']): Promise<Goal[]> {
    if (status) {
      return await db.goals
        .where(['userId', 'status'])
        .equals([userId, status])
        .toArray()
    }
    return await db.goals.where('userId').equals(userId).toArray()
  }

  /**
   * Get goal with full details including milestones and contributions
   */
  async getGoalDetails(goalId: string): Promise<{
    goal: Goal
    milestones: GoalMilestone[]
    contributions: GoalContribution[]
    progress: GoalProgressSummary
  } | null> {
    const goal = await db.goals.get(goalId)
    if (!goal) return null

    const milestones = await db.goalMilestones
      .where('goalId')
      .equals(goalId)
      .toArray()

    const contributions = await db.goalContributions
      .where('goalId')
      .equals(goalId)
      .sortBy('date')

    const progress = await this.calculateGoalProgress(goal)

    return {
      goal,
      milestones,
      contributions,
      progress
    }
  }

  /**
   * Calculate goal progress and projections
   */
  async calculateGoalProgress(goal: Goal): Promise<GoalProgressSummary> {
    const progressPercentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    const remaining = goal.targetAmount - goal.currentAmount
    
    // Get recent contributions to calculate average
    const recentContributions = await db.goalContributions
      .where('goalId')
      .equals(goal.id)
      .reverse()
      .limit(6)
      .toArray()

    const lastContribution = recentContributions[0]?.date

    // Calculate average monthly contribution
    let averageMonthlyContribution = 0
    if (recentContributions.length > 1) {
      const totalContributed = recentContributions.reduce((sum: number, c) => sum + c.amount, 0)
      const monthSpan = differenceInMonths(
        recentContributions[0].date,
        recentContributions[recentContributions.length - 1].date
      ) || 1
      averageMonthlyContribution = totalContributed / monthSpan
    }

    // Calculate projected completion
    let projectedCompletion: Date | undefined
    let requiredMonthlySaving: number | undefined
    
    if (remaining > 0) {
      const monthsUntilTarget = differenceInMonths(goal.targetDate, new Date())
      
      if (monthsUntilTarget > 0) {
        requiredMonthlySaving = remaining / monthsUntilTarget
        
        if (averageMonthlyContribution > 0) {
          const monthsToComplete = Math.ceil(remaining / averageMonthlyContribution)
          projectedCompletion = addMonths(new Date(), monthsToComplete)
        }
      }
    }

    const isOnTrack = projectedCompletion 
      ? isBefore(projectedCompletion, goal.targetDate) || differenceInDays(goal.targetDate, projectedCompletion) === 0
      : progressPercentage === 100

    return {
      goalId: goal.id,
      goalName: goal.name,
      progressPercentage,
      projectedCompletion,
      isOnTrack,
      requiredMonthlySaving,
      lastContribution
    }
  }

  /**
   * Check and update milestones
   */
  private async checkMilestones(goalId: string): Promise<void> {
    const goal = await db.goals.get(goalId)
    if (!goal) return

    const milestones = await db.goalMilestones
      .where('goalId')
      .equals(goalId)
      .toArray()

    for (const milestone of milestones) {
      if (!milestone.achievedAt && goal.currentAmount >= milestone.targetAmount) {
        await db.goalMilestones.update(milestone.id, {
          achievedAt: new Date(),
          celebrationShown: false
        })
      }
    }
  }

  /**
   * Generate default milestones for a goal
   */
  private generateDefaultMilestones(goal: Goal): GoalMilestone[] {
    const milestones: GoalMilestone[] = []
    const percentages = [25, 50, 75]
    
    percentages.forEach(percentage => {
      const targetAmount = (goal.targetAmount * percentage) / 100
      const monthsTotal = differenceInMonths(goal.targetDate, goal.startDate)
      const monthsForMilestone = Math.floor((monthsTotal * percentage) / 100)
      
      milestones.push({
        id: uuidv4(),
        goalId: goal.id,
        name: `${percentage}% Complete`,
        targetAmount,
        targetDate: addMonths(goal.startDate, monthsForMilestone)
      })
    })

    return milestones
  }

  /**
   * Process automatic contributions from transactions
   */
  async processAutomaticContributions(goalId: string): Promise<void> {
    const goal = await db.goals.get(goalId)
    if (!goal || goal.trackingMethod !== 'automatic') return

    // Get the last processed date
    const lastContribution = await db.goalContributions
      .where('goalId')
      .equals(goalId)
      .and((c: any) => c.source === 'automatic')
      .reverse()
      .first()

    const startDate = lastContribution ? lastContribution.date : goal.startDate

    // Calculate savings from linked accounts
    if (goal.linkedAccountIds && goal.linkedAccountIds.length > 0) {
      for (const accountId of goal.linkedAccountIds) {
        const transactions = await db.transactions
          .where('accountId')
          .equals(accountId)
          .and(t => isAfter(t.date, startDate))
          .toArray()

        // Calculate net positive flow (income - expenses)
        const netFlow = transactions.reduce((sum, t) => sum + t.amount, 0)
        
        if (netFlow > 0) {
          await this.addContribution({
            goalId: goal.id,
            amount: netFlow,
            date: new Date(),
            source: 'automatic',
            description: `Automatic savings from account`
          })
        }
      }
    }
  }

  /**
   * Get goal recommendations based on user's financial situation
   */
  async getGoalRecommendations(userId: string): Promise<{
    type: Goal['type']
    name: string
    description: string
    recommendedAmount: number
    reason: string
    priority: Goal['priority']
  }[]> {
    const recommendations = []
    
    // Get user's financial data
    const accounts = await db.accounts.toArray()
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
    
    const transactions = await db.transactions
      .where('date')
      .between(
        startOfMonth(addMonths(new Date(), -3)),
        endOfMonth(new Date())
      )
      .toArray()
    
    const monthlyExpenses = this.calculateAverageMonthlyExpenses(transactions)
    const monthlyIncome = this.calculateAverageMonthlyIncome(transactions)
    const monthlySavings = monthlyIncome - monthlyExpenses

    // Emergency fund recommendation
    const existingEmergencyGoal = await db.goals
      .where(['userId', 'type'])
      .equals([userId, 'emergency'])
      .and((g: Goal) => g.status === 'active')
      .first()

    if (!existingEmergencyGoal) {
      const emergencyTarget = monthlyExpenses * 6 // 6 months of expenses
      if (totalBalance < emergencyTarget) {
        recommendations.push({
          type: 'emergency' as Goal['type'],
          name: 'Emergency Fund',
          description: 'Build a safety net for unexpected expenses',
          recommendedAmount: emergencyTarget,
          reason: `Based on your average monthly expenses of ${monthlyExpenses.toFixed(2)}, we recommend saving 6 months worth`,
          priority: 'critical' as Goal['priority']
        })
      }
    }

    // Debt payoff recommendation
    const creditAccounts = accounts.filter(a => a.type === 'credit' && a.balance < 0)
    if (creditAccounts.length > 0) {
      const totalDebt = Math.abs(creditAccounts.reduce((sum, a) => sum + a.balance, 0))
      recommendations.push({
        type: 'debt' as Goal['type'],
        name: 'Debt Freedom',
        description: 'Pay off high-interest debt',
        recommendedAmount: totalDebt,
        reason: `You have ${totalDebt.toFixed(2)} in credit card debt. Paying this off could save you significant interest`,
        priority: 'high' as Goal['priority']
      })
    }

    // Savings goal recommendation based on surplus
    if (monthlySavings > 0) {
      const yearlyTarget = monthlySavings * 12
      recommendations.push({
        type: 'savings' as Goal['type'],
        name: 'Annual Savings Target',
        description: 'Maximize your savings potential',
        recommendedAmount: yearlyTarget,
        reason: `With your current surplus of ${monthlySavings.toFixed(2)}/month, you could save ${yearlyTarget.toFixed(2)} this year`,
        priority: 'medium' as Goal['priority']
      })
    }

    return recommendations
  }

  /**
   * Calculate average monthly expenses
   */
  private calculateAverageMonthlyExpenses(transactions: Transaction[]): number {
    const expenses = transactions.filter(t => t.amount < 0)
    if (expenses.length === 0) return 0
    
    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0))
    const months = new Set(expenses.map(t => `${t.date.getFullYear()}-${t.date.getMonth()}`)).size
    
    return totalExpenses / (months || 1)
  }

  /**
   * Calculate average monthly income
   */
  private calculateAverageMonthlyIncome(transactions: Transaction[]): number {
    const income = transactions.filter(t => t.amount > 0)
    if (income.length === 0) return 0
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    const months = new Set(income.map(t => `${t.date.getFullYear()}-${t.date.getMonth()}`)).size
    
    return totalIncome / (months || 1)
  }

  /**
   * Get goals nearing deadline
   */
  async getGoalsNearingDeadline(userId: string, daysThreshold: number = 30): Promise<Goal[]> {
    const goals = await db.goals
      .where('userId')
      .equals(userId)
      .and((g: Goal) => g.status === 'active')
      .toArray()

    const now = new Date()
    return goals.filter(g => {
      const daysUntilTarget = differenceInDays(g.targetDate, now)
      return daysUntilTarget > 0 && daysUntilTarget <= daysThreshold && g.currentAmount < g.targetAmount
    })
  }

  /**
   * Get recently achieved milestones
   */
  async getRecentAchievements(userId: string, days: number = 7): Promise<{
    milestone: GoalMilestone
    goal: Goal
  }[]> {
    const cutoffDate = addMonths(new Date(), -days)
    
    const milestones = await db.goalMilestones
      .where('achievedAt')
      .above(cutoffDate)
      .toArray()

    const achievements = []
    for (const milestone of milestones) {
      const goal = await db.goals.get(milestone.goalId)
      if (goal && goal.userId === userId && !milestone.celebrationShown) {
        achievements.push({ milestone, goal })
        
        // Mark celebration as shown
        await db.goalMilestones.update(milestone.id, {
          celebrationShown: true
        })
      }
    }

    return achievements
  }

  /**
   * Calculate total saved across all active savings goals
   */
  async getTotalSaved(userId: string): Promise<number> {
    const goals = await db.goals
      .where('userId')
      .equals(userId)
      .and((g: Goal) => g.type === 'savings' && g.status === 'active')
      .toArray()

    return goals.reduce((sum: number, g: Goal) => sum + g.currentAmount, 0)
  }

  /**
   * Get goal statistics for dashboard
   */
  async getGoalStatistics(userId: string): Promise<{
    totalGoals: number
    activeGoals: number
    completedGoals: number
    totalSaved: number
    totalTarget: number
    overallProgress: number
    goalsOnTrack: number
    goalsBehind: number
  }> {
    const goals = await db.goals.where('userId').equals(userId).toArray()
    
    const activeGoals = goals.filter((g: Goal) => g.status === 'active')
    const completedGoals = goals.filter((g: Goal) => g.status === 'completed')
    
    const totalSaved = activeGoals.reduce((sum: number, g: Goal) => sum + g.currentAmount, 0)
    const totalTarget = activeGoals.reduce((sum: number, g: Goal) => sum + g.targetAmount, 0)
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
    
    // Calculate on-track vs behind
    let goalsOnTrack = 0
    let goalsBehind = 0
    
    for (const goal of activeGoals) {
      const progress = await this.calculateGoalProgress(goal)
      if (progress.isOnTrack) {
        goalsOnTrack++
      } else {
        goalsBehind++
      }
    }
    
    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalSaved,
      totalTarget,
      overallProgress,
      goalsOnTrack,
      goalsBehind
    }
  }
}

// Export singleton instance
export const goalService = new GoalService()

// Export convenience functions
export const createGoal = goalService.createGoal.bind(goalService)
export const updateGoal = goalService.updateGoal.bind(goalService)
export const deleteGoal = goalService.deleteGoal.bind(goalService)
export const addGoalContribution = goalService.addContribution.bind(goalService)
export const getUserGoals = goalService.getUserGoals.bind(goalService)
export const getGoalDetails = goalService.getGoalDetails.bind(goalService)
export const getGoalRecommendations = goalService.getGoalRecommendations.bind(goalService)
export const getGoalStatistics = goalService.getGoalStatistics.bind(goalService)