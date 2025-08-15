import Dexie, { Table } from 'dexie'
import type {
  Account,
  Transaction,
  Category,
  Budget,
  Rule,
  Subscription,
  AppMeta
} from '@/types'

export class KiteDatabase extends Dexie {
  // Table declarations
  accounts!: Table<Account, string>
  transactions!: Table<Transaction, string>
  categories!: Table<Category, string>
  budgets!: Table<Budget, string>
  rules!: Table<Rule, string>
  subscriptions!: Table<Subscription, string>
  appMeta!: Table<AppMeta, 'singleton'>

  constructor() {
    super('KiteDatabase')

    // Version 1 - Initial schema
    this.version(1).stores({
      accounts: 'id, name, type, currency, balance, createdAt, archivedAt',
      transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription',
      categories: 'id, name, icon, color, parentId',
      budgets: 'id, categoryId, month, amount, carryStrategy',
      rules: 'id, name, enabled, priority, stopProcessing',
      subscriptions: 'id, name, cadence, amount, currency, nextDueDate, accountId, categoryId',
      appMeta: 'id, schemaVersion, appVersion, createdAt, updatedAt'
    })

    // Version 2 - Add indexes for better query performance
    this.version(2).stores({
      accounts: 'id, name, type, currency, balance, createdAt, archivedAt',
      transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, [accountId+date], [categoryId+date]',
      categories: 'id, name, icon, color, parentId',
      budgets: 'id, categoryId, month, amount, carryStrategy, [categoryId+month]',
      rules: 'id, name, enabled, priority, stopProcessing',
      subscriptions: 'id, name, cadence, amount, currency, nextDueDate, accountId, categoryId',
      appMeta: 'id, schemaVersion, appVersion, createdAt, updatedAt'
    })

    // Version 3 - Add metadata field to transactions
    this.version(3).stores({
      accounts: 'id, name, type, currency, balance, createdAt, archivedAt',
      transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, metadata, [accountId+date], [categoryId+date]',
      categories: 'id, name, icon, color, parentId',
      budgets: 'id, categoryId, month, amount, carryStrategy, [categoryId+month]',
      rules: 'id, name, enabled, priority, stopProcessing',
      subscriptions: 'id, name, cadence, amount, currency, nextDueDate, accountId, categoryId',
      appMeta: 'id, schemaVersion, appVersion, createdAt, updatedAt'
    }).upgrade(tx => {
      // Add metadata field to existing transactions
      return tx.table('transactions').toCollection().modify(transaction => {
        if (!transaction.metadata) {
          transaction.metadata = {}
        }
      })
    })

    // Hook for schema upgrades - track migrations in appMeta
    this.on('ready', async () => {
      await this.trackMigration()
    })
  }

  private async trackMigration() {
    try {
      let meta = await this.appMeta.get('singleton')
      const currentVersion = this.verno
      const appVersion = '1.0.0'

      if (!meta) {
        // First time setup
        meta = {
          id: 'singleton',
          schemaVersion: currentVersion,
          appVersion,
          createdAt: new Date(),
          updatedAt: new Date(),
          migrations: [`v${currentVersion}-initial-setup`]
        }
        await this.appMeta.add(meta)
      } else if (meta.schemaVersion < currentVersion) {
        // Schema was upgraded
        const migrationName = `v${meta.schemaVersion}-to-v${currentVersion}`
        meta.schemaVersion = currentVersion
        meta.appVersion = appVersion
        meta.updatedAt = new Date()
        meta.migrations.push(migrationName)
        await this.appMeta.update('singleton', {
          schemaVersion: currentVersion,
          appVersion,
          updatedAt: new Date(),
          migrations: [...meta.migrations, migrationName]
        })
      }
    } catch (error) {
      console.error('Failed to track migration:', error)
    }
  }

  // Helper method to clear all data (for reset functionality)
  async clearAllData(): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      await Promise.all([
        this.accounts.clear(),
        this.transactions.clear(),
        this.categories.clear(),
        this.budgets.clear(),
        this.rules.clear(),
        this.subscriptions.clear()
      ])
      // Keep appMeta but update timestamp
      const meta = await this.appMeta.get('singleton')
      if (meta) {
        await this.appMeta.update('singleton', {
          updatedAt: new Date(),
          migrations: [...meta.migrations, `reset-${new Date().toISOString()}`]
        })
      }
    })
  }

  // Helper method to get migration history
  async getMigrationHistory(): Promise<string[]> {
    const meta = await this.appMeta.get('singleton')
    return meta?.migrations || []
  }
}

// Create and export database instance
export const db = new KiteDatabase()

// Export table references for convenience
export const {
  accounts,
  transactions,
  categories,
  budgets,
  rules,
  subscriptions,
  appMeta
} = db