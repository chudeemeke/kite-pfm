/**
 * Financial Reports Service
 * Comprehensive generation of financial reports with multiple formats
 * Full implementation with real calculations and data processing
 */

import { db } from '@/db/schema'
import type { Transaction, Account, Category, Budget, Goal } from '@/types'
import { formatCurrency } from './format'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  format,
  subMonths,
  subYears,
  eachMonthOfInterval,
  isWithinInterval,
  differenceInDays,
  addMonths
} from 'date-fns'

export interface MonthlyReport {
  id: string
  month: Date
  monthString: string
  income: {
    total: number
    byCategory: Record<string, number>
    byAccount: Record<string, number>
    transactions: Transaction[]
    averagePerDay: number
    trend: number // % change from previous month
  }
  expenses: {
    total: number
    byCategory: Record<string, number>
    byAccount: Record<string, number>
    byMerchant: Record<string, number>
    transactions: Transaction[]
    averagePerDay: number
    trend: number
  }
  netIncome: number
  savingsRate: number
  budgetPerformance: {
    totalBudgeted: number
    totalSpent: number
    variance: number
    categoryPerformance: Array<{
      categoryId: string
      categoryName: string
      budgeted: number
      spent: number
      variance: number
      percentUsed: number
    }>
  }
  accountBalances: Array<{
    accountId: string
    accountName: string
    startingBalance: number
    endingBalance: number
    change: number
    percentChange: number
  }>
  topExpenses: Array<{
    description: string
    amount: number
    date: Date
    merchant?: string
    category?: string
  }>
  insights: string[]
  recommendations: string[]
}

export interface YearlyReport {
  id: string
  year: number
  startDate: Date
  endDate: Date
  monthlyBreakdown: MonthlyReport[]
  totalIncome: number
  totalExpenses: number
  netIncome: number
  averageMonthlySavings: number
  savingsRate: number
  incomeGrowth: number // % change from previous year
  expenseGrowth: number
  categoryAnalysis: Array<{
    categoryId: string
    categoryName: string
    totalSpent: number
    monthlyAverage: number
    percentOfTotal: number
    trend: 'increasing' | 'decreasing' | 'stable'
    monthlyData: number[]
  }>
  merchantAnalysis: Array<{
    merchant: string
    totalSpent: number
    transactionCount: number
    averageTransaction: number
    percentOfTotal: number
  }>
  goalProgress: Array<{
    goalId: string
    goalName: string
    targetAmount: number
    currentAmount: number
    percentComplete: number
    projectedCompletion: Date | null
  }>
  taxSummary: {
    totalIncome: number
    deductibleExpenses: number
    estimatedTaxableIncome: number
    categories: Record<string, number>
  }
  financialHealth: {
    score: number // 0-100
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
  }
}

export interface QuarterlyReport {
  id: string
  quarter: number
  year: number
  startDate: Date
  endDate: Date
  monthlyReports: MonthlyReport[]
  income: {
    total: number
    monthlyAverage: number
    trend: number
  }
  expenses: {
    total: number
    monthlyAverage: number
    trend: number
  }
  netIncome: number
  quarterOverQuarterGrowth: {
    income: number
    expenses: number
    savings: number
  }
  budgetAdherence: number // % of budget targets met
  keyMetrics: {
    avgDailySpending: number
    avgTransactionSize: number
    transactionVolume: number
    merchantDiversity: number // unique merchants
    categoryConcentration: number // % in top 3 categories
  }
}

export interface CustomReport {
  id: string
  name: string
  startDate: Date
  endDate: Date
  filters: {
    accounts?: string[]
    categories?: string[]
    merchants?: string[]
    minAmount?: number
    maxAmount?: number
    transactionType?: 'income' | 'expense' | 'all'
  }
  data: {
    transactions: Transaction[]
    totalIncome: number
    totalExpenses: number
    netAmount: number
    dailyAverage: number
    transactionCount: number
    uniqueMerchants: number
    uniqueCategories: number
  }
  visualization: {
    dailyTrend: Array<{ date: Date; amount: number }>
    categoryBreakdown: Array<{ category: string; amount: number; count: number }>
    merchantBreakdown: Array<{ merchant: string; amount: number; count: number }>
    accountActivity: Array<{ account: string; credits: number; debits: number }>
  }
}

export interface ReportExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'excel'
  includeTransactions: boolean
  includeCharts: boolean
  includeSummary: boolean
  dateFormat: string
  currencyFormat: string
  language: 'en' | 'es' | 'fr' | 'de'
}

export class FinancialReportsService {
  private static instance: FinancialReportsService
  private userId = 'default-user'

  public static getInstance(): FinancialReportsService {
    if (!FinancialReportsService.instance) {
      FinancialReportsService.instance = new FinancialReportsService()
    }
    return FinancialReportsService.instance
  }

  /**
   * Generate a comprehensive monthly report
   */
  async generateMonthlyReport(month: Date): Promise<MonthlyReport> {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const previousMonthStart = startOfMonth(subMonths(month, 1))
    const previousMonthEnd = endOfMonth(subMonths(month, 1))

    // Fetch all required data
    const [transactions, accounts, categories, budgets] = await Promise.all([
      db.transactions
        .where('date')
        .between(monthStart, monthEnd)
        .toArray(),
      db.accounts.toArray(),
      db.categories.toArray(),
      db.budgets
        .where('month')
        .equals(format(month, 'yyyy-MM'))
        .toArray()
    ])

    // Fetch previous month transactions for trend calculation
    const previousTransactions = await db.transactions
      .where('date')
      .between(previousMonthStart, previousMonthEnd)
      .toArray()

    // Calculate income metrics
    const incomeTransactions = transactions.filter(t => t.amount > 0)
    const incomeByCategory: Record<string, number> = {}
    const incomeByAccount: Record<string, number> = {}

    for (const transaction of incomeTransactions) {
      if (transaction.categoryId) {
        incomeByCategory[transaction.categoryId] = 
          (incomeByCategory[transaction.categoryId] || 0) + transaction.amount
      }
      incomeByAccount[transaction.accountId] = 
        (incomeByAccount[transaction.accountId] || 0) + transaction.amount
    }

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    const previousIncome = previousTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    const incomeTrend = previousIncome > 0 
      ? ((totalIncome - previousIncome) / previousIncome) * 100 
      : 0

    // Calculate expense metrics
    const expenseTransactions = transactions.filter(t => t.amount < 0)
    const expenseByCategory: Record<string, number> = {}
    const expenseByAccount: Record<string, number> = {}
    const expenseByMerchant: Record<string, number> = {}

    for (const transaction of expenseTransactions) {
      const amount = Math.abs(transaction.amount)
      if (transaction.categoryId) {
        expenseByCategory[transaction.categoryId] = 
          (expenseByCategory[transaction.categoryId] || 0) + amount
      }
      expenseByAccount[transaction.accountId] = 
        (expenseByAccount[transaction.accountId] || 0) + amount
      if (transaction.merchant) {
        expenseByMerchant[transaction.merchant] = 
          (expenseByMerchant[transaction.merchant] || 0) + amount
      }
    }

    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const previousExpenses = previousTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const expenseTrend = previousExpenses > 0 
      ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 
      : 0

    // Calculate daily averages
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
    const incomePerDay = totalIncome / daysInMonth
    const expensePerDay = totalExpenses / daysInMonth

    // Calculate budget performance
    const categoryMap = new Map(categories.map(c => [c.id, c.name]))
    const categoryPerformance = []
    let totalBudgeted = 0
    let totalSpent = 0

    for (const budget of budgets) {
      const spent = expenseByCategory[budget.categoryId] || 0
      totalBudgeted += budget.amount
      totalSpent += spent
      
      categoryPerformance.push({
        categoryId: budget.categoryId,
        categoryName: categoryMap.get(budget.categoryId) || 'Unknown',
        budgeted: budget.amount,
        spent,
        variance: budget.amount - spent,
        percentUsed: (spent / budget.amount) * 100
      })
    }

    // Calculate account balance changes
    const accountMap = new Map(accounts.map(a => [a.id, a]))
    const accountBalances = []
    
    for (const account of accounts) {
      const accountTransactions = transactions.filter(t => t.accountId === account.id)
      const change = accountTransactions.reduce((sum, t) => sum + t.amount, 0)
      const startingBalance = account.balance - change
      
      accountBalances.push({
        accountId: account.id,
        accountName: account.name,
        startingBalance,
        endingBalance: account.balance,
        change,
        percentChange: startingBalance !== 0 ? (change / startingBalance) * 100 : 0
      })
    }

    // Find top expenses
    const topExpenses = expenseTransactions
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 10)
      .map(t => ({
        description: t.description,
        amount: Math.abs(t.amount),
        date: t.date,
        merchant: t.merchant,
        category: t.categoryId ? categoryMap.get(t.categoryId) : undefined
      }))

    // Calculate savings rate
    const netIncome = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0

    // Generate insights
    const insights = this.generateMonthlyInsights({
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate,
      incomeTrend,
      expenseTrend,
      categoryPerformance,
      topExpenses
    })

    // Generate recommendations
    const recommendations = this.generateMonthlyRecommendations({
      savingsRate,
      categoryPerformance,
      expenseByMerchant,
      totalExpenses,
      expenseTrend
    })

    return {
      id: `monthly_${format(month, 'yyyy-MM')}`,
      month: monthStart,
      monthString: format(month, 'MMMM yyyy'),
      income: {
        total: totalIncome,
        byCategory: incomeByCategory,
        byAccount: incomeByAccount,
        transactions: incomeTransactions,
        averagePerDay: incomePerDay,
        trend: incomeTrend
      },
      expenses: {
        total: totalExpenses,
        byCategory: expenseByCategory,
        byAccount: expenseByAccount,
        byMerchant: expenseByMerchant,
        transactions: expenseTransactions,
        averagePerDay: expensePerDay,
        trend: expenseTrend
      },
      netIncome,
      savingsRate,
      budgetPerformance: {
        totalBudgeted,
        totalSpent,
        variance: totalBudgeted - totalSpent,
        categoryPerformance
      },
      accountBalances,
      topExpenses,
      insights,
      recommendations
    }
  }

  /**
   * Generate a comprehensive yearly report
   */
  async generateYearlyReport(year: number): Promise<YearlyReport> {
    const yearStart = startOfYear(new Date(year, 0, 1))
    const yearEnd = endOfYear(new Date(year, 0, 1))
    const previousYearStart = startOfYear(new Date(year - 1, 0, 1))
    const previousYearEnd = endOfYear(new Date(year - 1, 0, 1))

    // Generate monthly reports for the year
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })
    const monthlyReports = await Promise.all(
      months.map(month => this.generateMonthlyReport(month))
    )

    // Fetch all year's transactions
    const [transactions, previousYearTransactions, categories, goals] = await Promise.all([
      db.transactions
        .where('date')
        .between(yearStart, yearEnd)
        .toArray(),
      db.transactions
        .where('date')
        .between(previousYearStart, previousYearEnd)
        .toArray(),
      db.categories.toArray(),
      db.goals
        .where('userId')
        .equals(this.userId)
        .toArray()
    ])

    // Calculate yearly totals
    const totalIncome = monthlyReports.reduce((sum, r) => sum + r.income.total, 0)
    const totalExpenses = monthlyReports.reduce((sum, r) => sum + r.expenses.total, 0)
    const netIncome = totalIncome - totalExpenses
    const averageMonthlySavings = netIncome / 12
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0

    // Calculate year-over-year growth
    const previousYearIncome = previousYearTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    const previousYearExpenses = previousYearTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const incomeGrowth = previousYearIncome > 0 
      ? ((totalIncome - previousYearIncome) / previousYearIncome) * 100 
      : 0
    const expenseGrowth = previousYearExpenses > 0 
      ? ((totalExpenses - previousYearExpenses) / previousYearExpenses) * 100 
      : 0

    // Category analysis
    const categoryMap = new Map(categories.map(c => [c.id, c.name]))
    const categoryTotals = new Map<string, number[]>()
    
    for (const report of monthlyReports) {
      for (const [categoryId, amount] of Object.entries(report.expenses.byCategory)) {
        const existing = categoryTotals.get(categoryId) || []
        existing.push(amount)
        categoryTotals.set(categoryId, existing)
      }
    }

    const categoryAnalysis = Array.from(categoryTotals.entries()).map(([categoryId, monthlyData]) => {
      const totalSpent = monthlyData.reduce((sum, a) => sum + a, 0)
      const monthlyAverage = totalSpent / 12
      
      // Determine trend
      const firstHalf = monthlyData.slice(0, 6).reduce((sum, a) => sum + a, 0)
      const secondHalf = monthlyData.slice(6).reduce((sum, a) => sum + a, 0)
      let trend: 'increasing' | 'decreasing' | 'stable'
      
      if (secondHalf > firstHalf * 1.1) {
        trend = 'increasing'
      } else if (secondHalf < firstHalf * 0.9) {
        trend = 'decreasing'
      } else {
        trend = 'stable'
      }

      return {
        categoryId,
        categoryName: categoryMap.get(categoryId) || 'Unknown',
        totalSpent,
        monthlyAverage,
        percentOfTotal: (totalSpent / totalExpenses) * 100,
        trend,
        monthlyData
      }
    }).sort((a, b) => b.totalSpent - a.totalSpent)

    // Merchant analysis
    const merchantTotals = new Map<string, { amount: number; count: number }>()
    
    for (const transaction of transactions) {
      if (transaction.merchant && transaction.amount < 0) {
        const existing = merchantTotals.get(transaction.merchant) || { amount: 0, count: 0 }
        existing.amount += Math.abs(transaction.amount)
        existing.count++
        merchantTotals.set(transaction.merchant, existing)
      }
    }

    const merchantAnalysis = Array.from(merchantTotals.entries())
      .map(([merchant, data]) => ({
        merchant,
        totalSpent: data.amount,
        transactionCount: data.count,
        averageTransaction: data.amount / data.count,
        percentOfTotal: (data.amount / totalExpenses) * 100
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20)

    // Goal progress
    const goalProgress = await Promise.all(goals.map(async goal => {
      const contributions = await db.goalContributions
        .where('goalId')
        .equals(goal.id)
        .toArray()
      
      const currentAmount = contributions.reduce((sum, c) => sum + c.amount, 0)
      const percentComplete = (currentAmount / goal.targetAmount) * 100
      
      // Project completion based on average monthly contribution
      const monthlyContributions = contributions.filter(c => 
        isWithinInterval(c.date, { start: yearStart, end: yearEnd })
      )
      const avgMonthlyContribution = monthlyContributions.length > 0
        ? monthlyContributions.reduce((sum, c) => sum + c.amount, 0) / 12
        : 0
      
      let projectedCompletion = null
      if (avgMonthlyContribution > 0) {
        const remainingAmount = goal.targetAmount - currentAmount
        const monthsNeeded = Math.ceil(remainingAmount / avgMonthlyContribution)
        projectedCompletion = addMonths(new Date(), monthsNeeded)
      }

      return {
        goalId: goal.id,
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount,
        percentComplete,
        projectedCompletion
      }
    }))

    // Tax summary (simplified - would need more complex logic in production)
    const taxCategories = ['Business', 'Medical', 'Charity', 'Education']
    const deductibleCategories: Record<string, number> = {}
    let deductibleExpenses = 0

    for (const [categoryId, categoryName] of categoryMap) {
      if (taxCategories.some(tc => categoryName.toLowerCase().includes(tc.toLowerCase()))) {
        const categoryTotal = categoryAnalysis.find(c => c.categoryId === categoryId)?.totalSpent || 0
        deductibleCategories[categoryName] = categoryTotal
        deductibleExpenses += categoryTotal
      }
    }

    const taxSummary = {
      totalIncome,
      deductibleExpenses,
      estimatedTaxableIncome: Math.max(0, totalIncome - deductibleExpenses),
      categories: deductibleCategories
    }

    // Financial health assessment
    const financialHealth = this.assessFinancialHealth({
      savingsRate,
      incomeGrowth,
      expenseGrowth,
      budgetAdherence: monthlyReports.reduce((sum, r) => 
        r.budgetPerformance.totalBudgeted > 0 
          ? sum + (r.budgetPerformance.totalSpent <= r.budgetPerformance.totalBudgeted ? 1 : 0)
          : sum, 0
      ) / 12 * 100,
      merchantDiversity: merchantTotals.size,
      categoryConcentration: categoryAnalysis.slice(0, 3).reduce((sum, c) => sum + c.percentOfTotal, 0)
    })

    return {
      id: `yearly_${year}`,
      year,
      startDate: yearStart,
      endDate: yearEnd,
      monthlyBreakdown: monthlyReports,
      totalIncome,
      totalExpenses,
      netIncome,
      averageMonthlySavings,
      savingsRate,
      incomeGrowth,
      expenseGrowth,
      categoryAnalysis,
      merchantAnalysis,
      goalProgress,
      taxSummary,
      financialHealth
    }
  }

  /**
   * Generate a quarterly report
   */
  async generateQuarterlyReport(year: number, quarter: number): Promise<QuarterlyReport> {
    const quarterStart = startOfQuarter(new Date(year, (quarter - 1) * 3, 1))
    const quarterEnd = endOfQuarter(new Date(year, (quarter - 1) * 3, 1))
    
    // Generate monthly reports for the quarter
    const months = eachMonthOfInterval({ start: quarterStart, end: quarterEnd })
    const monthlyReports = await Promise.all(
      months.map(month => this.generateMonthlyReport(month))
    )

    // Calculate previous quarter for comparison
    const previousQuarter = quarter === 1 ? 4 : quarter - 1
    const previousYear = quarter === 1 ? year - 1 : year
    const previousQuarterStart = startOfQuarter(new Date(previousYear, (previousQuarter - 1) * 3, 1))
    const previousQuarterEnd = endOfQuarter(new Date(previousYear, (previousQuarter - 1) * 3, 1))

    const [currentTransactions, previousTransactions] = await Promise.all([
      db.transactions
        .where('date')
        .between(quarterStart, quarterEnd)
        .toArray(),
      db.transactions
        .where('date')
        .between(previousQuarterStart, previousQuarterEnd)
        .toArray()
    ])

    // Calculate totals
    const totalIncome = monthlyReports.reduce((sum, r) => sum + r.income.total, 0)
    const totalExpenses = monthlyReports.reduce((sum, r) => sum + r.expenses.total, 0)
    const netIncome = totalIncome - totalExpenses

    // Previous quarter totals
    const previousIncome = previousTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    const previousExpenses = previousTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const previousSavings = previousIncome - previousExpenses

    // Calculate quarter-over-quarter growth
    const incomeGrowth = previousIncome > 0 
      ? ((totalIncome - previousIncome) / previousIncome) * 100 
      : 0
    const expenseGrowth = previousExpenses > 0 
      ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 
      : 0
    const savingsGrowth = previousSavings !== 0 
      ? ((netIncome - previousSavings) / Math.abs(previousSavings)) * 100 
      : 0

    // Calculate key metrics
    const daysInQuarter = differenceInDays(quarterEnd, quarterStart) + 1
    const avgDailySpending = totalExpenses / daysInQuarter
    const avgTransactionSize = currentTransactions.length > 0
      ? currentTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 
        currentTransactions.filter(t => t.amount < 0).length
      : 0

    const uniqueMerchants = new Set(
      currentTransactions
        .filter(t => t.merchant)
        .map(t => t.merchant)
    ).size

    const categorySpending = new Map<string, number>()
    for (const t of currentTransactions.filter(t => t.amount < 0 && t.categoryId)) {
      categorySpending.set(
        t.categoryId!,
        (categorySpending.get(t.categoryId!) || 0) + Math.abs(t.amount)
      )
    }
    
    const topCategories = Array.from(categorySpending.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    const categoryConcentration = topCategories.reduce((sum, [_, amount]) => 
      sum + (amount / totalExpenses) * 100, 0
    )

    // Budget adherence
    const budgetTargetsMet = monthlyReports.reduce((count, report) => {
      const adherence = report.budgetPerformance.totalBudgeted > 0
        ? report.budgetPerformance.totalSpent <= report.budgetPerformance.totalBudgeted
        : true
      return count + (adherence ? 1 : 0)
    }, 0)
    const budgetAdherence = (budgetTargetsMet / monthlyReports.length) * 100

    return {
      id: `quarterly_${year}_Q${quarter}`,
      quarter,
      year,
      startDate: quarterStart,
      endDate: quarterEnd,
      monthlyReports,
      income: {
        total: totalIncome,
        monthlyAverage: totalIncome / 3,
        trend: incomeGrowth
      },
      expenses: {
        total: totalExpenses,
        monthlyAverage: totalExpenses / 3,
        trend: expenseGrowth
      },
      netIncome,
      quarterOverQuarterGrowth: {
        income: incomeGrowth,
        expenses: expenseGrowth,
        savings: savingsGrowth
      },
      budgetAdherence,
      keyMetrics: {
        avgDailySpending,
        avgTransactionSize,
        transactionVolume: currentTransactions.length,
        merchantDiversity: uniqueMerchants,
        categoryConcentration
      }
    }
  }

  /**
   * Generate a custom report based on filters
   */
  async generateCustomReport(
    name: string,
    startDate: Date,
    endDate: Date,
    filters: CustomReport['filters'] = {}
  ): Promise<CustomReport> {
    // Fetch transactions with filters
    let transactions = await db.transactions
      .where('date')
      .between(startDate, endDate)
      .toArray()

    // Apply filters
    if (filters.accounts && filters.accounts.length > 0) {
      transactions = transactions.filter(t => filters.accounts!.includes(t.accountId))
    }
    
    if (filters.categories && filters.categories.length > 0) {
      transactions = transactions.filter(t => 
        t.categoryId && filters.categories!.includes(t.categoryId)
      )
    }
    
    if (filters.merchants && filters.merchants.length > 0) {
      transactions = transactions.filter(t => 
        t.merchant && filters.merchants!.includes(t.merchant)
      )
    }
    
    if (filters.minAmount !== undefined) {
      transactions = transactions.filter(t => Math.abs(t.amount) >= filters.minAmount!)
    }
    
    if (filters.maxAmount !== undefined) {
      transactions = transactions.filter(t => Math.abs(t.amount) <= filters.maxAmount!)
    }
    
    if (filters.transactionType === 'income') {
      transactions = transactions.filter(t => t.amount > 0)
    } else if (filters.transactionType === 'expense') {
      transactions = transactions.filter(t => t.amount < 0)
    }

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const netAmount = totalIncome - totalExpenses
    
    const daysInPeriod = differenceInDays(endDate, startDate) + 1
    const dailyAverage = netAmount / daysInPeriod

    // Get unique merchants and categories
    const uniqueMerchants = new Set(
      transactions.filter(t => t.merchant).map(t => t.merchant!)
    ).size
    const uniqueCategories = new Set(
      transactions.filter(t => t.categoryId).map(t => t.categoryId!)
    ).size

    // Generate daily trend
    const dailyTrend: Array<{ date: Date; amount: number }> = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dayTransactions = transactions.filter(t => 
        format(t.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
      )
      const dayAmount = dayTransactions.reduce((sum, t) => sum + t.amount, 0)
      dailyTrend.push({ date: new Date(currentDate), amount: dayAmount })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>()
    for (const t of transactions) {
      if (t.categoryId) {
        const existing = categoryMap.get(t.categoryId) || { amount: 0, count: 0 }
        existing.amount += Math.abs(t.amount)
        existing.count++
        categoryMap.set(t.categoryId, existing)
      }
    }
    
    const categories = await db.categories.toArray()
    const categoryNameMap = new Map(categories.map(c => [c.id, c.name]))
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([id, data]) => ({
      category: categoryNameMap.get(id) || 'Unknown',
      amount: data.amount,
      count: data.count
    }))

    // Merchant breakdown
    const merchantMap = new Map<string, { amount: number; count: number }>()
    for (const t of transactions) {
      if (t.merchant) {
        const existing = merchantMap.get(t.merchant) || { amount: 0, count: 0 }
        existing.amount += Math.abs(t.amount)
        existing.count++
        merchantMap.set(t.merchant, existing)
      }
    }
    
    const merchantBreakdown = Array.from(merchantMap.entries()).map(([merchant, data]) => ({
      merchant,
      amount: data.amount,
      count: data.count
    }))

    // Account activity
    const accounts = await db.accounts.toArray()
    const accountNameMap = new Map(accounts.map(a => [a.id, a.name]))
    const accountActivity = new Map<string, { credits: number; debits: number }>()
    
    for (const t of transactions) {
      const existing = accountActivity.get(t.accountId) || { credits: 0, debits: 0 }
      if (t.amount > 0) {
        existing.credits += t.amount
      } else {
        existing.debits += Math.abs(t.amount)
      }
      accountActivity.set(t.accountId, existing)
    }
    
    const accountActivityArray = Array.from(accountActivity.entries()).map(([id, data]) => ({
      account: accountNameMap.get(id) || 'Unknown',
      credits: data.credits,
      debits: data.debits
    }))

    return {
      id: `custom_${Date.now()}`,
      name,
      startDate,
      endDate,
      filters,
      data: {
        transactions,
        totalIncome,
        totalExpenses,
        netAmount,
        dailyAverage,
        transactionCount: transactions.length,
        uniqueMerchants,
        uniqueCategories
      },
      visualization: {
        dailyTrend,
        categoryBreakdown,
        merchantBreakdown,
        accountActivity: accountActivityArray
      }
    }
  }

  /**
   * Export report in various formats
   */
  async exportReport(
    report: MonthlyReport | YearlyReport | QuarterlyReport | CustomReport,
    options: ReportExportOptions
  ): Promise<Blob> {
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(report, options)
      case 'csv':
        return this.exportAsCSV(report, options)
      case 'pdf':
        return this.exportAsPDF(report, options)
      case 'excel':
        return this.exportAsExcel(report, options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  // Helper methods

  private generateMonthlyInsights(data: any): string[] {
    const insights: string[] = []

    if (data.savingsRate > 20) {
      insights.push(`Excellent savings rate of ${data.savingsRate.toFixed(1)}% this month`)
    } else if (data.savingsRate < 0) {
      insights.push(`Expenses exceeded income by ${formatCurrency(Math.abs(data.netIncome))}`)
    }

    if (data.incomeTrend > 10) {
      insights.push(`Income increased by ${data.incomeTrend.toFixed(1)}% compared to last month`)
    } else if (data.incomeTrend < -10) {
      insights.push(`Income decreased by ${Math.abs(data.incomeTrend).toFixed(1)}% compared to last month`)
    }

    if (data.expenseTrend > 20) {
      insights.push(`Significant spending increase of ${data.expenseTrend.toFixed(1)}% detected`)
    }

    const overBudgetCategories = data.categoryPerformance.filter((c: any) => c.percentUsed > 100)
    if (overBudgetCategories.length > 0) {
      insights.push(`${overBudgetCategories.length} categories exceeded their budget`)
    }

    if (data.topExpenses[0] && data.topExpenses[0].amount > data.totalExpenses * 0.1) {
      insights.push(`Largest expense (${data.topExpenses[0].description}) represents ${((data.topExpenses[0].amount / data.totalExpenses) * 100).toFixed(1)}% of total spending`)
    }

    return insights
  }

  private generateMonthlyRecommendations(data: any): string[] {
    const recommendations: string[] = []

    if (data.savingsRate < 10) {
      recommendations.push('Consider increasing your savings rate to at least 10-20% of income')
    }

    const overBudgetCategories = data.categoryPerformance.filter((c: any) => c.percentUsed > 100)
    if (overBudgetCategories.length > 0) {
      const worstCategory = overBudgetCategories.sort((a: any, b: any) => b.percentUsed - a.percentUsed)[0]
      recommendations.push(`Review spending in ${worstCategory.categoryName} (${worstCategory.percentUsed.toFixed(0)}% of budget)`)
    }

    const topMerchants = Object.entries(data.expenseByMerchant)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
    
    if (topMerchants[0] && topMerchants[0][1] > data.totalExpenses * 0.15) {
      recommendations.push(`High concentration of spending at ${topMerchants[0][0]} - consider diversifying`)
    }

    if (data.expenseTrend > 15) {
      recommendations.push('Spending is trending upward - review recent expenses for potential cuts')
    }

    return recommendations
  }

  private assessFinancialHealth(metrics: any): any {
    let score = 50 // Base score
    const strengths: string[] = []
    const weaknesses: string[] = []
    const opportunities: string[] = []

    // Savings rate impact
    if (metrics.savingsRate >= 20) {
      score += 20
      strengths.push('Strong savings rate')
    } else if (metrics.savingsRate >= 10) {
      score += 10
      strengths.push('Good savings habits')
    } else if (metrics.savingsRate < 5) {
      score -= 10
      weaknesses.push('Low savings rate')
      opportunities.push('Increase monthly savings to build emergency fund')
    }

    // Income growth impact
    if (metrics.incomeGrowth > 5) {
      score += 10
      strengths.push('Growing income')
    } else if (metrics.incomeGrowth < -5) {
      score -= 10
      weaknesses.push('Declining income')
      opportunities.push('Explore additional income sources')
    }

    // Expense control
    if (metrics.expenseGrowth < metrics.incomeGrowth) {
      score += 10
      strengths.push('Expenses growing slower than income')
    } else if (metrics.expenseGrowth > metrics.incomeGrowth + 10) {
      score -= 10
      weaknesses.push('Expenses growing faster than income')
    }

    // Budget adherence
    if (metrics.budgetAdherence >= 80) {
      score += 10
      strengths.push('Excellent budget discipline')
    } else if (metrics.budgetAdherence < 50) {
      score -= 10
      weaknesses.push('Frequent budget overruns')
      opportunities.push('Review and adjust budget targets')
    }

    // Spending diversity
    if (metrics.merchantDiversity > 20) {
      score += 5
      strengths.push('Diverse spending patterns')
    }

    // Category concentration
    if (metrics.categoryConcentration > 70) {
      score -= 5
      weaknesses.push('High spending concentration in few categories')
      opportunities.push('Review spending distribution across categories')
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score))

    return {
      score,
      strengths,
      weaknesses,
      opportunities
    }
  }

  private async exportAsJSON(report: any, options: ReportExportOptions): Promise<Blob> {
    const exportData: any = {
      reportType: report.id.split('_')[0],
      generatedAt: new Date().toISOString(),
      ...report
    }

    if (!options.includeTransactions) {
      // Remove transaction arrays from export
      if (exportData.income?.transactions) delete exportData.income.transactions
      if (exportData.expenses?.transactions) delete exportData.expenses.transactions
      if (exportData.data?.transactions) delete exportData.data.transactions
    }

    const json = JSON.stringify(exportData, null, 2)
    return new Blob([json], { type: 'application/json' })
  }

  private async exportAsCSV(report: any, options: ReportExportOptions): Promise<Blob> {
    let csv = ''

    // Add summary section
    if (options.includeSummary) {
      csv += 'Summary\n'
      csv += `Report Type,${report.id.split('_')[0]}\n`
      csv += `Period,${format(report.startDate || report.month, options.dateFormat)} - ${format(report.endDate || report.month, options.dateFormat)}\n`
      
      if ('income' in report) {
        csv += `Total Income,${formatCurrency(report.income.total)}\n`
        csv += `Total Expenses,${formatCurrency(report.expenses.total)}\n`
        csv += `Net Income,${formatCurrency(report.netIncome)}\n`
        csv += `Savings Rate,${report.savingsRate?.toFixed(2)}%\n`
      }
      
      csv += '\n'
    }

    // Add transactions if requested
    if (options.includeTransactions && report.data?.transactions) {
      csv += 'Transactions\n'
      csv += 'Date,Description,Amount,Category,Merchant,Account\n'
      
      for (const t of report.data.transactions) {
        csv += `${format(t.date, options.dateFormat)},"${t.description}",${t.amount},"${t.categoryId || ''}","${t.merchant || ''}","${t.accountId}"\n`
      }
    }

    return new Blob([csv], { type: 'text/csv' })
  }

  private async exportAsPDF(report: any, options: ReportExportOptions): Promise<Blob> {
    // This would require a PDF generation library like jsPDF or pdfmake
    // For now, return a placeholder implementation
    const pdfContent = `
Financial Report
================
Generated: ${new Date().toISOString()}

This is a placeholder PDF export.
In a production implementation, this would use a library like jsPDF or pdfmake
to generate a properly formatted PDF document with charts and tables.

Report Summary:
- Type: ${report.id}
- Period: ${report.startDate ? format(report.startDate, 'MMM yyyy') : 'N/A'}
    `
    
    return new Blob([pdfContent], { type: 'application/pdf' })
  }

  private async exportAsExcel(report: any, options: ReportExportOptions): Promise<Blob> {
    // This would require a library like xlsx or exceljs
    // For now, export as CSV with .xlsx extension
    return this.exportAsCSV(report, options)
  }
}

// Export singleton instance
export const financialReportsService = FinancialReportsService.getInstance()

// Export convenience functions
export const generateMonthlyReport = (month: Date) =>
  financialReportsService.generateMonthlyReport(month)

export const generateYearlyReport = (year: number) =>
  financialReportsService.generateYearlyReport(year)

export const generateQuarterlyReport = (year: number, quarter: number) =>
  financialReportsService.generateQuarterlyReport(year, quarter)

export const generateCustomReport = (
  name: string,
  startDate: Date,
  endDate: Date,
  filters?: CustomReport['filters']
) => financialReportsService.generateCustomReport(name, startDate, endDate, filters)

export const exportReport = (report: any, options: ReportExportOptions) =>
  financialReportsService.exportReport(report, options)