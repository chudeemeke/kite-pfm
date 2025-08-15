import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { transactionRepo, budgetRepo } from '@/db/repositories'
import type { Budget, BudgetLedger, BudgetLedgerEntry } from '@/types'

export class BudgetingService {
  /**
   * Calculate the budget ledger for a specific category and month
   */
  async calculateBudgetLedger(categoryId: string, month: string): Promise<BudgetLedger> {
    const monthStart = startOfMonth(new Date(month + '-01'))
    const monthEnd = endOfMonth(monthStart)
    
    // Get current budget
    const currentBudget = await budgetRepo.getByCategoryAndMonth(categoryId, month)
    if (!currentBudget) {
      return this.createEmptyLedger(categoryId, month)
    }
    
    // Get transactions for the month
    const transactions = await transactionRepo.getByCategoryId(categoryId)
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= monthStart && transactionDate <= monthEnd
    })
    
    // Calculate spent amount (negative transactions only)
    const totalSpent = Math.abs(
      monthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    )
    
    // Calculate carryover amounts
    const { carryIn, carryOut } = await this.calculateCarryover(categoryId, month, currentBudget)
    
    // Build ledger entries
    const entries: BudgetLedgerEntry[] = []
    
    // Add budget entry
    entries.push({
      type: 'budgeted',
      amount: currentBudget.amount,
      description: `Budgeted for ${format(monthStart, 'MMMM yyyy')}`,
      date: monthStart
    })
    
    // Add carry-in entry if applicable
    if (carryIn > 0) {
      entries.push({
        type: 'carryIn',
        amount: carryIn,
        description: `Carried over from ${format(subMonths(monthStart, 1), 'MMMM yyyy')}`,
        date: monthStart
      })
    }
    
    // Add spending entries
    monthTransactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        entries.push({
          type: 'spent',
          amount: Math.abs(t.amount),
          description: t.description,
          date: new Date(t.date)
        })
      })
    
    const totalBudgeted = currentBudget.amount + carryIn
    const remaining = totalBudgeted - totalSpent
    
    // Calculate carry-out for next month
    const carryOutAmount = this.calculateCarryOutAmount(
      remaining,
      currentBudget.carryStrategy
    )
    
    if (carryOutAmount !== 0) {
      entries.push({
        type: 'carryOut',
        amount: Math.abs(carryOutAmount),
        description: `Carrying ${carryOutAmount > 0 ? 'unspent' : 'overspend'} to ${format(addMonths(monthStart, 1), 'MMMM yyyy')}`,
        date: monthEnd
      })
    }
    
    // Sort entries by date
    entries.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    return {
      categoryId,
      month,
      entries,
      totalBudgeted: currentBudget.amount,
      totalSpent,
      totalCarriedIn: carryIn,
      totalCarriedOut: carryOut,
      remaining
    }
  }
  
  /**
   * Calculate carryover amounts from previous month
   */
  private async calculateCarryover(
    categoryId: string,
    month: string,
    _currentBudget: Budget
  ): Promise<{ carryIn: number; carryOut: number }> {
    const currentMonthStart = startOfMonth(new Date(month + '-01'))
    const previousMonth = format(subMonths(currentMonthStart, 1), 'yyyy-MM')
    
    // Get previous month's budget
    const previousBudget = await budgetRepo.getByCategoryAndMonth(categoryId, previousMonth)
    if (!previousBudget) {
      return { carryIn: 0, carryOut: 0 }
    }
    
    // Calculate previous month's performance
    const previousLedger = await this.calculateBudgetLedger(categoryId, previousMonth)
    const previousRemaining = previousLedger.remaining
    
    let carryIn = 0
    let carryOut = 0
    
    switch (previousBudget.carryStrategy) {
      case 'carryNone':
        // No carryover
        break
        
      case 'carryUnspent':
        if (previousRemaining > 0) {
          carryIn = previousRemaining
          carryOut = previousRemaining
        }
        break
        
      case 'carryOverspend':
        if (previousRemaining < 0) {
          carryIn = previousRemaining // This will be negative
          carryOut = Math.abs(previousRemaining)
        }
        break
    }
    
    return { carryIn, carryOut }
  }
  
  /**
   * Calculate how much to carry out to next month
   */
  private calculateCarryOutAmount(remaining: number, carryStrategy: Budget['carryStrategy']): number {
    switch (carryStrategy) {
      case 'carryNone':
        return 0
        
      case 'carryUnspent':
        return remaining > 0 ? remaining : 0
        
      case 'carryOverspend':
        return remaining < 0 ? remaining : 0
        
      default:
        return 0
    }
  }
  
  /**
   * Create an empty ledger for categories without budgets
   */
  private createEmptyLedger(categoryId: string, month: string): BudgetLedger {
    return {
      categoryId,
      month,
      entries: [],
      totalBudgeted: 0,
      totalSpent: 0,
      totalCarriedIn: 0,
      totalCarriedOut: 0,
      remaining: 0
    }
  }
  
  /**
   * Get budget progress as percentage
   */
  calculateBudgetProgress(spent: number, budgeted: number): number {
    if (budgeted === 0) return 0
    return Math.min((spent / budgeted) * 100, 100)
  }
  
  /**
   * Check if budget is over spent
   */
  isBudgetOverspent(spent: number, budgeted: number): boolean {
    return spent > budgeted
  }
  
  /**
   * Get budget status
   */
  getBudgetStatus(spent: number, budgeted: number): 'good' | 'warning' | 'danger' {
    if (budgeted === 0) return 'good'
    
    const percentage = (spent / budgeted) * 100
    
    if (percentage > 100) return 'danger'
    if (percentage > 80) return 'warning'
    return 'good'
  }
  
  /**
   * Calculate total budget amount for a month
   */
  async getTotalBudgetForMonth(month: string): Promise<number> {
    const budgets = await budgetRepo.getByMonth(month)
    return budgets.reduce((total, budget) => total + budget.amount, 0)
  }
  
  /**
   * Calculate total spent for a month across all categories
   */
  async getTotalSpentForMonth(month: string): Promise<number> {
    const monthStart = startOfMonth(new Date(month + '-01'))
    const monthEnd = endOfMonth(monthStart)
    
    const transactions = await transactionRepo.getByDateRange(monthStart, monthEnd)
    return Math.abs(
      transactions
        .filter(t => t.amount < 0 && t.categoryId) // Only expenses with categories
        .reduce((sum, t) => sum + t.amount, 0)
    )
  }
}

// Export singleton instance
export const budgetingService = new BudgetingService()