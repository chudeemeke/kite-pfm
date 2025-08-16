/**
 * Advanced Transaction Repository
 * Sophisticated transaction data management with advanced features
 */

import { BaseRepository, ValidationRules, QueryOptions, PaginatedResult } from './BaseRepository'
import type { Transaction, Category, Account } from '@/types'
import { db } from '../schema'
import { databaseManager } from '../DatabaseManager'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from 'date-fns'

interface TransactionEntity extends Transaction {
  createdAt: Date
  createdBy?: string
  updatedAt?: Date
  updatedBy?: string
  version: number
  isDeleted?: boolean
  deletedAt?: Date
  deletedBy?: string
}

interface TransactionFilters {
  accountIds?: string[]
  categoryIds?: string[]
  dateFrom?: Date
  dateTo?: Date
  amountMin?: number
  amountMax?: number
  type?: 'income' | 'expense' | 'transfer'
  merchants?: string[]
  tags?: string[]
  isRecurring?: boolean
  hasAttachments?: boolean
  searchText?: string
}

interface TransactionStats {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  averageTransaction: number
  transactionCount: number
  largestIncome: Transaction | null
  largestExpense: Transaction | null
  mostFrequentMerchant: string | null
  mostUsedCategory: string | null
  dailyAverage: number
  monthlyAverage: number
}

interface SpendingPattern {
  dayOfWeek: number
  hourOfDay: number
  frequency: number
  avgAmount: number
  totalAmount: number
}

export class TransactionRepository extends BaseRepository<TransactionEntity> {
  constructor() {
    super('transactions', true) // Enable soft delete
  }
  
  /**
   * Setup relationships
   */
  protected setupRelationships(): void {
    this.relationships.set('account', {
      type: 'belongsTo',
      relatedTable: 'accounts',
      foreignKey: 'accountId'
    })
    
    this.relationships.set('category', {
      type: 'belongsTo',
      relatedTable: 'categories',
      foreignKey: 'categoryId'
    })
    
    this.relationships.set('attachments', {
      type: 'hasMany',
      relatedTable: 'attachments',
      foreignKey: 'transactionId'
    })
    
    this.relationships.set('tags', {
      type: 'belongsToMany',
      relatedTable: 'tags',
      pivotTable: 'transactionTags',
      pivotLocalKey: 'transactionId',
      pivotForeignKey: 'tagId'
    })
  }
  
  /**
   * Setup validation rules
   */
  protected setupValidation(): void {
    this.validationRules.set('accountId', [
      ValidationRules.required('Account is required'),
      ValidationRules.custom(
        async (value) => {
          const account = await db.accounts.get(value)
          return account !== undefined
        },
        'Invalid account ID'
      )
    ])
    
    this.validationRules.set('amount', [
      ValidationRules.required('Amount is required'),
      ValidationRules.custom(
        (value) => typeof value === 'number' && !isNaN(value),
        'Amount must be a valid number'
      )
    ])
    
    this.validationRules.set('date', [
      ValidationRules.required('Date is required'),
      ValidationRules.custom(
        (value) => value instanceof Date && !isNaN(value.getTime()),
        'Invalid date'
      )
    ])
    
    this.validationRules.set('categoryId', [
      ValidationRules.custom(
        async (value) => {
          if (!value) return true // Category is optional
          const category = await db.categories.get(value)
          return category !== undefined
        },
        'Invalid category ID'
      )
    ])
    
    this.validationRules.set('currency', [
      ValidationRules.required('Currency is required'),
      ValidationRules.pattern(
        /^[A-Z]{3}$/,
        'Currency must be a 3-letter code'
      )
    ])
  }
  
  /**
   * Setup indexes for optimization
   */
  protected setupIndexes(): void {
    this.indexes.add('accountId')
    this.indexes.add('categoryId')
    this.indexes.add('date')
    this.indexes.add('amount')
    this.indexes.add('merchant')
  }
  
  /**
   * Advanced transaction search with filters
   */
  async search(
    filters: TransactionFilters,
    options?: QueryOptions<TransactionEntity>
  ): Promise<TransactionEntity[]> {
    return databaseManager.queryCached(
      async () => {
        let query = this.table.toCollection()
        
        // Apply filters
        if (filters.accountIds?.length) {
          query = query.and(t => filters.accountIds!.includes(t.accountId))
        }
        
        if (filters.categoryIds?.length) {
          query = query.and(t => t.categoryId ? filters.categoryIds!.includes(t.categoryId) : false)
        }
        
        if (filters.dateFrom) {
          query = query.and(t => t.date >= filters.dateFrom!)
        }
        
        if (filters.dateTo) {
          query = query.and(t => t.date <= filters.dateTo!)
        }
        
        if (filters.amountMin !== undefined) {
          query = query.and(t => Math.abs(t.amount) >= filters.amountMin!)
        }
        
        if (filters.amountMax !== undefined) {
          query = query.and(t => Math.abs(t.amount) <= filters.amountMax!)
        }
        
        if (filters.type) {
          switch (filters.type) {
            case 'income':
              query = query.and(t => t.amount > 0)
              break
            case 'expense':
              query = query.and(t => t.amount < 0)
              break
            case 'transfer':
              query = query.and(t => t.isTransfer === true)
              break
          }
        }
        
        if (filters.merchants?.length) {
          query = query.and(t => t.merchant ? filters.merchants!.includes(t.merchant) : false)
        }
        
        if (filters.tags?.length) {
          query = query.and(t => 
            t.tags ? filters.tags!.some(tag => t.tags!.includes(tag)) : false
          )
        }
        
        if (filters.isRecurring !== undefined) {
          query = query.and(t => t.recurring === filters.isRecurring)
        }
        
        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase()
          query = query.and(t => 
            t.description?.toLowerCase().includes(searchLower) ||
            t.merchant?.toLowerCase().includes(searchLower) ||
            t.notes?.toLowerCase().includes(searchLower)
          )
        }
        
        // Apply soft delete filter
        if (this.softDelete) {
          query = query.and(t => !t.isDeleted)
        }
        
        let results = await query.toArray()
        
        // Apply additional query options
        if (options?.orderBy) {
          const field = options.orderBy as string
          const direction = options.orderDirection || 'asc'
          results.sort((a, b) => {
            const aVal = (a as any)[field]
            const bVal = (b as any)[field]
            return direction === 'asc' ? 
              (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) :
              (bVal < aVal ? -1 : bVal > aVal ? 1 : 0)
          })
        }
        
        if (options?.limit) {
          results = results.slice(
            options.offset || 0,
            (options.offset || 0) + options.limit
          )
        }
        
        return results
      },
      `transactions:search:${JSON.stringify(filters)}:${JSON.stringify(options)}`,
      30000 // Cache for 30 seconds
    )
  }
  
  /**
   * Get transaction statistics
   */
  async getStatistics(
    filters?: TransactionFilters,
    period?: { from: Date; to: Date }
  ): Promise<TransactionStats> {
    const transactions = await this.search(filters || {})
    
    // Filter by period if provided
    const periodTransactions = period
      ? transactions.filter(t => t.date >= period.from && t.date <= period.to)
      : transactions
    
    const incomeTransactions = periodTransactions.filter(t => t.amount > 0)
    const expenseTransactions = periodTransactions.filter(t => t.amount < 0)
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = Math.abs(expenseTransactions.reduce((sum, t) => sum + t.amount, 0))
    
    // Find most frequent merchant
    const merchantCounts = new Map<string, number>()
    periodTransactions.forEach(t => {
      if (t.merchant) {
        merchantCounts.set(t.merchant, (merchantCounts.get(t.merchant) || 0) + 1)
      }
    })
    const mostFrequentMerchant = [...merchantCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null
    
    // Find most used category
    const categoryCounts = new Map<string, number>()
    periodTransactions.forEach(t => {
      if (t.categoryId) {
        categoryCounts.set(t.categoryId, (categoryCounts.get(t.categoryId) || 0) + 1)
      }
    })
    const mostUsedCategory = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null
    
    // Calculate daily and monthly averages
    const dayCount = period
      ? Math.ceil((period.to.getTime() - period.from.getTime()) / (1000 * 60 * 60 * 24))
      : 30
    const monthCount = dayCount / 30
    
    return {
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses,
      averageTransaction: periodTransactions.length > 0
        ? periodTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / periodTransactions.length
        : 0,
      transactionCount: periodTransactions.length,
      largestIncome: incomeTransactions.sort((a, b) => b.amount - a.amount)[0] || null,
      largestExpense: expenseTransactions.sort((a, b) => a.amount - b.amount)[0] || null,
      mostFrequentMerchant,
      mostUsedCategory,
      dailyAverage: (totalIncome - totalExpenses) / dayCount,
      monthlyAverage: (totalIncome - totalExpenses) / monthCount
    }
  }
  
  /**
   * Analyze spending patterns
   */
  async analyzeSpendingPatterns(
    accountId?: string,
    categoryId?: string,
    period?: { from: Date; to: Date }
  ): Promise<SpendingPattern[]> {
    const filters: TransactionFilters = {}
    
    if (accountId) filters.accountIds = [accountId]
    if (categoryId) filters.categoryIds = [categoryId]
    if (period) {
      filters.dateFrom = period.from
      filters.dateTo = period.to
    }
    
    const transactions = await this.search(filters)
    const patterns = new Map<string, SpendingPattern>()
    
    transactions.forEach(t => {
      const dayOfWeek = t.date.getDay()
      const hourOfDay = t.date.getHours()
      const key = `${dayOfWeek}-${hourOfDay}`
      
      if (!patterns.has(key)) {
        patterns.set(key, {
          dayOfWeek,
          hourOfDay,
          frequency: 0,
          avgAmount: 0,
          totalAmount: 0
        })
      }
      
      const pattern = patterns.get(key)!
      pattern.frequency++
      pattern.totalAmount += Math.abs(t.amount)
      pattern.avgAmount = pattern.totalAmount / pattern.frequency
    })
    
    return Array.from(patterns.values()).sort((a, b) => 
      a.dayOfWeek * 24 + a.hourOfDay - (b.dayOfWeek * 24 + b.hourOfDay)
    )
  }
  
  /**
   * Detect duplicate transactions
   */
  async detectDuplicates(
    threshold: number = 60000 // 1 minute in milliseconds
  ): Promise<Array<TransactionEntity[]>> {
    const transactions = await this.findAll({ orderBy: 'date' })
    const duplicateGroups: Array<TransactionEntity[]> = []
    const processed = new Set<string>()
    
    for (let i = 0; i < transactions.length; i++) {
      if (processed.has(transactions[i].id)) continue
      
      const group = [transactions[i]]
      processed.add(transactions[i].id)
      
      for (let j = i + 1; j < transactions.length; j++) {
        const timeDiff = Math.abs(
          transactions[j].date.getTime() - transactions[i].date.getTime()
        )
        
        if (
          timeDiff <= threshold &&
          transactions[j].amount === transactions[i].amount &&
          transactions[j].accountId === transactions[i].accountId &&
          transactions[j].merchant === transactions[i].merchant &&
          !processed.has(transactions[j].id)
        ) {
          group.push(transactions[j])
          processed.add(transactions[j].id)
        }
      }
      
      if (group.length > 1) {
        duplicateGroups.push(group)
      }
    }
    
    return duplicateGroups
  }
  
  /**
   * Merge duplicate transactions
   */
  async mergeDuplicates(
    duplicates: TransactionEntity[],
    keepFirst: boolean = true,
    userId?: string
  ): Promise<TransactionEntity> {
    if (duplicates.length < 2) {
      throw new Error('At least 2 transactions required for merge')
    }
    
    // Sort by date to determine which to keep
    duplicates.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    const toKeep = keepFirst ? duplicates[0] : duplicates[duplicates.length - 1]
    const toDelete = duplicates.filter(t => t.id !== toKeep.id)
    
    return databaseManager.executeTransaction(async (tx) => {
      // Merge metadata
      const mergedTags = new Set<string>()
      const mergedNotes: string[] = []
      
      duplicates.forEach(t => {
        if (t.tags) t.tags.forEach(tag => mergedTags.add(tag))
        if (t.notes) mergedNotes.push(t.notes)
      })
      
      // Update the transaction we're keeping
      const updated = await this.update(
        toKeep.id,
        {
          tags: Array.from(mergedTags),
          notes: mergedNotes.join('\n'),
          metadata: {
            ...toKeep.metadata,
            mergedFrom: toDelete.map(t => t.id),
            mergedAt: new Date()
          }
        },
        userId
      )
      
      // Delete the duplicates
      for (const transaction of toDelete) {
        await this.delete(transaction.id, userId)
      }
      
      return updated
    })
  }
  
  /**
   * Auto-categorize transactions
   */
  async autoCategorize(
    transactionIds?: string[],
    userId?: string
  ): Promise<number> {
    const transactions = transactionIds
      ? await Promise.all(transactionIds.map(id => this.findById(id)))
      : await this.findAll({ where: { categoryId: undefined } as any })
    
    let categorized = 0
    
    for (const transaction of transactions.filter(t => t !== null)) {
      if (!transaction || transaction.categoryId) continue
      
      // Get categorization rules
      const rules = await db.table('rules')
        .where('enabled')
        .equals(true)
        .toArray()
      
      for (const rule of rules.sort((a, b) => (a as any).priority - (b as any).priority)) {
        let matches = true
        
        // Check conditions
        for (const condition of (rule as any).conditions || []) {
          const value = (transaction as any)[condition.field]
          
          switch (condition.op) {
            case 'eq':
              matches = value === condition.value
              break
            case 'contains':
              matches = value?.toLowerCase().includes(condition.value.toLowerCase())
              break
            case 'gt':
              matches = value > condition.value
              break
            case 'lt':
              matches = value < condition.value
              break
            default:
              matches = false
          }
          
          if (!matches) break
        }
        
        if (matches) {
          // Apply actions
          const updates: any = {}
          
          for (const action of (rule as any).actions || []) {
            if (action.setCategoryId) {
              updates.categoryId = action.setCategoryId
            }
            if (action.addTag) {
              updates.tags = [...(transaction.tags || []), action.addTag]
            }
          }
          
          if (Object.keys(updates).length > 0) {
            await this.update(transaction.id, updates, userId)
            categorized++
          }
          
          // Stop processing if rule says so
          if ((rule as any).stopProcessing) break
        }
      }
    }
    
    return categorized
  }
  
  /**
   * Calculate running balance
   */
  async calculateRunningBalance(
    accountId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ date: Date; balance: number; transaction: TransactionEntity }>> {
    const transactions = await this.search(
      {
        accountIds: [accountId],
        dateFrom: startDate,
        dateTo: endDate
      },
      { orderBy: 'date', orderDirection: 'asc' }
    )
    
    // Get initial balance
    const account = await db.accounts.get(accountId)
    let runningBalance = account?.balance || 0
    
    // If we have a start date, calculate balance up to that point
    if (startDate) {
      const priorTransactions = await this.search({
        accountIds: [accountId],
        dateTo: startDate
      })
      
      const priorBalance = priorTransactions.reduce((sum, t) => sum + t.amount, 0)
      runningBalance = priorBalance
    }
    
    // Calculate running balance
    const balanceHistory: Array<{
      date: Date
      balance: number
      transaction: TransactionEntity
    }> = []
    
    for (const transaction of transactions) {
      runningBalance += transaction.amount
      balanceHistory.push({
        date: transaction.date,
        balance: runningBalance,
        transaction
      })
    }
    
    return balanceHistory
  }
  
  /**
   * Get monthly summaries
   */
  async getMonthlySummaries(
    accountId?: string,
    months: number = 12
  ): Promise<Array<{
    month: string
    income: number
    expenses: number
    netCashFlow: number
    transactionCount: number
    avgTransaction: number
  }>> {
    const summaries = []
    const now = new Date()
    
    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(now, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      
      const stats = await this.getStatistics(
        accountId ? { accountIds: [accountId] } : undefined,
        { from: monthStart, to: monthEnd }
      )
      
      summaries.push({
        month: format(monthDate, 'yyyy-MM'),
        income: stats.totalIncome,
        expenses: stats.totalExpenses,
        netCashFlow: stats.netCashFlow,
        transactionCount: stats.transactionCount,
        avgTransaction: stats.averageTransaction
      })
    }
    
    return summaries.reverse()
  }
  
  /**
   * Batch import transactions
   */
  async importTransactions(
    transactions: Array<Omit<Transaction, 'id'>>,
    options?: {
      detectDuplicates?: boolean
      autoCategorize?: boolean
      validateBalances?: boolean
    },
    userId?: string,
    onProgress?: (processed: number, total: number) => void
  ): Promise<{
    imported: number
    duplicates: number
    errors: Array<{ transaction: any; error: string }>
  }> {
    const results = {
      imported: 0,
      duplicates: 0,
      errors: [] as Array<{ transaction: any; error: string }>
    }
    
    const batchSize = 50
    const total = transactions.length
    
    for (let i = 0; i < total; i += batchSize) {
      const batch = transactions.slice(i, Math.min(i + batchSize, total))
      
      for (const transaction of batch) {
        try {
          // Check for duplicates
          if (options?.detectDuplicates) {
            const existing = await this.search({
              accountIds: [transaction.accountId],
              dateFrom: new Date(transaction.date.getTime() - 60000),
              dateTo: new Date(transaction.date.getTime() + 60000),
              amountMin: Math.abs(transaction.amount) - 0.01,
              amountMax: Math.abs(transaction.amount) + 0.01
            })
            
            if (existing.length > 0) {
              results.duplicates++
              continue
            }
          }
          
          // Create transaction
          const created = await this.create(transaction as any, userId)
          
          // Auto-categorize if requested
          if (options?.autoCategorize && !created.categoryId) {
            await this.autoCategorize([created.id], userId)
          }
          
          results.imported++
        } catch (error) {
          results.errors.push({
            transaction,
            error: (error as Error).message
          })
        }
      }
      
      onProgress?.(i + batch.length, total)
    }
    
    // Validate account balances if requested
    if (options?.validateBalances) {
      const accountIds = [...new Set(transactions.map(t => t.accountId))]
      
      for (const accountId of accountIds) {
        const account = await db.accounts.get(accountId)
        if (!account) continue
        
        const transactions = await this.search({ accountIds: [accountId] })
        const calculatedBalance = transactions.reduce((sum, t) => sum + t.amount, 0)
        
        if (Math.abs(account.balance - calculatedBalance) > 0.01) {
          console.warn(`Balance mismatch for account ${accountId}: stored ${account.balance}, calculated ${calculatedBalance}`)
        }
      }
    }
    
    return results
  }
}

// Export singleton instance
export const transactionRepository = new TransactionRepository()