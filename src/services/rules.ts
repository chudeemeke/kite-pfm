import { ruleRepo } from '@/db/repositories'
import type { Rule, RuleCondition, Transaction } from '@/types'

interface RuleMatch {
  rule: Rule
  transaction: Transaction
  appliedActions: string[]
}

interface RulePreview {
  transaction: Transaction
  matchedRules: Rule[]
  proposedChanges: Partial<Transaction>
}

export class RulesService {
  /**
   * Apply all enabled rules to a transaction
   */
  async applyRulesToTransaction(transaction: Transaction): Promise<Transaction> {
    const rules = await ruleRepo.getEnabled()
    let updatedTransaction = { ...transaction }
    
    for (const rule of rules) {
      if (this.doesTransactionMatchRule(updatedTransaction, rule)) {
        updatedTransaction = this.applyRuleActions(updatedTransaction, rule)
        
        if (rule.stopProcessing) {
          break
        }
      }
    }
    
    return updatedTransaction
  }
  
  /**
   * Preview what rules would apply to a transaction
   */
  async previewRulesForTransaction(transaction: Transaction): Promise<RulePreview> {
    const rules = await ruleRepo.getEnabled()
    const matchedRules: Rule[] = []
    let proposedChanges: Partial<Transaction> = {}
    let tempTransaction = { ...transaction }
    
    for (const rule of rules) {
      if (this.doesTransactionMatchRule(tempTransaction, rule)) {
        matchedRules.push(rule)
        
        // Apply the rule to see cumulative effects
        tempTransaction = this.applyRuleActions(tempTransaction, rule)
        
        if (rule.stopProcessing) {
          break
        }
      }
    }
    
    // Calculate the final proposed changes
    if (tempTransaction.categoryId !== transaction.categoryId) {
      proposedChanges.categoryId = tempTransaction.categoryId
    }
    
    if (tempTransaction.isSubscription !== transaction.isSubscription) {
      proposedChanges.isSubscription = tempTransaction.isSubscription
    }
    
    if (tempTransaction.metadata && 
        JSON.stringify(tempTransaction.metadata) !== JSON.stringify(transaction.metadata)) {
      proposedChanges.metadata = tempTransaction.metadata
    }
    
    return {
      transaction,
      matchedRules,
      proposedChanges
    }
  }
  
  /**
   * Bulk apply rules to multiple transactions
   */
  async applyRulesToTransactions(transactions: Transaction[]): Promise<RuleMatch[]> {
    const rules = await ruleRepo.getEnabled()
    const matches: RuleMatch[] = []
    
    for (const transaction of transactions) {
      let updatedTransaction = { ...transaction }
      
      for (const rule of rules) {
        if (this.doesTransactionMatchRule(updatedTransaction, rule)) {
          const originalTransaction = { ...updatedTransaction }
          updatedTransaction = this.applyRuleActions(updatedTransaction, rule)
          
          // Track what actions were applied
          const appliedActions: string[] = []
          
          if (updatedTransaction.categoryId !== originalTransaction.categoryId) {
            appliedActions.push('category')
          }
          
          if (updatedTransaction.isSubscription !== originalTransaction.isSubscription) {
            appliedActions.push('subscription')
          }
          
          if (JSON.stringify(updatedTransaction.metadata) !== JSON.stringify(originalTransaction.metadata)) {
            appliedActions.push('notes')
          }
          
          if (appliedActions.length > 0) {
            matches.push({
              rule,
              transaction: updatedTransaction,
              appliedActions
            })
          }
          
          if (rule.stopProcessing) {
            break
          }
        }
      }
    }
    
    return matches
  }
  
  /**
   * Test if a transaction matches a rule's conditions
   */
  private doesTransactionMatchRule(transaction: Transaction, rule: Rule): boolean {
    return rule.conditions.every(condition => 
      this.evaluateCondition(transaction, condition)
    )
  }
  
  /**
   * Evaluate a single condition against a transaction
   */
  private evaluateCondition(transaction: Transaction, condition: RuleCondition): boolean {
    let value: string | number
    
    switch (condition.field) {
      case 'merchant':
        value = transaction.merchant || ''
        break
      case 'description':
        value = transaction.description
        break
      case 'amount':
        value = Math.abs(transaction.amount) // Use absolute value for comparison
        break
      default:
        return false
    }
    
    switch (condition.op) {
      case 'eq':
        return this.compareEquals(value, condition.value)
        
      case 'contains':
        if (typeof value === 'string' && typeof condition.value === 'string') {
          return value.toLowerCase().includes(condition.value.toLowerCase())
        }
        return false
        
      case 'regex':
        if (typeof value === 'string' && typeof condition.value === 'string') {
          try {
            const regex = new RegExp(condition.value, 'i')
            return regex.test(value)
          } catch {
            return false
          }
        }
        return false
        
      case 'range':
        if (typeof value === 'number' && 
            typeof condition.value === 'object' && 
            condition.value && 
            'min' in condition.value && 
            'max' in condition.value) {
          const range = condition.value as { min: number; max: number }
          return value >= range.min && value <= range.max
        }
        return false
        
      default:
        return false
    }
  }
  
  /**
   * Compare two values for equality
   */
  private compareEquals(value: string | number, conditionValue: string | number | { min: number; max: number }): boolean {
    if (typeof value === 'string' && typeof conditionValue === 'string') {
      return value.toLowerCase() === conditionValue.toLowerCase()
    }
    if (typeof value === 'number' && typeof conditionValue === 'number') {
      return value === conditionValue
    }
    return false
  }
  
  /**
   * Apply rule actions to a transaction
   */
  private applyRuleActions(transaction: Transaction, rule: Rule): Transaction {
    let updatedTransaction = { ...transaction }
    
    rule.actions.forEach(action => {
      if (action.setCategoryId) {
        updatedTransaction.categoryId = action.setCategoryId
      }
      
      if (action.setIsSubscription !== undefined) {
        updatedTransaction.isSubscription = action.setIsSubscription
      }
      
      if (action.setNotesAppend) {
        const metadata = updatedTransaction.metadata || {}
        const existingNotes = (metadata.notes as string) || ''
        const newNotes = existingNotes 
          ? `${existingNotes}\n${action.setNotesAppend}`
          : action.setNotesAppend
        
        updatedTransaction.metadata = {
          ...metadata,
          notes: newNotes
        }
      }
    })
    
    return updatedTransaction
  }
  
  /**
   * Validate a rule's conditions and actions
   */
  validateRule(rule: Omit<Rule, 'id'>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Validate basic fields
    if (!rule.name || rule.name.trim().length === 0) {
      errors.push('Rule name is required')
    }
    
    if (rule.priority < 0) {
      errors.push('Priority must be non-negative')
    }
    
    // Validate conditions
    if (rule.conditions.length === 0) {
      errors.push('At least one condition is required')
    }
    
    rule.conditions.forEach((condition, index) => {
      if (!['merchant', 'description', 'amount'].includes(condition.field)) {
        errors.push(`Condition ${index + 1}: Invalid field`)
      }
      
      if (!['eq', 'contains', 'regex', 'range'].includes(condition.op)) {
        errors.push(`Condition ${index + 1}: Invalid operator`)
      }
      
      if (condition.op === 'range') {
        if (typeof condition.value !== 'object' || 
            !condition.value ||
            !('min' in condition.value) ||
            !('max' in condition.value)) {
          errors.push(`Condition ${index + 1}: Range operator requires min and max values`)
        } else {
          const range = condition.value as { min: number; max: number }
          if (range.min > range.max) {
            errors.push(`Condition ${index + 1}: Range min cannot be greater than max`)
          }
        }
      } else if (!condition.value || 
                (typeof condition.value === 'string' && condition.value.trim().length === 0)) {
        errors.push(`Condition ${index + 1}: Value is required`)
      }
    })
    
    // Validate actions
    if (rule.actions.length === 0) {
      errors.push('At least one action is required')
    }
    
    rule.actions.forEach((action, index) => {
      let hasAction = false
      
      if (action.setCategoryId) {
        hasAction = true
        if (action.setCategoryId.trim().length === 0) {
          errors.push(`Action ${index + 1}: Category ID cannot be empty`)
        }
      }
      
      if (action.setIsSubscription !== undefined) {
        hasAction = true
      }
      
      if (action.setNotesAppend) {
        hasAction = true
        if (action.setNotesAppend.trim().length === 0) {
          errors.push(`Action ${index + 1}: Notes cannot be empty`)
        }
      }
      
      if (!hasAction) {
        errors.push(`Action ${index + 1}: No action specified`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Test rule against sample data
   */
  testRule(rule: Rule, sampleTransactions: Transaction[]): RulePreview[] {
    return sampleTransactions
      .map(transaction => ({
        transaction,
        matchedRules: this.doesTransactionMatchRule(transaction, rule) ? [rule] : [],
        proposedChanges: this.doesTransactionMatchRule(transaction, rule) 
          ? this.getProposedChanges(transaction, rule)
          : {}
      }))
      .filter(preview => preview.matchedRules.length > 0)
  }
  
  /**
   * Get proposed changes for a transaction from a rule
   */
  private getProposedChanges(transaction: Transaction, rule: Rule): Partial<Transaction> {
    const updatedTransaction = this.applyRuleActions(transaction, rule)
    const changes: Partial<Transaction> = {}
    
    if (updatedTransaction.categoryId !== transaction.categoryId) {
      changes.categoryId = updatedTransaction.categoryId
    }
    
    if (updatedTransaction.isSubscription !== transaction.isSubscription) {
      changes.isSubscription = updatedTransaction.isSubscription
    }
    
    if (JSON.stringify(updatedTransaction.metadata) !== JSON.stringify(transaction.metadata)) {
      changes.metadata = updatedTransaction.metadata
    }
    
    return changes
  }
}

// Export singleton instance
export const rulesService = new RulesService()