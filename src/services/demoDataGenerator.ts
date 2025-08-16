/**
 * Comprehensive Demo Data Generator
 * Creates rich, realistic test data to showcase all application features
 * Includes patterns, anomalies, and trends for analytics demonstration
 */

import { 
  subDays, 
  subMonths, 
  subYears,
  addDays, 
  addMonths,
  format, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  setHours,
  setMinutes
} from 'date-fns'
import { db } from '@/db/schema'
import type { 
  Account, 
  Transaction, 
  Category, 
  Budget, 
  Goal,
  GoalContribution,
  Notification,
  Backup
} from '@/types'
import { v4 as uuidv4 } from 'uuid'

// Realistic merchant data by category
const MERCHANTS = {
  'Food & Dining': [
    { name: 'Tesco Express', frequency: 'high', avgAmount: 25 },
    { name: 'Sainsbury\'s Local', frequency: 'high', avgAmount: 35 },
    { name: 'Pret A Manger', frequency: 'medium', avgAmount: 8 },
    { name: 'Starbucks', frequency: 'high', avgAmount: 5 },
    { name: 'Domino\'s Pizza', frequency: 'low', avgAmount: 25 },
    { name: 'Nando\'s', frequency: 'medium', avgAmount: 30 },
    { name: 'Deliveroo', frequency: 'medium', avgAmount: 35 },
    { name: 'Uber Eats', frequency: 'medium', avgAmount: 28 },
    { name: 'Costa Coffee', frequency: 'high', avgAmount: 4 },
    { name: 'Wagamama', frequency: 'low', avgAmount: 45 },
    { name: 'Five Guys', frequency: 'low', avgAmount: 20 },
    { name: 'Zizzi', frequency: 'low', avgAmount: 55 }
  ],
  'Transport': [
    { name: 'TfL Travel', frequency: 'high', avgAmount: 5 },
    { name: 'Uber', frequency: 'medium', avgAmount: 15 },
    { name: 'BP Petrol Station', frequency: 'medium', avgAmount: 60 },
    { name: 'Shell Petrol', frequency: 'medium', avgAmount: 55 },
    { name: 'National Rail', frequency: 'low', avgAmount: 45 },
    { name: 'Addison Lee', frequency: 'low', avgAmount: 35 },
    { name: 'Zipcar', frequency: 'low', avgAmount: 75 },
    { name: 'British Airways', frequency: 'very-low', avgAmount: 450 }
  ],
  'Shopping': [
    { name: 'Amazon UK', frequency: 'high', avgAmount: 45 },
    { name: 'John Lewis', frequency: 'low', avgAmount: 120 },
    { name: 'Marks & Spencer', frequency: 'medium', avgAmount: 60 },
    { name: 'H&M', frequency: 'low', avgAmount: 50 },
    { name: 'Zara', frequency: 'low', avgAmount: 75 },
    { name: 'Nike Store', frequency: 'low', avgAmount: 95 },
    { name: 'Apple Store', frequency: 'very-low', avgAmount: 850 },
    { name: 'Boots', frequency: 'medium', avgAmount: 25 },
    { name: 'Waterstones', frequency: 'low', avgAmount: 30 },
    { name: 'Argos', frequency: 'low', avgAmount: 85 }
  ],
  'Entertainment': [
    { name: 'Netflix', frequency: 'monthly', avgAmount: 15.99 },
    { name: 'Spotify', frequency: 'monthly', avgAmount: 10.99 },
    { name: 'Vue Cinema', frequency: 'low', avgAmount: 25 },
    { name: 'O2 Academy', frequency: 'low', avgAmount: 45 },
    { name: 'PlayStation Store', frequency: 'low', avgAmount: 50 },
    { name: 'Steam', frequency: 'low', avgAmount: 30 },
    { name: 'Disney+', frequency: 'monthly', avgAmount: 7.99 },
    { name: 'Amazon Prime', frequency: 'yearly', avgAmount: 95 }
  ],
  'Healthcare': [
    { name: 'Boots Pharmacy', frequency: 'low', avgAmount: 15 },
    { name: 'Bupa Health', frequency: 'monthly', avgAmount: 125 },
    { name: 'PureGym', frequency: 'monthly', avgAmount: 24.99 },
    { name: 'Virgin Active', frequency: 'monthly', avgAmount: 89 },
    { name: 'Holland & Barrett', frequency: 'low', avgAmount: 35 },
    { name: 'Dental Practice', frequency: 'quarterly', avgAmount: 85 }
  ],
  'Utilities & Bills': [
    { name: 'British Gas', frequency: 'monthly', avgAmount: 95 },
    { name: 'Thames Water', frequency: 'monthly', avgAmount: 35 },
    { name: 'BT Broadband', frequency: 'monthly', avgAmount: 45 },
    { name: 'EE Mobile', frequency: 'monthly', avgAmount: 35 },
    { name: 'Council Tax', frequency: 'monthly', avgAmount: 150 },
    { name: 'TV Licence', frequency: 'yearly', avgAmount: 159 }
  ],
  'Housing': [
    { name: 'Rent Payment', frequency: 'monthly', avgAmount: 1500 },
    { name: 'John Lewis Home', frequency: 'low', avgAmount: 200 },
    { name: 'IKEA', frequency: 'low', avgAmount: 150 },
    { name: 'B&Q', frequency: 'low', avgAmount: 75 }
  ]
}

// Income sources
const INCOME_SOURCES = [
  { name: 'Acme Corp Salary', amount: 4500, day: 28 },
  { name: 'Freelance Project', amount: 800, frequency: 'occasional' },
  { name: 'Investment Dividend', amount: 150, frequency: 'quarterly' },
  { name: 'Tax Refund', amount: 450, frequency: 'yearly' }
]

export class DemoDataGenerator {
  private userId = 'default-user'
  
  /**
   * Generate comprehensive demo data showcasing all features
   */
  async generateComprehensiveDemoData(): Promise<void> {
    console.log('🚀 Starting comprehensive demo data generation...')
    
    try {
      // Clear existing data first
      await this.clearAllDemoData()
      
      // Create base data
      const categories = await this.createCategories()
      const accounts = await this.createAccounts()
      
      // Generate rich transaction history (18 months)
      const transactions = await this.generateTransactionHistory(accounts, categories, 18)
      
      // Create budgets with realistic targets
      const budgets = await this.createBudgets(categories, transactions)
      
      // Create goals with progress
      const goals = await this.createGoals()
      await this.createGoalContributions(goals)
      
      // Generate notifications
      await this.generateNotifications()
      
      // Create a backup entry
      await this.createBackupEntry()
      
      console.log('✅ Demo data generation complete!', {
        accounts: accounts.length,
        categories: categories.length,
        transactions: transactions.length,
        budgets: budgets.length,
        goals: goals.length
      })
      
      // Show summary notification
      await db.notifications.add({
        id: uuidv4(),
        userId: this.userId,
        type: 'system',
        title: 'Demo Data Loaded',
        message: `Successfully loaded ${transactions.length} transactions across ${accounts.length} accounts with rich analytics data`,
        timestamp: new Date(),
        read: false,
        priority: 'low'
      })
      
    } catch (error) {
      console.error('❌ Error generating demo data:', error)
      throw error
    }
  }
  
  /**
   * Clear all demo data from the database
   */
  async clearAllDemoData(): Promise<void> {
    console.log('🧹 Clearing existing demo data...')
    
    // Clear in reverse dependency order
    await db.notifications.clear()
    await db.goalContributions.clear()
    await db.goals.clear()
    await db.budgets.clear()
    await db.transactions.clear()
    await db.accounts.clear()
    await db.categories.clear()
    await db.backups.clear()
    
    console.log('✅ Demo data cleared')
  }
  
  /**
   * Create comprehensive categories
   */
  private async createCategories(): Promise<Category[]> {
    const categories: Category[] = [
      // Income categories
      { id: 'cat-salary', name: 'Salary', icon: '💼', color: '#10b981', type: 'income' },
      { id: 'cat-freelance', name: 'Freelance', icon: '💻', color: '#06b6d4', type: 'income' },
      { id: 'cat-investments', name: 'Investments', icon: '📈', color: '#8b5cf6', type: 'income' },
      { id: 'cat-other-income', name: 'Other Income', icon: '💰', color: '#84cc16', type: 'income' },
      
      // Expense categories
      { id: 'cat-food', name: 'Food & Dining', icon: '🍽️', color: '#f59e0b', type: 'expense' },
      { id: 'cat-housing', name: 'Housing', icon: '🏠', color: '#ef4444', type: 'expense' },
      { id: 'cat-transport', name: 'Transport', icon: '🚗', color: '#3b82f6', type: 'expense' },
      { id: 'cat-healthcare', name: 'Healthcare', icon: '🏥', color: '#ec4899', type: 'expense' },
      { id: 'cat-entertainment', name: 'Entertainment', icon: '🎮', color: '#f97316', type: 'expense' },
      { id: 'cat-shopping', name: 'Shopping', icon: '🛍️', color: '#84cc16', type: 'expense' },
      { id: 'cat-utilities', name: 'Utilities & Bills', icon: '📱', color: '#6366f1', type: 'expense' },
      { id: 'cat-education', name: 'Education', icon: '📚', color: '#14b8a6', type: 'expense' },
      { id: 'cat-banking', name: 'Banking & Fees', icon: '🏦', color: '#64748b', type: 'expense' },
      { id: 'cat-charity', name: 'Charity', icon: '❤️', color: '#e11d48', type: 'expense' },
      { id: 'cat-travel', name: 'Travel', icon: '✈️', color: '#0ea5e9', type: 'expense' }
    ]
    
    await db.categories.bulkAdd(categories)
    return categories
  }
  
  /**
   * Create realistic accounts with varied balances
   */
  private async createAccounts(): Promise<Account[]> {
    const accounts: Account[] = [
      {
        id: 'acc-santander',
        name: 'Santander Current Account',
        type: 'checking',
        currency: 'GBP',
        balance: 3456.78,
        icon: '🏦',
        color: '#ef4444',
        includeInTotal: true,
        isArchived: false
      },
      {
        id: 'acc-monzo',
        name: 'Monzo',
        type: 'checking',
        currency: 'GBP',
        balance: 892.45,
        icon: '💳',
        color: '#f97316',
        includeInTotal: true,
        isArchived: false
      },
      {
        id: 'acc-marcus',
        name: 'Marcus Savings',
        type: 'savings',
        currency: 'GBP',
        balance: 15678.90,
        icon: '🏦',
        color: '#10b981',
        includeInTotal: true,
        isArchived: false
      },
      {
        id: 'acc-amex',
        name: 'Amex Gold Card',
        type: 'credit',
        currency: 'GBP',
        balance: -1234.56,
        icon: '💳',
        color: '#f59e0b',
        includeInTotal: true,
        isArchived: false
      },
      {
        id: 'acc-vanguard',
        name: 'Vanguard ISA',
        type: 'investment',
        currency: 'GBP',
        balance: 28945.23,
        icon: '📈',
        color: '#8b5cf6',
        includeInTotal: true,
        isArchived: false
      },
      {
        id: 'acc-cash',
        name: 'Cash',
        type: 'cash',
        currency: 'GBP',
        balance: 120.00,
        icon: '💵',
        color: '#10b981',
        includeInTotal: true,
        isArchived: false
      }
    ]
    
    await db.accounts.bulkAdd(accounts)
    return accounts
  }
  
  /**
   * Generate comprehensive transaction history with patterns and anomalies
   */
  private async generateTransactionHistory(
    accounts: Account[], 
    categories: Category[],
    months: number
  ): Promise<Transaction[]> {
    const transactions: Transaction[] = []
    const startDate = subMonths(new Date(), months)
    const endDate = new Date()
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    
    // Track running balances
    const accountBalances = new Map(accounts.map(a => [a.id, 0]))
    
    for (const day of days) {
      const dayOfMonth = day.getDate()
      const isWeekendDay = isWeekend(day)
      
      // Monthly salary on the 28th
      if (dayOfMonth === 28) {
        const salaryAmount = 4500 + (Math.random() * 200 - 100) // Slight variation
        transactions.push({
          id: uuidv4(),
          accountId: 'acc-santander',
          categoryId: 'cat-salary',
          amount: salaryAmount,
          description: 'Acme Corp - Monthly Salary',
          merchant: 'Acme Corporation',
          date: setHours(setMinutes(day, 30), 9),
          payee: 'Acme Corp',
          notes: 'Monthly salary payment',
          tags: ['income', 'salary'],
          location: 'London, UK',
          recurring: true
        })
      }
      
      // Monthly rent on the 1st
      if (dayOfMonth === 1) {
        transactions.push({
          id: uuidv4(),
          accountId: 'acc-santander',
          categoryId: 'cat-housing',
          amount: -1500,
          description: 'Monthly Rent',
          merchant: 'Property Management Ltd',
          date: setHours(setMinutes(day, 0), 8),
          payee: 'Landlord',
          notes: 'Monthly rent payment',
          tags: ['rent', 'housing'],
          recurring: true
        })
      }
      
      // Regular bills (5th-10th of month)
      if (dayOfMonth >= 5 && dayOfMonth <= 10) {
        const bills = [
          { name: 'British Gas', amount: 95 + Math.random() * 20 },
          { name: 'Thames Water', amount: 35 + Math.random() * 5 },
          { name: 'BT Broadband', amount: 45 },
          { name: 'EE Mobile', amount: 35 },
          { name: 'Council Tax', amount: 150 }
        ]
        
        if (dayOfMonth === 5 + bills.findIndex(b => b.name === bills[dayOfMonth - 5]?.name)) {
          const bill = bills[dayOfMonth - 5]
          if (bill) {
            transactions.push({
              id: uuidv4(),
              accountId: 'acc-santander',
              categoryId: 'cat-utilities',
              amount: -bill.amount,
              description: bill.name,
              merchant: bill.name,
              date: setHours(day, 10),
              recurring: true,
              tags: ['bills', 'utilities']
            })
          }
        }
      }
      
      // Subscriptions (specific days)
      if (dayOfMonth === 15) {
        const subscriptions = [
          { name: 'Netflix', amount: 15.99 },
          { name: 'Spotify', amount: 10.99 },
          { name: 'Disney+', amount: 7.99 }
        ]
        
        for (const sub of subscriptions) {
          transactions.push({
            id: uuidv4(),
            accountId: 'acc-monzo',
            categoryId: 'cat-entertainment',
            amount: -sub.amount,
            description: `${sub.name} Subscription`,
            merchant: sub.name,
            date: setHours(day, 2),
            recurring: true,
            tags: ['subscription', 'entertainment']
          })
        }
      }
      
      // Daily spending patterns
      const spendingProbability = isWeekendDay ? 0.8 : 0.6
      
      // Food & Dining
      if (Math.random() < spendingProbability) {
        const foodMerchants = MERCHANTS['Food & Dining']
        const merchant = foodMerchants[Math.floor(Math.random() * foodMerchants.length)]
        const amount = merchant.avgAmount * (0.7 + Math.random() * 0.6)
        
        transactions.push({
          id: uuidv4(),
          accountId: Math.random() > 0.3 ? 'acc-monzo' : 'acc-amex',
          categoryId: 'cat-food',
          amount: -amount,
          description: merchant.name,
          merchant: merchant.name,
          date: setHours(day, Math.floor(Math.random() * 14) + 8),
          tags: ['food']
        })
      }
      
      // Transport (weekdays mainly)
      if (!isWeekendDay && Math.random() < 0.7) {
        const transportMerchants = MERCHANTS['Transport']
        const merchant = transportMerchants[Math.floor(Math.random() * 3)] // Favor common transport
        const amount = merchant.avgAmount * (0.8 + Math.random() * 0.4)
        
        transactions.push({
          id: uuidv4(),
          accountId: 'acc-monzo',
          categoryId: 'cat-transport',
          amount: -amount,
          description: merchant.name,
          merchant: merchant.name,
          date: setHours(day, Math.random() > 0.5 ? 8 : 18),
          tags: ['transport', 'commute']
        })
      }
      
      // Shopping (occasional)
      if (Math.random() < 0.15) {
        const shoppingMerchants = MERCHANTS['Shopping']
        const merchant = shoppingMerchants[Math.floor(Math.random() * shoppingMerchants.length)]
        const amount = merchant.avgAmount * (0.5 + Math.random() * 1.5)
        
        transactions.push({
          id: uuidv4(),
          accountId: 'acc-amex',
          categoryId: 'cat-shopping',
          amount: -amount,
          description: merchant.name,
          merchant: merchant.name,
          date: setHours(day, Math.floor(Math.random() * 10) + 10),
          tags: ['shopping']
        })
      }
      
      // Entertainment (weekends more likely)
      if (isWeekendDay && Math.random() < 0.3) {
        const entertainmentMerchants = MERCHANTS['Entertainment'].filter(m => m.frequency !== 'monthly' && m.frequency !== 'yearly')
        const merchant = entertainmentMerchants[Math.floor(Math.random() * entertainmentMerchants.length)]
        const amount = merchant.avgAmount * (0.8 + Math.random() * 0.4)
        
        transactions.push({
          id: uuidv4(),
          accountId: 'acc-monzo',
          categoryId: 'cat-entertainment',
          amount: -amount,
          description: merchant.name,
          merchant: merchant.name,
          date: setHours(day, Math.floor(Math.random() * 8) + 12),
          tags: ['entertainment', 'leisure']
        })
      }
      
      // Add some anomalies for detection
      
      // Black Friday shopping spike (November)
      if (day.getMonth() === 10 && dayOfMonth === 24) {
        for (let i = 0; i < 5; i++) {
          const shoppingMerchants = MERCHANTS['Shopping']
          const merchant = shoppingMerchants[Math.floor(Math.random() * shoppingMerchants.length)]
          
          transactions.push({
            id: uuidv4(),
            accountId: 'acc-amex',
            categoryId: 'cat-shopping',
            amount: -(merchant.avgAmount * (2 + Math.random() * 3)), // Much higher than normal
            description: `Black Friday - ${merchant.name}`,
            merchant: merchant.name,
            date: setHours(day, Math.floor(Math.random() * 12) + 8),
            tags: ['shopping', 'black-friday', 'anomaly']
          })
        }
      }
      
      // Christmas shopping (December)
      if (day.getMonth() === 11 && dayOfMonth >= 15 && dayOfMonth <= 24) {
        if (Math.random() < 0.4) {
          const merchant = MERCHANTS['Shopping'][Math.floor(Math.random() * MERCHANTS['Shopping'].length)]
          transactions.push({
            id: uuidv4(),
            accountId: 'acc-amex',
            categoryId: 'cat-shopping',
            amount: -(merchant.avgAmount * (1.5 + Math.random() * 2)),
            description: `Christmas Shopping - ${merchant.name}`,
            merchant: merchant.name,
            date: setHours(day, Math.floor(Math.random() * 10) + 10),
            tags: ['shopping', 'christmas']
          })
        }
      }
      
      // Occasional large expenses (car repair, medical, etc.)
      if (Math.random() < 0.005) { // 0.5% chance per day
        const largeExpenses = [
          { desc: 'Car Service & MOT', category: 'cat-transport', amount: 450 },
          { desc: 'Dental Treatment', category: 'cat-healthcare', amount: 350 },
          { desc: 'Home Insurance Annual', category: 'cat-housing', amount: 680 },
          { desc: 'Flight Booking', category: 'cat-travel', amount: 890 }
        ]
        
        const expense = largeExpenses[Math.floor(Math.random() * largeExpenses.length)]
        transactions.push({
          id: uuidv4(),
          accountId: 'acc-santander',
          categoryId: expense.category,
          amount: -expense.amount,
          description: expense.desc,
          merchant: expense.desc,
          date: setHours(day, 14),
          tags: ['large-expense', 'anomaly'],
          notes: 'Unusual large expense'
        })
      }
      
      // Freelance income (occasional)
      if (Math.random() < 0.02) { // 2% chance per day
        const amount = 500 + Math.random() * 1000
        transactions.push({
          id: uuidv4(),
          accountId: 'acc-santander',
          categoryId: 'cat-freelance',
          amount: amount,
          description: 'Freelance Project Payment',
          merchant: 'Client Payment',
          date: setHours(day, 15),
          tags: ['income', 'freelance']
        })
      }
      
      // Investment dividends (quarterly)
      if (dayOfMonth === 15 && [2, 5, 8, 11].includes(day.getMonth())) {
        transactions.push({
          id: uuidv4(),
          accountId: 'acc-vanguard',
          categoryId: 'cat-investments',
          amount: 150 + Math.random() * 100,
          description: 'Quarterly Dividend',
          merchant: 'Vanguard',
          date: setHours(day, 10),
          tags: ['income', 'dividend', 'investment']
        })
      }
      
      // Transfers between accounts (occasional)
      if (dayOfMonth === 1 && Math.random() < 0.5) {
        const amount = 500 + Math.random() * 500
        // Transfer to savings
        transactions.push({
          id: uuidv4(),
          accountId: 'acc-santander',
          categoryId: undefined,
          amount: -amount,
          description: 'Transfer to Savings',
          merchant: 'Internal Transfer',
          date: setHours(day, 20),
          tags: ['transfer'],
          isTransfer: true
        })
        
        transactions.push({
          id: uuidv4(),
          accountId: 'acc-marcus',
          categoryId: undefined,
          amount: amount,
          description: 'Transfer from Current',
          merchant: 'Internal Transfer',
          date: setHours(day, 20),
          tags: ['transfer'],
          isTransfer: true
        })
      }
    }
    
    // Sort transactions by date
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    await db.transactions.bulkAdd(transactions)
    return transactions
  }
  
  /**
   * Create realistic budgets based on spending patterns
   */
  private async createBudgets(categories: Category[], transactions: Transaction[]): Promise<Budget[]> {
    const expenseCategories = categories.filter(c => c.type === 'expense')
    const currentMonth = format(new Date(), 'yyyy-MM')
    const budgets: Budget[] = []
    
    // Analyze spending patterns to create realistic budgets
    for (const category of expenseCategories) {
      const categoryTransactions = transactions.filter(t => 
        t.categoryId === category.id && 
        t.amount < 0
      )
      
      if (categoryTransactions.length > 0) {
        // Calculate average monthly spending
        const monthlyTotals = new Map<string, number>()
        
        for (const transaction of categoryTransactions) {
          const month = format(transaction.date, 'yyyy-MM')
          const current = monthlyTotals.get(month) || 0
          monthlyTotals.set(month, current + Math.abs(transaction.amount))
        }
        
        const avgMonthlySpending = Array.from(monthlyTotals.values()).reduce((a, b) => a + b, 0) / monthlyTotals.size
        
        // Set budget slightly above average (realistic budget)
        const budgetAmount = Math.round(avgMonthlySpending * 1.1 / 10) * 10 // Round to nearest 10
        
        // Create budgets for current and next 2 months
        for (let i = 0; i < 3; i++) {
          const budgetMonth = format(addMonths(new Date(), i), 'yyyy-MM')
          
          budgets.push({
            id: uuidv4(),
            categoryId: category.id,
            month: budgetMonth,
            amount: budgetAmount,
            currency: 'GBP',
            carryover: i === 0 && Math.random() > 0.7 ? Math.random() * 50 : 0, // Some categories have carryover
            notes: `Budget for ${category.name}`
          })
        }
      }
    }
    
    await db.budgets.bulkAdd(budgets)
    return budgets
  }
  
  /**
   * Create financial goals with progress
   */
  private async createGoals(): Promise<Goal[]> {
    const goals: Goal[] = [
      {
        id: 'goal-emergency',
        userId: this.userId,
        name: 'Emergency Fund',
        description: 'Build 6 months of expenses emergency fund',
        targetAmount: 15000,
        currentAmount: 8750, // 58% complete
        targetDate: addMonths(new Date(), 8),
        category: 'savings',
        priority: 'high',
        status: 'active',
        autoContribute: true,
        contributionAmount: 500,
        contributionFrequency: 'monthly',
        milestones: [
          { amount: 5000, description: '1 month expenses', reached: true },
          { amount: 10000, description: '3 months expenses', reached: false },
          { amount: 15000, description: '6 months expenses', reached: false }
        ]
      },
      {
        id: 'goal-vacation',
        userId: this.userId,
        name: 'Japan Vacation',
        description: 'Save for 2-week trip to Japan',
        targetAmount: 4000,
        currentAmount: 2100, // 52% complete
        targetDate: addMonths(new Date(), 6),
        category: 'travel',
        priority: 'medium',
        status: 'active',
        autoContribute: true,
        contributionAmount: 300,
        contributionFrequency: 'monthly',
        milestones: [
          { amount: 1000, description: 'Flights booked', reached: true },
          { amount: 2500, description: 'Hotels reserved', reached: false },
          { amount: 4000, description: 'Full trip funded', reached: false }
        ]
      },
      {
        id: 'goal-macbook',
        userId: this.userId,
        name: 'New MacBook Pro',
        description: 'Upgrade work laptop',
        targetAmount: 2500,
        currentAmount: 2500, // 100% complete!
        targetDate: subMonths(new Date(), 1), // Completed last month
        category: 'technology',
        priority: 'medium',
        status: 'completed',
        autoContribute: false,
        milestones: [
          { amount: 1000, description: '40% saved', reached: true },
          { amount: 2000, description: '80% saved', reached: true },
          { amount: 2500, description: 'Goal reached!', reached: true }
        ]
      },
      {
        id: 'goal-investment',
        userId: this.userId,
        name: 'Investment Portfolio',
        description: 'Build diversified investment portfolio',
        targetAmount: 50000,
        currentAmount: 28945, // 58% complete
        targetDate: addMonths(new Date(), 24),
        category: 'investment',
        priority: 'high',
        status: 'active',
        autoContribute: true,
        contributionAmount: 1000,
        contributionFrequency: 'monthly',
        milestones: [
          { amount: 10000, description: 'Starter portfolio', reached: true },
          { amount: 25000, description: 'Half way there', reached: true },
          { amount: 50000, description: 'Target reached', reached: false }
        ]
      },
      {
        id: 'goal-charity',
        userId: this.userId,
        name: 'Annual Charity Target',
        description: 'Donate to favorite charities',
        targetAmount: 1200,
        currentAmount: 850, // 71% complete
        targetDate: endOfMonth(new Date()),
        category: 'charity',
        priority: 'low',
        status: 'active',
        autoContribute: true,
        contributionAmount: 100,
        contributionFrequency: 'monthly'
      }
    ]
    
    await db.goals.bulkAdd(goals)
    return goals
  }
  
  /**
   * Create goal contribution history
   */
  private async createGoalContributions(goals: Goal[]): Promise<void> {
    const contributions: GoalContribution[] = []
    
    for (const goal of goals) {
      if (goal.currentAmount > 0) {
        // Generate contribution history
        const monthsBack = goal.status === 'completed' ? 12 : 8
        const monthlyAmount = goal.contributionAmount || goal.currentAmount / monthsBack
        
        for (let i = monthsBack; i > 0; i--) {
          const contributionDate = subMonths(new Date(), i)
          const amount = monthlyAmount * (0.8 + Math.random() * 0.4) // Some variation
          
          contributions.push({
            id: uuidv4(),
            goalId: goal.id,
            amount: Math.min(amount, goal.currentAmount),
            date: contributionDate,
            accountId: 'acc-santander',
            notes: goal.autoContribute ? 'Automatic contribution' : 'Manual contribution'
          })
        }
      }
    }
    
    await db.goalContributions.bulkAdd(contributions)
  }
  
  /**
   * Generate various notifications
   */
  private async generateNotifications(): Promise<void> {
    const notifications: Notification[] = [
      {
        id: uuidv4(),
        userId: this.userId,
        type: 'budget_alert',
        title: 'Budget Alert',
        message: 'You\'ve used 85% of your Food & Dining budget this month',
        timestamp: subDays(new Date(), 2),
        read: false,
        priority: 'medium',
        actionUrl: '/budgets'
      },
      {
        id: uuidv4(),
        userId: this.userId,
        type: 'goal_milestone',
        title: 'Goal Milestone Reached! 🎉',
        message: 'Your Emergency Fund has reached £8,750 - over halfway to your target!',
        timestamp: subDays(new Date(), 5),
        read: true,
        priority: 'low',
        actionUrl: '/goals'
      },
      {
        id: uuidv4(),
        userId: this.userId,
        type: 'anomaly',
        title: 'Unusual Spending Detected',
        message: 'Your shopping expenses are 150% higher than usual this week',
        timestamp: subDays(new Date(), 1),
        read: false,
        priority: 'high',
        actionUrl: '/trends'
      },
      {
        id: uuidv4(),
        userId: this.userId,
        type: 'system',
        title: 'Monthly Report Ready',
        message: 'Your financial report for last month is now available',
        timestamp: startOfMonth(new Date()),
        read: true,
        priority: 'low',
        actionUrl: '/reports'
      },
      {
        id: uuidv4(),
        userId: this.userId,
        type: 'reminder',
        title: 'Bill Payment Due',
        message: 'Your credit card payment is due in 3 days',
        timestamp: subDays(new Date(), 1),
        read: false,
        priority: 'high'
      }
    ]
    
    await db.notifications.bulkAdd(notifications)
  }
  
  /**
   * Create a backup entry for demo
   */
  private async createBackupEntry(): Promise<void> {
    const backup: Backup = {
      id: uuidv4(),
      userId: this.userId,
      name: 'Demo Data Backup',
      timestamp: new Date(),
      size: 256789, // ~250KB
      type: 'manual',
      encrypted: false,
      data: JSON.stringify({ 
        version: '1.0',
        description: 'This is a demo backup entry'
      })
    }
    
    await db.backups.add(backup)
  }
  
  /**
   * Check if demo data exists
   */
  async isDemoDataLoaded(): Promise<boolean> {
    const transactionCount = await db.transactions.count()
    const hasTestData = await db.transactions
      .where('tags')
      .equals('demo-data')
      .count()
    
    return transactionCount > 100 || hasTestData > 0
  }
}

// Export singleton instance
export const demoDataGenerator = new DemoDataGenerator()

// Export convenience functions
export const loadDemoData = () => demoDataGenerator.generateComprehensiveDemoData()
export const clearDemoData = () => demoDataGenerator.clearAllDemoData()
export const isDemoDataLoaded = () => demoDataGenerator.isDemoDataLoaded()