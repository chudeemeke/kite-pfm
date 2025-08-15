import { subDays, subMonths, addDays, format } from 'date-fns'
import { 
  accountRepo, 
  transactionRepo, 
  categoryRepo, 
  budgetRepo, 
  ruleRepo, 
  subscriptionRepo 
} from '@/db/repositories'
import type { 
  Account, 
  Transaction, 
  Category, 
  Budget, 
  Rule, 
  Subscription 
} from '@/types'

export class DemoService {
  /**
   * Seed the database with demo data
   */
  async seedDemoData(): Promise<void> {
    // Clear existing data first
    await this.clearAllData()
    
    // Create demo data in order (categories first, then accounts, etc.)
    const categories = await this.createDemoCategories()
    const accounts = await this.createDemoAccounts()
    const transactions = await this.createDemoTransactions(accounts, categories)
    const budgets = await this.createDemoBudgets(categories)
    const rules = await this.createDemoRules(categories)
    const subscriptions = await this.createDemoSubscriptions(accounts, categories)
    
    console.log('Demo data seeded successfully:', {
      categories: categories.length,
      accounts: accounts.length,
      transactions: transactions.length,
      budgets: budgets.length,
      rules: rules.length,
      subscriptions: subscriptions.length
    })
  }
  
  /**
   * Clear all existing data
   */
  async clearAllData(): Promise<void> {
    await Promise.all([
      subscriptionRepo.getAll().then(subs => 
        Promise.all(subs.map(s => subscriptionRepo.delete(s.id)))
      ),
      ruleRepo.getAll().then(rules => 
        Promise.all(rules.map(r => ruleRepo.delete(r.id)))
      ),
      budgetRepo.getAll().then(budgets => 
        Promise.all(budgets.map(b => budgetRepo.delete(b.id)))
      ),
      transactionRepo.getAll().then(transactions => 
        Promise.all(transactions.map(t => transactionRepo.delete(t.id)))
      ),
      categoryRepo.getAll().then(categories => 
        Promise.all(categories.map(c => categoryRepo.delete(c.id)).reverse()) // Delete in reverse order for parent-child relationships
      ),
      accountRepo.getAll().then(accounts => 
        Promise.all(accounts.map(a => accountRepo.delete(a.id)))
      )
    ])
  }
  
  /**
   * Create demo categories
   */
  private async createDemoCategories(): Promise<Category[]> {
    const categories: Omit<Category, 'id'>[] = [
      // Income categories
      { name: '💰 Salary', icon: '💰', color: '#10b981', parentId: undefined },
      { name: '💼 Freelance', icon: '💼', color: '#06b6d4', parentId: undefined },
      { name: '📈 Investments', icon: '📈', color: '#8b5cf6', parentId: undefined },
      
      // Expense categories
      { name: '🍽️ Food & Dining', icon: '🍽️', color: '#f59e0b', parentId: undefined },
      { name: '🏠 Housing', icon: '🏠', color: '#ef4444', parentId: undefined },
      { name: '🚗 Transport', icon: '🚗', color: '#3b82f6', parentId: undefined },
      { name: '💊 Healthcare', icon: '💊', color: '#ec4899', parentId: undefined },
      { name: '🎬 Entertainment', icon: '🎬', color: '#f97316', parentId: undefined },
      { name: '🛒 Shopping', icon: '🛒', color: '#84cc16', parentId: undefined },
      { name: '📱 Utilities & Bills', icon: '📱', color: '#6366f1', parentId: undefined },
      { name: '🎓 Education', icon: '🎓', color: '#14b8a6', parentId: undefined },
      { name: '💳 Banking & Fees', icon: '💳', color: '#64748b', parentId: undefined }
    ]
    
    const createdCategories: Category[] = []
    for (const category of categories) {
      const created = await categoryRepo.create(category)
      createdCategories.push(created)
    }
    
    return createdCategories
  }
  
  /**
   * Create demo accounts
   */
  private async createDemoAccounts(): Promise<Account[]> {
    const accounts: Omit<Account, 'id' | 'createdAt'>[] = [
      {
        name: 'Santander Current Account',
        type: 'checking',
        currency: 'GBP',
        balance: 2847.56
      },
      {
        name: 'Monzo',
        type: 'checking',
        currency: 'GBP',
        balance: 156.78
      },
      {
        name: 'Marcus Savings',
        type: 'savings',
        currency: 'GBP',
        balance: 8934.21
      },
      {
        name: 'Amex Gold Card',
        type: 'credit',
        currency: 'GBP',
        balance: -567.89
      },
      {
        name: 'Cash',
        type: 'cash',
        currency: 'GBP',
        balance: 45.00
      }
    ]
    
    const createdAccounts: Account[] = []
    for (const account of accounts) {
      const created = await accountRepo.create(account)
      createdAccounts.push(created)
    }
    
    return createdAccounts
  }
  
  /**
   * Create demo transactions
   */
  private async createDemoTransactions(accounts: Account[], categories: Category[]): Promise<Transaction[]> {
    const currentAccount = accounts.find(a => a.name.includes('Santander'))!
    const monzoAccount = accounts.find(a => a.name.includes('Monzo'))!
    const savingsAccount = accounts.find(a => a.name.includes('Marcus'))!
    const creditAccount = accounts.find(a => a.name.includes('Amex'))!
    
    const salaryCategory = categories.find(c => c.name.includes('Salary'))!
    const foodCategory = categories.find(c => c.name.includes('Food'))!
    const housingCategory = categories.find(c => c.name.includes('Housing'))!
    const transportCategory = categories.find(c => c.name.includes('Transport'))!
    const entertainmentCategory = categories.find(c => c.name.includes('Entertainment'))!
    const shoppingCategory = categories.find(c => c.name.includes('Shopping'))!
    const utilitiesCategory = categories.find(c => c.name.includes('Utilities'))!
    const healthcareCategory = categories.find(c => c.name.includes('Healthcare'))!
    
    const transactions: Omit<Transaction, 'id'>[] = []
    
    // Generate transactions for the last 3 months
    
    // Monthly salary
    for (let month = 0; month < 3; month++) {
      const salaryDate = subMonths(new Date(), month)
      salaryDate.setDate(28) // Last working day of month
      
      transactions.push({
        accountId: currentAccount.id,
        date: salaryDate,
        amount: 3500.00,
        currency: 'GBP',
        description: 'Salary Payment',
        merchant: 'ACME Corporation',
        categoryId: salaryCategory.id
      })
    }
    
    // Recurring monthly expenses
    for (let month = 0; month < 3; month++) {
      const monthStart = subMonths(new Date(), month)
      monthStart.setDate(1)
      
      // Rent
      transactions.push({
        accountId: currentAccount.id,
        date: new Date(monthStart.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000),
        amount: -1200.00,
        currency: 'GBP',
        description: 'Rent Payment',
        merchant: 'London Properties Ltd',
        categoryId: housingCategory.id,
        isSubscription: true
      })
      
      // Utilities
      transactions.push({
        accountId: currentAccount.id,
        date: new Date(monthStart.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000),
        amount: -89.50,
        currency: 'GBP',
        description: 'Electricity Bill',
        merchant: 'British Gas',
        categoryId: utilitiesCategory.id,
        isSubscription: true
      })
      
      transactions.push({
        accountId: currentAccount.id,
        date: new Date(monthStart.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000),
        amount: -45.00,
        currency: 'GBP',
        description: 'Internet & Phone',
        merchant: 'BT',
        categoryId: utilitiesCategory.id,
        isSubscription: true
      })
      
      // Mobile phone
      transactions.push({
        accountId: currentAccount.id,
        date: new Date(monthStart.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000),
        amount: -25.00,
        currency: 'GBP',
        description: 'Mobile Contract',
        merchant: 'Three',
        categoryId: utilitiesCategory.id,
        isSubscription: true
      })
    }
    
    // Daily/weekly expenses
    for (let day = 0; day < 90; day++) {
      const date = subDays(new Date(), day)
      
      // Random food purchases (60% chance)
      if (Math.random() < 0.6) {
        const foodExpenses = [
          { merchant: 'Tesco', amount: -15.67, description: 'Grocery Shopping' },
          { merchant: 'Pret A Manger', amount: -8.45, description: 'Lunch' },
          { merchant: 'Starbucks', amount: -4.25, description: 'Coffee' },
          { merchant: 'Deliveroo', amount: -12.50, description: 'Dinner Delivery' },
          { merchant: 'Sainsburys', amount: -23.78, description: 'Weekly Shop' },
          { merchant: 'Costa Coffee', amount: -3.80, description: 'Coffee & Pastry' }
        ]
        
        const expense = foodExpenses[Math.floor(Math.random() * foodExpenses.length)]
        transactions.push({
          accountId: Math.random() < 0.8 ? currentAccount.id : monzoAccount.id,
          date,
          amount: expense.amount + (Math.random() - 0.5) * 5, // Add some variation
          currency: 'GBP',
          description: expense.description,
          merchant: expense.merchant,
          categoryId: foodCategory.id
        })
      }
      
      // Random transport (30% chance)
      if (Math.random() < 0.3) {
        const transportExpenses = [
          { merchant: 'TfL', amount: -2.80, description: 'Tube Journey' },
          { merchant: 'Uber', amount: -12.50, description: 'Ride' },
          { merchant: 'Shell', amount: -45.00, description: 'Petrol' },
          { merchant: 'National Rail', amount: -15.60, description: 'Train Ticket' }
        ]
        
        const expense = transportExpenses[Math.floor(Math.random() * transportExpenses.length)]
        transactions.push({
          accountId: Math.random() < 0.7 ? currentAccount.id : monzoAccount.id,
          date,
          amount: expense.amount + (Math.random() - 0.5) * 3,
          currency: 'GBP',
          description: expense.description,
          merchant: expense.merchant,
          categoryId: transportCategory.id
        })
      }
      
      // Random entertainment/shopping (20% chance)
      if (Math.random() < 0.2) {
        const otherExpenses = [
          { merchant: 'Netflix', amount: -12.99, description: 'Subscription', category: entertainmentCategory.id, isSubscription: true },
          { merchant: 'Amazon', amount: -34.99, description: 'Online Purchase', category: shoppingCategory.id },
          { merchant: 'Spotify', amount: -9.99, description: 'Music Subscription', category: entertainmentCategory.id, isSubscription: true },
          { merchant: 'Boots', amount: -18.50, description: 'Pharmacy', category: healthcareCategory.id },
          { merchant: 'Vue Cinema', amount: -15.00, description: 'Movie Tickets', category: entertainmentCategory.id }
        ]
        
        const expense = otherExpenses[Math.floor(Math.random() * otherExpenses.length)]
        transactions.push({
          accountId: Math.random() < 0.5 ? currentAccount.id : creditAccount.id,
          date,
          amount: expense.amount + (Math.random() - 0.5) * 5,
          currency: 'GBP',
          description: expense.description,
          merchant: expense.merchant,
          categoryId: expense.category,
          isSubscription: expense.isSubscription
        })
      }
    }
    
    // Add some transfers between accounts
    transactions.push({
      accountId: currentAccount.id,
      date: subDays(new Date(), 15),
      amount: -500.00,
      currency: 'GBP',
      description: 'Transfer to Savings',
      merchant: 'Marcus by Goldman Sachs'
    })
    
    transactions.push({
      accountId: savingsAccount.id,
      date: subDays(new Date(), 15),
      amount: 500.00,
      currency: 'GBP',
      description: 'Transfer from Current Account',
      merchant: 'Santander'
    })
    
    const createdTransactions: Transaction[] = []
    for (const transaction of transactions) {
      // Ensure date is a valid Date object
      const transactionWithValidDate = {
        ...transaction,
        date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date)
      }
      
      const created = await transactionRepo.create(transactionWithValidDate)
      createdTransactions.push(created)
    }
    
    return createdTransactions
  }
  
  /**
   * Create demo budgets
   */
  private async createDemoBudgets(categories: Category[]): Promise<Budget[]> {
    const currentMonth = format(new Date(), 'yyyy-MM')
    const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM')
    
    const budgetData = [
      { categoryName: 'Food', amount: 400, carryStrategy: 'carryUnspent' as const },
      { categoryName: 'Housing', amount: 1300, carryStrategy: 'carryNone' as const },
      { categoryName: 'Transport', amount: 200, carryStrategy: 'carryOverspend' as const },
      { categoryName: 'Entertainment', amount: 150, carryStrategy: 'carryUnspent' as const },
      { categoryName: 'Shopping', amount: 300, carryStrategy: 'carryNone' as const },
      { categoryName: 'Utilities', amount: 200, carryStrategy: 'carryNone' as const },
      { categoryName: 'Healthcare', amount: 100, carryStrategy: 'carryUnspent' as const }
    ]
    
    const budgets: Omit<Budget, 'id'>[] = []
    
    for (const data of budgetData) {
      const category = categories.find(c => c.name.includes(data.categoryName))
      if (category) {
        // Create budget for current month
        budgets.push({
          categoryId: category.id,
          month: currentMonth,
          amount: data.amount,
          carryStrategy: data.carryStrategy
        })
        
        // Create budget for last month
        budgets.push({
          categoryId: category.id,
          month: lastMonth,
          amount: data.amount,
          carryStrategy: data.carryStrategy
        })
      }
    }
    
    const createdBudgets: Budget[] = []
    for (const budget of budgets) {
      const created = await budgetRepo.create(budget)
      createdBudgets.push(created)
    }
    
    return createdBudgets
  }
  
  /**
   * Create demo rules
   */
  private async createDemoRules(categories: Category[]): Promise<Rule[]> {
    const foodCategory = categories.find(c => c.name.includes('Food'))!
    const transportCategory = categories.find(c => c.name.includes('Transport'))!
    const utilitiesCategory = categories.find(c => c.name.includes('Utilities'))!
    const entertainmentCategory = categories.find(c => c.name.includes('Entertainment'))!
    
    const rules: Omit<Rule, 'id'>[] = [
      {
        name: 'Categorize Grocery Shopping',
        enabled: true,
        priority: 0,
        conditions: [
          { field: 'merchant', op: 'contains', value: 'tesco' },
        ],
        actions: [
          { setCategoryId: foodCategory.id }
        ],
        stopProcessing: false
      },
      {
        name: 'Categorize Transport',
        enabled: true,
        priority: 1,
        conditions: [
          { field: 'merchant', op: 'eq', value: 'TfL' }
        ],
        actions: [
          { setCategoryId: transportCategory.id }
        ],
        stopProcessing: false
      },
      {
        name: 'Categorize Subscriptions',
        enabled: true,
        priority: 2,
        conditions: [
          { field: 'merchant', op: 'contains', value: 'netflix' }
        ],
        actions: [
          { setCategoryId: entertainmentCategory.id, setIsSubscription: true }
        ],
        stopProcessing: true
      },
      {
        name: 'Auto-categorize Utilities',
        enabled: true,
        priority: 3,
        conditions: [
          { field: 'description', op: 'contains', value: 'bill' }
        ],
        actions: [
          { setCategoryId: utilitiesCategory.id }
        ],
        stopProcessing: false
      }
    ]
    
    const createdRules: Rule[] = []
    for (const rule of rules) {
      const created = await ruleRepo.create(rule)
      createdRules.push(created)
    }
    
    return createdRules
  }
  
  /**
   * Create demo subscriptions
   */
  private async createDemoSubscriptions(accounts: Account[], categories: Category[]): Promise<Subscription[]> {
    const currentAccount = accounts.find(a => a.name.includes('Santander'))!
    const entertainmentCategory = categories.find(c => c.name.includes('Entertainment'))!
    const utilitiesCategory = categories.find(c => c.name.includes('Utilities'))!
    const healthcareCategory = categories.find(c => c.name.includes('Healthcare'))!
    
    const subscriptions: Omit<Subscription, 'id'>[] = [
      {
        name: 'Netflix',
        cadence: 'monthly',
        amount: 12.99,
        currency: 'GBP',
        nextDueDate: addDays(new Date(), 5),
        accountId: currentAccount.id,
        categoryId: entertainmentCategory.id,
        notes: 'Premium subscription for family'
      },
      {
        name: 'Spotify Premium',
        cadence: 'monthly',
        amount: 9.99,
        currency: 'GBP',
        nextDueDate: addDays(new Date(), 12),
        accountId: currentAccount.id,
        categoryId: entertainmentCategory.id
      },
      {
        name: 'Mobile Phone Contract',
        cadence: 'monthly',
        amount: 25.00,
        currency: 'GBP',
        nextDueDate: addDays(new Date(), 18),
        accountId: currentAccount.id,
        categoryId: utilitiesCategory.id,
        notes: '24-month contract with Three'
      },
      {
        name: 'Gym Membership',
        cadence: 'monthly',
        amount: 45.00,
        currency: 'GBP',
        nextDueDate: addDays(new Date(), 25),
        accountId: currentAccount.id,
        categoryId: healthcareCategory.id
      },
      {
        name: 'Car Insurance',
        cadence: 'yearly',
        amount: 650.00,
        currency: 'GBP',
        nextDueDate: addDays(new Date(), 95),
        accountId: currentAccount.id,
        notes: 'Comprehensive cover with Direct Line'
      }
    ]
    
    const createdSubscriptions: Subscription[] = []
    for (const subscription of subscriptions) {
      const created = await subscriptionRepo.create(subscription)
      createdSubscriptions.push(created)
    }
    
    return createdSubscriptions
  }
}

// Export singleton instance
export const demoService = new DemoService()