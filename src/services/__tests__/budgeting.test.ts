import { describe, it, expect } from 'vitest'
import { budgetingService } from '../budgeting'

describe('BudgetingService', () => {
  describe('calculateBudgetProgress', () => {
    it('should calculate progress correctly', () => {
      expect(budgetingService.calculateBudgetProgress(50, 100)).toBe(50)
      expect(budgetingService.calculateBudgetProgress(100, 100)).toBe(100)
      expect(budgetingService.calculateBudgetProgress(150, 100)).toBe(100)
      expect(budgetingService.calculateBudgetProgress(0, 100)).toBe(0)
    })
    
    it('should handle zero budget', () => {
      expect(budgetingService.calculateBudgetProgress(50, 0)).toBe(0)
    })
  })
  
  describe('isBudgetOverspent', () => {
    it('should detect overspending', () => {
      expect(budgetingService.isBudgetOverspent(150, 100)).toBe(true)
      expect(budgetingService.isBudgetOverspent(100, 100)).toBe(false)
      expect(budgetingService.isBudgetOverspent(50, 100)).toBe(false)
    })
  })
  
  describe('getBudgetStatus', () => {
    it('should return correct status', () => {
      expect(budgetingService.getBudgetStatus(50, 100)).toBe('good')
      expect(budgetingService.getBudgetStatus(85, 100)).toBe('warning')
      expect(budgetingService.getBudgetStatus(150, 100)).toBe('danger')
      expect(budgetingService.getBudgetStatus(50, 0)).toBe('good')
    })
  })
})