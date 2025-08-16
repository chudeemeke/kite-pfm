/**
 * Advanced Insights Service
 * Provides sophisticated financial analytics, trend analysis, and predictions
 * Uses ML-like algorithms for anomaly detection and spending predictions
 */

import { db } from '@/db/schema'
import type {
  Transaction,
  Category,
  InsightPeriod,
  SpendingTrend,
  CategoryInsight,
  MerchantSpending,
  CashFlowInsight,
  PredictiveInsight,
  AnomalyInsight,
  InsightSummary,
  Goal
} from '@/types'
import { v4 as uuidv4 } from 'uuid'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
  subYears,
  format,
  differenceInDays,
  eachMonthOfInterval,
  eachWeekOfInterval,
  isWithinInterval,
  addMonths
} from 'date-fns'

export class InsightsService {
  private readonly ANOMALY_THRESHOLD = 2.5 // Standard deviations for anomaly detection
  private readonly MIN_TRANSACTIONS_FOR_PREDICTION = 30
  private readonly CONFIDENCE_THRESHOLD = 70

  /**
   * Get comprehensive insights for a time period
   */
  async getInsightSummary(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year' | 'custom',
    customPeriod?: { start: Date; end: Date }
  ): Promise<InsightSummary> {
    const insightPeriod = this.getPeriodBounds(period, customPeriod)
    
    // Fetch all required data
    const transactions = await this.getTransactionsForPeriod(insightPeriod)
    const categories = await db.categories.toArray()
    const goals = await db.goals.where('userId').equals(userId).toArray()
    
    // Generate insights
    const cashFlow = await this.analyzeCashFlow(transactions, categories, insightPeriod)
    const trends = await this.analyzeSpendingTrends(transactions, insightPeriod)
    const categoryInsights = await this.analyzeCategorySpending(transactions, categories, insightPeriod)
    const predictions = await this.generatePredictions(transactions)
    const anomalies = await this.detectAnomalies(transactions, insightPeriod)
    const goalProgress = await this.analyzeGoalProgress(goals)
    
    return {
      period: insightPeriod,
      cashFlow,
      trends,
      categories: categoryInsights,
      predictions,
      anomalies,
      goalProgress
    }
  }

  /**
   * Analyze cash flow for the period
   */
  private async analyzeCashFlow(
    transactions: Transaction[],
    categories: Category[],
    period: InsightPeriod
  ): Promise<CashFlowInsight> {
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = Math.abs(
      transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    )
    
    const netFlow = income - expenses
    const savingsRate = income > 0 ? (netFlow / income) * 100 : 0
    
    // Analyze by category
    const categoryMap = new Map<string, CategoryInsight>()
    
    for (const transaction of transactions.filter(t => t.amount < 0)) {
      if (!transaction.categoryId) continue
      
      const category = categories.find(c => c.id === transaction.categoryId)
      if (!category) continue
      
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          categoryId: category.id,
          categoryName: category.name,
          totalSpent: 0,
          percentage: 0,
          transactionCount: 0,
          averageTransaction: 0,
          trend: 'stable',
          trendPercentage: 0
        })
      }
      
      const insight = categoryMap.get(category.id)!
      insight.totalSpent += Math.abs(transaction.amount)
      insight.transactionCount++
    }
    
    // Calculate percentages and averages
    const categoryInsights = Array.from(categoryMap.values()).map(insight => ({
      ...insight,
      percentage: expenses > 0 ? (insight.totalSpent / expenses) * 100 : 0,
      averageTransaction: insight.transactionCount > 0 
        ? insight.totalSpent / insight.transactionCount 
        : 0
    }))
    
    // Sort by spending amount
    categoryInsights.sort((a, b) => b.totalSpent - a.totalSpent)
    
    return {
      period,
      income,
      expenses,
      netFlow,
      savingsRate,
      categories: categoryInsights
    }
  }

  /**
   * Analyze spending trends over time
   */
  private async analyzeSpendingTrends(
    transactions: Transaction[],
    period: InsightPeriod
  ): Promise<SpendingTrend[]> {
    const trends: SpendingTrend[] = []
    
    // Determine intervals based on period duration
    const periodDays = differenceInDays(period.end, period.start)
    const intervals = this.getAnalysisIntervals(period.start, period.end, periodDays)
    
    // Get previous period for comparison
    const previousPeriod = this.getPreviousPeriod(period)
    const previousTransactions = await this.getTransactionsForPeriod(previousPeriod)
    
    for (const interval of intervals) {
      const intervalTransactions = transactions.filter(t =>
        isWithinInterval(t.date, { start: interval.start, end: interval.end })
      )
      
      const totalSpent = Math.abs(
        intervalTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)
      )
      
      const transactionCount = intervalTransactions.length
      const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0
      
      // Calculate percentage change vs previous period
      const previousInterval = this.findCorrespondingInterval(
        interval,
        previousPeriod,
        previousTransactions
      )
      
      const percentageChange = previousInterval.totalSpent > 0
        ? ((totalSpent - previousInterval.totalSpent) / previousInterval.totalSpent) * 100
        : 0
      
      // Detect anomalies
      const isAnomaly = await this.isSpendingAnomaly(
        totalSpent,
        transactions,
        interval
      )
      
      trends.push({
        period: interval,
        totalSpent,
        transactionCount,
        averageTransaction,
        percentageChange,
        isAnomaly
      })
    }
    
    return trends
  }

  /**
   * Analyze spending by category with trends
   */
  private async analyzeCategorySpending(
    transactions: Transaction[],
    categories: Category[],
    period: InsightPeriod
  ): Promise<CategoryInsight[]> {
    const categoryInsights: CategoryInsight[] = []
    
    // Get previous period for trend analysis
    const previousPeriod = this.getPreviousPeriod(period)
    const previousTransactions = await this.getTransactionsForPeriod(previousPeriod)
    
    for (const category of categories) {
      const categoryTransactions = transactions.filter(
        t => t.categoryId === category.id && t.amount < 0
      )
      
      if (categoryTransactions.length === 0) continue
      
      const totalSpent = Math.abs(
        categoryTransactions.reduce((sum, t) => sum + t.amount, 0)
      )
      
      const transactionCount = categoryTransactions.length
      const averageTransaction = totalSpent / transactionCount
      
      // Calculate trend
      const previousCategoryTransactions = previousTransactions.filter(
        t => t.categoryId === category.id && t.amount < 0
      )
      
      const previousTotal = Math.abs(
        previousCategoryTransactions.reduce((sum, t) => sum + t.amount, 0)
      )
      
      const trendPercentage = previousTotal > 0
        ? ((totalSpent - previousTotal) / previousTotal) * 100
        : 0
      
      const trend = trendPercentage > 10 
        ? 'increasing' 
        : trendPercentage < -10 
          ? 'decreasing' 
          : 'stable'
      
      // Get top merchants
      const merchantMap = new Map<string, MerchantSpending>()
      
      for (const transaction of categoryTransactions) {
        const merchant = transaction.merchant || 'Unknown'
        
        if (!merchantMap.has(merchant)) {
          merchantMap.set(merchant, {
            merchant,
            amount: 0,
            count: 0,
            lastTransaction: transaction.date
          })
        }
        
        const spending = merchantMap.get(merchant)!
        spending.amount += Math.abs(transaction.amount)
        spending.count++
        if (transaction.date > spending.lastTransaction) {
          spending.lastTransaction = transaction.date
        }
      }
      
      const topMerchants = Array.from(merchantMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
      
      // Calculate percentage of total expenses
      const totalExpenses = Math.abs(
        transactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)
      )
      
      const percentage = totalExpenses > 0 ? (totalSpent / totalExpenses) * 100 : 0
      
      categoryInsights.push({
        categoryId: category.id,
        categoryName: category.name,
        totalSpent,
        percentage,
        transactionCount,
        averageTransaction,
        trend,
        trendPercentage,
        topMerchants
      })
    }
    
    // Sort by spending amount
    return categoryInsights.sort((a, b) => b.totalSpent - a.totalSpent)
  }

  /**
   * Generate spending predictions using simple moving averages and trends
   */
  private async generatePredictions(
    transactions: Transaction[]
  ): Promise<PredictiveInsight[]> {
    const predictions: PredictiveInsight[] = []
    
    if (transactions.length < this.MIN_TRANSACTIONS_FOR_PREDICTION) {
      return predictions
    }
    
    // Predict next month's spending
    const monthlySpending = this.calculateMonthlyAverages(transactions)
    const trend = this.calculateSpendingTrend(monthlySpending)
    
    const nextMonthPrediction = this.predictNextMonth(monthlySpending, trend)
    
    predictions.push({
      type: 'spending',
      prediction: nextMonthPrediction.amount,
      confidence: nextMonthPrediction.confidence,
      basis: `Based on ${monthlySpending.length} months of data with ${trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'} trend`,
      recommendations: this.generateSpendingRecommendations(nextMonthPrediction.amount, trend)
    })
    
    // Predict savings potential
    const incomeTransactions = transactions.filter(t => t.amount > 0)
    const expenseTransactions = transactions.filter(t => t.amount < 0)
    
    if (incomeTransactions.length > 0 && expenseTransactions.length > 0) {
      const avgIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length
      const avgExpense = Math.abs(expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length)
      
      const savingsPotential = avgIncome - avgExpense
      const savingsConfidence = Math.min(
        100,
        Math.max(
          50,
          100 - (this.calculateVariance(incomeTransactions.map(t => t.amount)) * 10)
        )
      )
      
      predictions.push({
        type: 'saving',
        prediction: savingsPotential,
        confidence: savingsConfidence,
        basis: 'Average income minus average expenses',
        recommendations: savingsPotential > 0
          ? [`You could save ${savingsPotential.toFixed(2)} per month`, 'Consider setting up automatic transfers']
          : ['Focus on reducing expenses', 'Look for additional income sources']
      })
    }
    
    // Predict budget overruns
    const budgets = await db.budgets
      .where('month')
      .equals(format(new Date(), 'yyyy-MM'))
      .toArray()
    
    for (const budget of budgets) {
      const categoryTransactions = transactions.filter(
        t => t.categoryId === budget.categoryId && t.amount < 0
      )
      
      if (categoryTransactions.length > 0) {
        const currentSpending = Math.abs(
          categoryTransactions.reduce((sum, t) => sum + t.amount, 0)
        )
        
        const daysInMonth = new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0
        ).getDate()
        
        const daysPassed = new Date().getDate()
        const projectedSpending = (currentSpending / daysPassed) * daysInMonth
        
        if (projectedSpending > budget.amount * 1.1) {
          const category = await db.categories.get(budget.categoryId)
          
          predictions.push({
            type: 'budget',
            prediction: projectedSpending,
            confidence: Math.min(100, 50 + (daysPassed / daysInMonth) * 50),
            basis: `Current spending rate in ${category?.name || 'category'}`,
            recommendations: [
              `Projected to exceed budget by ${(projectedSpending - budget.amount).toFixed(2)}`,
              'Reduce spending in this category',
              'Consider adjusting the budget if necessary'
            ]
          })
        }
      }
    }
    
    return predictions
  }

  /**
   * Detect spending anomalies using statistical analysis
   */
  private async detectAnomalies(
    transactions: Transaction[],
    period: InsightPeriod
  ): Promise<AnomalyInsight[]> {
    const anomalies: AnomalyInsight[] = []
    
    // Detect unusually large transactions
    const amounts = transactions.map(t => Math.abs(t.amount))
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
    const stdDev = Math.sqrt(
      amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length
    )
    
    for (const transaction of transactions) {
      const amount = Math.abs(transaction.amount)
      const zScore = (amount - mean) / stdDev
      
      if (zScore > this.ANOMALY_THRESHOLD) {
        anomalies.push({
          id: uuidv4(),
          type: 'large_transaction',
          severity: zScore > 4 ? 'alert' : zScore > 3 ? 'warning' : 'info',
          transactionIds: [transaction.id],
          amount: transaction.amount,
          description: `Transaction of ${amount.toFixed(2)} is ${zScore.toFixed(1)} standard deviations above average`,
          detectedAt: new Date(),
          dismissed: false
        })
      }
    }
    
    // Detect duplicate transactions
    const duplicates = this.findDuplicateTransactions(transactions)
    
    for (const duplicate of duplicates) {
      anomalies.push({
        id: uuidv4(),
        type: 'duplicate',
        severity: 'warning',
        transactionIds: duplicate.ids,
        amount: duplicate.amount,
        description: `Possible duplicate transactions: ${duplicate.count} transactions of ${duplicate.amount.toFixed(2)} to ${duplicate.merchant}`,
        detectedAt: new Date(),
        dismissed: false
      })
    }
    
    // Detect unusual spending patterns
    const patterns = await this.detectUnusualPatterns(transactions, period)
    anomalies.push(...patterns)
    
    // Store anomalies in database
    for (const anomaly of anomalies) {
      const exists = await db.anomalyInsights
        .where('transactionIds')
        .equals(anomaly.transactionIds)
        .first()
      
      if (!exists) {
        await db.anomalyInsights.add(anomaly)
      }
    }
    
    return anomalies
  }

  /**
   * Find duplicate transactions
   */
  private findDuplicateTransactions(transactions: Transaction[]): {
    ids: string[]
    amount: number
    merchant: string
    count: number
  }[] {
    const duplicates: Map<string, Transaction[]> = new Map()
    
    for (const transaction of transactions) {
      const key = `${transaction.amount}_${transaction.merchant || 'unknown'}_${format(transaction.date, 'yyyy-MM-dd')}`
      
      if (!duplicates.has(key)) {
        duplicates.set(key, [])
      }
      
      duplicates.get(key)!.push(transaction)
    }
    
    return Array.from(duplicates.entries())
      .filter(([_, txs]) => txs.length > 1)
      .map(([_, txs]) => ({
        ids: txs.map(t => t.id),
        amount: txs[0].amount,
        merchant: txs[0].merchant || 'Unknown',
        count: txs.length
      }))
  }

  /**
   * Detect unusual spending patterns
   */
  private async detectUnusualPatterns(
    transactions: Transaction[],
    _period: InsightPeriod
  ): Promise<AnomalyInsight[]> {
    const anomalies: AnomalyInsight[] = []
    
    // Group transactions by day
    const dailySpending = new Map<string, number>()
    
    for (const transaction of transactions.filter(t => t.amount < 0)) {
      const day = format(transaction.date, 'yyyy-MM-dd')
      const current = dailySpending.get(day) || 0
      dailySpending.set(day, current + Math.abs(transaction.amount))
    }
    
    // Calculate daily average and detect spikes
    const dailyAmounts = Array.from(dailySpending.values())
    if (dailyAmounts.length > 7) {
      const dailyMean = dailyAmounts.reduce((sum, a) => sum + a, 0) / dailyAmounts.length
      const dailyStdDev = Math.sqrt(
        dailyAmounts.reduce((sum, a) => sum + Math.pow(a - dailyMean, 2), 0) / dailyAmounts.length
      )
      
      for (const [day, amount] of dailySpending.entries()) {
        const zScore = (amount - dailyMean) / dailyStdDev
        
        if (zScore > this.ANOMALY_THRESHOLD) {
          const dayTransactions = transactions.filter(
            t => format(t.date, 'yyyy-MM-dd') === day && t.amount < 0
          )
          
          anomalies.push({
            id: uuidv4(),
            type: 'unusual_spending',
            severity: zScore > 3 ? 'warning' : 'info',
            transactionIds: dayTransactions.map(t => t.id),
            amount,
            description: `Unusual spending of ${amount.toFixed(2)} on ${day} (${zScore.toFixed(1)}σ above average)`,
            detectedAt: new Date(),
            dismissed: false
          })
        }
      }
    }
    
    return anomalies
  }

  /**
   * Analyze goal progress for insights
   */
  private async analyzeGoalProgress(goals: Goal[]): Promise<any[]> {
    const progressSummaries = []
    
    for (const goal of goals.filter(g => g.status === 'active')) {
      const contributions = await db.goalContributions
        .where('goalId')
        .equals(goal.id)
        .toArray()
      
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100
      
      // Calculate required monthly saving
      const monthsRemaining = Math.max(
        1,
        differenceInDays(goal.targetDate, new Date()) / 30
      )
      const amountRemaining = goal.targetAmount - goal.currentAmount
      const requiredMonthlySaving = amountRemaining / monthsRemaining
      
      // Determine if on track
      const recentContributions = contributions
        .filter(c => differenceInDays(new Date(), c.date) <= 90)
        .reduce((sum: number, c: any) => sum + c.amount, 0)
      
      const averageMonthlyContribution = recentContributions / 3
      const isOnTrack = averageMonthlyContribution >= requiredMonthlySaving
      
      // Project completion date
      let projectedCompletion = undefined
      if (averageMonthlyContribution > 0) {
        const monthsToComplete = amountRemaining / averageMonthlyContribution
        projectedCompletion = addMonths(new Date(), monthsToComplete)
      }
      
      progressSummaries.push({
        goalId: goal.id,
        goalName: goal.name,
        progressPercentage,
        projectedCompletion,
        isOnTrack,
        requiredMonthlySaving,
        lastContribution: contributions[contributions.length - 1]?.date
      })
    }
    
    return progressSummaries
  }

  // Helper methods

  private getPeriodBounds(
    period: 'week' | 'month' | 'quarter' | 'year' | 'custom',
    customPeriod?: { start: Date; end: Date }
  ): InsightPeriod {
    const now = new Date()
    
    switch (period) {
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now),
          label: 'This Week'
        }
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, 'MMMM yyyy')
        }
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
        const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0)
        return {
          start: quarterStart,
          end: quarterEnd,
          label: `Q${quarter + 1} ${now.getFullYear()}`
        }
      case 'year':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
          label: now.getFullYear().toString()
        }
      case 'custom':
        if (!customPeriod) {
          throw new Error('Custom period requires start and end dates')
        }
        return {
          start: customPeriod.start,
          end: customPeriod.end,
          label: `${format(customPeriod.start, 'MMM d')} - ${format(customPeriod.end, 'MMM d, yyyy')}`
        }
      default:
        throw new Error(`Invalid period: ${period}`)
    }
  }

  private getPreviousPeriod(period: InsightPeriod): InsightPeriod {
    const duration = differenceInDays(period.end, period.start)
    
    if (duration <= 7) {
      return {
        start: subWeeks(period.start, 1),
        end: subWeeks(period.end, 1),
        label: 'Previous Week'
      }
    } else if (duration <= 31) {
      return {
        start: subMonths(period.start, 1),
        end: subMonths(period.end, 1),
        label: 'Previous Month'
      }
    } else if (duration <= 93) {
      return {
        start: subMonths(period.start, 3),
        end: subMonths(period.end, 3),
        label: 'Previous Quarter'
      }
    } else {
      return {
        start: subYears(period.start, 1),
        end: subYears(period.end, 1),
        label: 'Previous Year'
      }
    }
  }

  private async getTransactionsForPeriod(period: InsightPeriod): Promise<Transaction[]> {
    return await db.transactions
      .where('date')
      .between(period.start, period.end)
      .toArray()
  }

  private getAnalysisIntervals(
    start: Date,
    end: Date,
    periodDays: number
  ): InsightPeriod[] {
    if (periodDays <= 7) {
      // Daily intervals for week view
      return eachWeekOfInterval({ start, end }).map((date, index) => ({
        start: date,
        end: endOfWeek(date),
        label: `Day ${index + 1}`
      }))
    } else if (periodDays <= 31) {
      // Weekly intervals for month view
      return eachWeekOfInterval({ start, end }).map(date => ({
        start: startOfWeek(date),
        end: endOfWeek(date),
        label: format(date, 'MMM d')
      }))
    } else {
      // Monthly intervals for longer periods
      return eachMonthOfInterval({ start, end }).map(date => ({
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: format(date, 'MMM yyyy')
      }))
    }
  }

  private findCorrespondingInterval(
    interval: InsightPeriod,
    previousPeriod: InsightPeriod,
    previousTransactions: Transaction[]
  ): { totalSpent: number } {
    const intervalDuration = differenceInDays(interval.end, interval.start)
    const periodStart = previousPeriod.start
    
    // Find corresponding interval in previous period
    const correspondingStart = new Date(
      periodStart.getTime() + 
      (interval.start.getTime() - previousPeriod.start.getTime())
    )
    const correspondingEnd = new Date(
      correspondingStart.getTime() + 
      (intervalDuration * 24 * 60 * 60 * 1000)
    )
    
    const transactions = previousTransactions.filter(t =>
      isWithinInterval(t.date, { start: correspondingStart, end: correspondingEnd })
    )
    
    const totalSpent = Math.abs(
      transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    )
    
    return { totalSpent }
  }

  private async isSpendingAnomaly(
    amount: number,
    _allTransactions: Transaction[],
    interval: InsightPeriod
  ): Promise<boolean> {
    // Get historical spending for similar intervals
    const historicalIntervals = []
    
    for (let i = 1; i <= 12; i++) {
      const historicalStart = subMonths(interval.start, i)
      const historicalEnd = subMonths(interval.end, i)
      
      const historicalTransactions = await db.transactions
        .where('date')
        .between(historicalStart, historicalEnd)
        .toArray()
      
      const historicalSpending = Math.abs(
        historicalTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)
      )
      
      historicalIntervals.push(historicalSpending)
    }
    
    if (historicalIntervals.length < 3) return false
    
    const mean = historicalIntervals.reduce((sum, a) => sum + a, 0) / historicalIntervals.length
    const stdDev = Math.sqrt(
      historicalIntervals.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / historicalIntervals.length
    )
    
    const zScore = (amount - mean) / stdDev
    return Math.abs(zScore) > this.ANOMALY_THRESHOLD
  }

  private calculateMonthlyAverages(transactions: Transaction[]): number[] {
    const monthlyTotals = new Map<string, number>()
    
    for (const transaction of transactions.filter(t => t.amount < 0)) {
      const month = format(transaction.date, 'yyyy-MM')
      const current = monthlyTotals.get(month) || 0
      monthlyTotals.set(month, current + Math.abs(transaction.amount))
    }
    
    return Array.from(monthlyTotals.values())
  }

  private calculateSpendingTrend(monthlySpending: number[]): number {
    if (monthlySpending.length < 2) return 0
    
    // Simple linear regression
    const n = monthlySpending.length
    const indices = Array.from({ length: n }, (_, i) => i)
    
    const sumX = indices.reduce((sum, x) => sum + x, 0)
    const sumY = monthlySpending.reduce((sum, y) => sum + y, 0)
    const sumXY = indices.reduce((sum, x, i) => sum + x * monthlySpending[i], 0)
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    return slope
  }

  private predictNextMonth(
    monthlySpending: number[],
    trend: number
  ): { amount: number; confidence: number } {
    const lastMonth = monthlySpending[monthlySpending.length - 1]
    const prediction = lastMonth + trend
    
    // Calculate confidence based on variance
    const variance = this.calculateVariance(monthlySpending)
    const confidence = Math.min(
      100,
      Math.max(
        this.CONFIDENCE_THRESHOLD,
        100 - (variance * 10)
      )
    )
    
    return {
      amount: Math.max(0, prediction),
      confidence
    }
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length
  }

  private generateSpendingRecommendations(
    _predictedAmount: number,
    trend: number
  ): string[] {
    const recommendations = []
    
    if (trend > 0) {
      recommendations.push('Your spending is trending upward')
      recommendations.push('Consider reviewing discretionary expenses')
      recommendations.push('Set spending alerts for categories')
    } else if (trend < 0) {
      recommendations.push('Great job reducing expenses!')
      recommendations.push('Consider saving the difference')
      recommendations.push('Keep up the good spending habits')
    } else {
      recommendations.push('Your spending is stable')
      recommendations.push('Look for optimization opportunities')
      recommendations.push('Consider setting savings goals')
    }
    
    return recommendations
  }

  /**
   * Export insights data as CSV or JSON
   */
  async exportInsights(
    summary: InsightSummary,
    format: 'csv' | 'json'
  ): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(summary, null, 2)
    }
    
    // CSV format
    const lines = []
    
    // Header
    lines.push('Kite Finance - Insights Export')
    lines.push(`Period: ${summary.period.label}`)
    lines.push('')
    
    // Cash Flow
    lines.push('CASH FLOW')
    lines.push(`Income,${summary.cashFlow.income.toFixed(2)}`)
    lines.push(`Expenses,${summary.cashFlow.expenses.toFixed(2)}`)
    lines.push(`Net Flow,${summary.cashFlow.netFlow.toFixed(2)}`)
    lines.push(`Savings Rate,${summary.cashFlow.savingsRate.toFixed(2)}%`)
    lines.push('')
    
    // Category Spending
    lines.push('CATEGORY BREAKDOWN')
    lines.push('Category,Amount,Percentage,Transactions,Average,Trend')
    
    for (const category of summary.categories) {
      lines.push([
        category.categoryName,
        category.totalSpent.toFixed(2),
        `${category.percentage.toFixed(1)}%`,
        category.transactionCount,
        category.averageTransaction.toFixed(2),
        category.trend
      ].join(','))
    }
    
    lines.push('')
    
    // Trends
    if (summary.trends.length > 0) {
      lines.push('SPENDING TRENDS')
      lines.push('Period,Amount,Transactions,Average,Change')
      
      for (const trend of summary.trends) {
        lines.push([
          trend.period.label,
          trend.totalSpent.toFixed(2),
          trend.transactionCount,
          trend.averageTransaction.toFixed(2),
          `${trend.percentageChange?.toFixed(1) || 0}%`
        ].join(','))
      }
      
      lines.push('')
    }
    
    // Predictions
    if (summary.predictions && summary.predictions.length > 0) {
      lines.push('PREDICTIONS')
      lines.push('Type,Prediction,Confidence,Basis')
      
      for (const prediction of summary.predictions) {
        lines.push([
          prediction.type,
          prediction.prediction.toFixed(2),
          `${prediction.confidence}%`,
          `"${prediction.basis}"`
        ].join(','))
      }
      
      lines.push('')
    }
    
    return lines.join('\n')
  }
}

// Export singleton instance
export const insightsService = new InsightsService()

// Export convenience functions
export const getInsightSummary = insightsService.getInsightSummary.bind(insightsService)
export const exportInsights = insightsService.exportInsights.bind(insightsService)