import { nanoid } from 'nanoid'
import { db } from './schema'
import type {
  Account,
  Transaction,
  Category,
  Budget,
  Rule,
  Subscription
} from '@/types'

// Account Repository
export class AccountRepository {
  async create(data: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    const account: Account = {
      ...data,
      id: nanoid(),
      createdAt: new Date()
    }
    await db.accounts.add(account)
    return account
  }

  async getById(id: string): Promise<Account | undefined> {
    return db.accounts.get(id)
  }

  async getAll(): Promise<Account[]> {
    return db.accounts.toArray()
  }

  async getActive(): Promise<Account[]> {
    return db.accounts.filter(account => !account.archivedAt).toArray()
  }

  async update(id: string, data: Partial<Account>): Promise<void> {
    await db.accounts.update(id, data)
  }

  async archive(id: string): Promise<void> {
    await db.accounts.update(id, { archivedAt: new Date() })
  }

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.accounts, db.transactions], async () => {
      // Check if account has transactions
      const transactionCount = await db.transactions.where('accountId').equals(id).count()
      if (transactionCount > 0) {
        throw new Error('Cannot delete account with transactions. Archive it instead.')
      }
      await db.accounts.delete(id)
    })
  }

  async getTotalBalance(): Promise<number> {
    const accounts = await this.getActive()
    return accounts.reduce((total, account) => total + account.balance, 0)
  }

  async setDefaultAccount(id: string): Promise<void> {
    await db.transaction('rw', db.accounts, async () => {
      // First clear all default flags
      const allAccounts = await db.accounts.toArray()
      await Promise.all(
        allAccounts.map(account => 
          db.accounts.update(account.id, { isDefault: false })
        )
      )
      
      // Then set the new default
      await db.accounts.update(id, { isDefault: true })
    })
  }
}

// Transaction Repository
export class TransactionRepository {
  async create(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    const transaction: Transaction = {
      ...data,
      id: nanoid()
    }
    await db.transactions.add(transaction)
    return transaction
  }

  async getById(id: string): Promise<Transaction | undefined> {
    return db.transactions.get(id)
  }

  async getAll(): Promise<Transaction[]> {
    return db.transactions.orderBy('date').reverse().toArray()
  }

  async getByAccountId(accountId: string, limit?: number): Promise<Transaction[]> {
    let query = db.transactions.where('accountId').equals(accountId).reverse()
    if (limit) {
      query = query.limit(limit)
    }
    return query.toArray()
  }

  async getByCategoryId(categoryId: string, limit?: number): Promise<Transaction[]> {
    let query = db.transactions.where('categoryId').equals(categoryId).reverse()
    if (limit) {
      query = query.limit(limit)
    }
    return query.toArray()
  }

  async getByDateRange(start: Date, end: Date): Promise<Transaction[]> {
    return db.transactions
      .where('date')
      .between(start, end, true, true)
      .reverse()
      .toArray()
  }

  async update(id: string, data: Partial<Transaction>): Promise<void> {
    await db.transactions.update(id, data)
  }

  async bulkUpdate(ids: string[], data: Partial<Transaction>): Promise<void> {
    await db.transaction('rw', db.transactions, async () => {
      await Promise.all(ids.map(id => db.transactions.update(id, data)))
    })
  }

  async delete(id: string): Promise<void> {
    await db.transactions.delete(id)
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await db.transactions.bulkDelete(ids)
  }

  async getSpendingByCategory(start: Date, end: Date): Promise<Array<{ categoryId: string; amount: number }>> {
    const transactions = await this.getByDateRange(start, end)
    const spending = transactions
      .filter(t => t.amount < 0 && t.categoryId) // Only expenses with categories
      .reduce((acc, t) => {
        const categoryId = t.categoryId!
        acc[categoryId] = (acc[categoryId] || 0) + Math.abs(t.amount)
        return acc
      }, {} as Record<string, number>)

    return Object.entries(spending).map(([categoryId, amount]) => ({
      categoryId,
      amount
    }))
  }

  async getCashflow(start: Date, end: Date): Promise<{ income: number; expenses: number; net: number }> {
    const transactions = await this.getByDateRange(start, end)
    const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const expenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))
    return { income, expenses, net: income - expenses }
  }
}

// Category Repository
export class CategoryRepository {
  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const category: Category = {
      ...data,
      id: nanoid()
    }
    await db.categories.add(category)
    return category
  }

  async getById(id: string): Promise<Category | undefined> {
    return db.categories.get(id)
  }

  async getAll(): Promise<Category[]> {
    return db.categories.toArray()
  }

  async getTopLevel(): Promise<Category[]> {
    return db.categories.filter(category => !category.parentId).toArray()
  }

  async getChildren(parentId: string): Promise<Category[]> {
    return db.categories.where('parentId').equals(parentId).toArray()
  }

  async update(id: string, data: Partial<Category>): Promise<void> {
    await db.categories.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.categories, db.transactions, db.budgets], async () => {
      // Check if category has transactions or budgets
      const [transactionCount, budgetCount] = await Promise.all([
        db.transactions.where('categoryId').equals(id).count(),
        db.budgets.where('categoryId').equals(id).count()
      ])
      
      if (transactionCount > 0 || budgetCount > 0) {
        throw new Error('Cannot delete category with associated transactions or budgets')
      }
      
      // Check for child categories
      const children = await this.getChildren(id)
      if (children.length > 0) {
        throw new Error('Cannot delete category with subcategories')
      }
      
      await db.categories.delete(id)
    })
  }
}

// Budget Repository
export class BudgetRepository {
  async create(data: Omit<Budget, 'id'>): Promise<Budget> {
    const budget: Budget = {
      ...data,
      id: nanoid()
    }
    await db.budgets.add(budget)
    return budget
  }

  async getById(id: string): Promise<Budget | undefined> {
    return db.budgets.get(id)
  }

  async getByMonth(month: string): Promise<Budget[]> {
    return db.budgets.where('month').equals(month).toArray()
  }

  async getByCategoryId(categoryId: string): Promise<Budget[]> {
    return db.budgets.where('categoryId').equals(categoryId).toArray()
  }

  async getByCategoryAndMonth(categoryId: string, month: string): Promise<Budget | undefined> {
    return db.budgets.where(['categoryId', 'month']).equals([categoryId, month]).first()
  }

  async update(id: string, data: Partial<Budget>): Promise<void> {
    await db.budgets.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await db.budgets.delete(id)
  }

  async getAll(): Promise<Budget[]> {
    return db.budgets.toArray()
  }
}

// Rule Repository
export class RuleRepository {
  async create(data: Omit<Rule, 'id'>): Promise<Rule> {
    const rule: Rule = {
      ...data,
      id: nanoid()
    }
    await db.rules.add(rule)
    return rule
  }

  async getById(id: string): Promise<Rule | undefined> {
    return db.rules.get(id)
  }

  async getAll(): Promise<Rule[]> {
    return db.rules.orderBy('priority').toArray()
  }

  async getEnabled(): Promise<Rule[]> {
    return db.rules.filter(rule => rule.enabled).sortBy('priority')
  }

  async update(id: string, data: Partial<Rule>): Promise<void> {
    await db.rules.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await db.rules.delete(id)
  }

  async reorder(ruleIds: string[]): Promise<void> {
    await db.transaction('rw', db.rules, async () => {
      await Promise.all(
        ruleIds.map((id, index) => 
          db.rules.update(id, { priority: index })
        )
      )
    })
  }
}

// Subscription Repository
export class SubscriptionRepository {
  async create(data: Omit<Subscription, 'id'>): Promise<Subscription> {
    const subscription: Subscription = {
      ...data,
      id: nanoid()
    }
    await db.subscriptions.add(subscription)
    return subscription
  }

  async getById(id: string): Promise<Subscription | undefined> {
    return db.subscriptions.get(id)
  }

  async getAll(): Promise<Subscription[]> {
    return db.subscriptions.toArray()
  }

  async getUpcoming(days: number = 30): Promise<Subscription[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    
    return db.subscriptions
      .where('nextDueDate')
      .belowOrEqual(futureDate)
      .toArray()
  }

  async update(id: string, data: Partial<Subscription>): Promise<void> {
    await db.subscriptions.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await db.subscriptions.delete(id)
  }
}

// Export repository instances
export const accountRepo = new AccountRepository()
export const transactionRepo = new TransactionRepository()
export const categoryRepo = new CategoryRepository()
export const budgetRepo = new BudgetRepository()
export const ruleRepo = new RuleRepository()
export const subscriptionRepo = new SubscriptionRepository()