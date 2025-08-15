import { describe, it, expect } from 'vitest'
import { formatService } from '../format'

describe('FormatService', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatService.formatCurrency(1234.56)).toBe('£1,234.56')
      expect(formatService.formatCurrency(0)).toBe('£0.00')
    })
    
    it('should format negative amounts correctly', () => {
      expect(formatService.formatCurrency(-1234.56)).toBe('-£1,234.56')
    })
    
    it('should handle different currencies', () => {
      expect(formatService.formatCurrency(1234.56, 'USD')).toBe('US$1,234.56')
      expect(formatService.formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
    })
  })
  
  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatService.formatPercentage(75)).toBe('75.0%')
      expect(formatService.formatPercentage(100)).toBe('100.0%')
      expect(formatService.formatPercentage(0)).toBe('0.0%')
    })
    
    it('should handle decimal places', () => {
      expect(formatService.formatPercentage(75.5, 2)).toBe('75.50%')
      expect(formatService.formatPercentage(75, 0)).toBe('75%')
    })
  })
  
  describe('formatAccountType', () => {
    it('should format account types correctly', () => {
      expect(formatService.formatAccountType('checking')).toBe('Current Account')
      expect(formatService.formatAccountType('savings')).toBe('Savings Account')
      expect(formatService.formatAccountType('credit')).toBe('Credit Card')
      expect(formatService.formatAccountType('unknown')).toBe('unknown')
    })
  })
  
  describe('formatTransactionAmount', () => {
    it('should identify positive and negative amounts', () => {
      const positive = formatService.formatTransactionAmount(100)
      expect(positive.isPositive).toBe(true)
      expect(positive.isNegative).toBe(false)
      expect(positive.formatted).toBe('£100.00')
      
      const negative = formatService.formatTransactionAmount(-100)
      expect(negative.isPositive).toBe(false)
      expect(negative.isNegative).toBe(true)
      expect(negative.formatted).toBe('-£100.00')
    })
  })
  
  describe('truncateText', () => {
    it('should truncate long text', () => {
      expect(formatService.truncateText('Hello World', 5)).toBe('He...')
      expect(formatService.truncateText('Hi', 10)).toBe('Hi')
    })
    
    it('should use custom suffix', () => {
      expect(formatService.truncateText('Hello World', 5, '...')).toBe('He...')
      expect(formatService.truncateText('Hello World', 5, '…')).toBe('Hell…')
    })
  })
  
  describe('formatInitials', () => {
    it('should generate initials from names', () => {
      expect(formatService.formatInitials('John Doe')).toBe('JD')
      expect(formatService.formatInitials('Alice Bob Charlie')).toBe('AB')
      expect(formatService.formatInitials('SingleName')).toBe('S')
    })
  })
})