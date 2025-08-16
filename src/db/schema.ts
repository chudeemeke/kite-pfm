import Dexie, { Table } from 'dexie'
import type {
  Account,
  Transaction,
  Category,
  Budget,
  Rule,
  Subscription,
  AppMeta,
  User,
  SecurityCredential,
  SecuritySettings,
  Settings,
  Goal,
  GoalMilestone,
  GoalContribution,
  AnomalyInsight,
  Backup
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
  users!: Table<User, string>
  securityCredentials!: Table<SecurityCredential, string>
  securitySettings!: Table<SecuritySettings, string>
  settings!: Table<Settings, string>
  goals!: Table<Goal, string>
  goalMilestones!: Table<GoalMilestone, string>
  goalContributions!: Table<GoalContribution, string>
  anomalyInsights!: Table<AnomalyInsight, string>
  backups!: Table<Backup, string>

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

    // Version 4 - Add security and user management tables
    this.version(4).stores({
      accounts: 'id, name, type, currency, balance, createdAt, archivedAt',
      transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, metadata, [accountId+date], [categoryId+date]',
      categories: 'id, name, icon, color, parentId',
      budgets: 'id, categoryId, month, amount, carryStrategy, [categoryId+month]',
      rules: 'id, name, enabled, priority, stopProcessing',
      subscriptions: 'id, name, cadence, amount, currency, nextDueDate, accountId, categoryId',
      appMeta: 'id, schemaVersion, appVersion, createdAt, updatedAt',
      // New security tables
      users: 'id, email, name, createdAt, lastActiveAt',
      securityCredentials: 'id, userId, type, credentialId, encryptedData, deviceName, createdAt, lastUsedAt, [userId+type]',
      securitySettings: 'id, userId, autoLockMinutes, privacyMode, biometricEnabled, pinEnabled, updatedAt',
      settings: 'id, value, createdAt, updatedAt'
    }).upgrade(async tx => {
      // Create default user if none exists
      const users = await tx.table('users').toArray()
      if (users.length === 0) {
        await tx.table('users').add({
          id: 'default-user',
          email: 'user@kite.app',
          name: 'User',
          createdAt: new Date(),
          lastActiveAt: new Date()
        })
        
        // Create default security settings
        await tx.table('securitySettings').add({
          id: 'security-default-user',
          userId: 'default-user',
          autoLockMinutes: 5,
          privacyMode: false,
          biometricEnabled: false,
          pinEnabled: false,
          updatedAt: new Date()
        })
      }
    })

    // Version 5 - Add goals and insights tables
    this.version(5).stores({
      accounts: 'id, name, type, currency, balance, createdAt, archivedAt',
      transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, metadata, [accountId+date], [categoryId+date]',
      categories: 'id, name, icon, color, parentId',
      budgets: 'id, categoryId, month, amount, carryStrategy, [categoryId+month]',
      rules: 'id, name, enabled, priority, stopProcessing',
      subscriptions: 'id, name, cadence, amount, currency, nextDueDate, accountId, categoryId',
      appMeta: 'id, schemaVersion, appVersion, createdAt, updatedAt',
      users: 'id, email, name, createdAt, lastActiveAt',
      securityCredentials: 'id, userId, type, credentialId, encryptedData, deviceName, createdAt, lastUsedAt, [userId+type]',
      securitySettings: 'id, userId, autoLockMinutes, privacyMode, biometricEnabled, pinEnabled, updatedAt',
      settings: 'id, value, createdAt, updatedAt',
      // New tables for goals and insights
      goals: 'id, userId, name, type, category, status, priority, targetDate, createdAt, [userId+status], [userId+targetDate]',
      goalMilestones: 'id, goalId, targetAmount, achievedAt, [goalId+achievedAt]',
      goalContributions: 'id, goalId, date, amount, source, [goalId+date]',
      anomalyInsights: 'id, type, severity, detectedAt, dismissed, [type+detectedAt], [dismissed+detectedAt]'
    })

    // Version 6 - Add backups table for storing backup data
    this.version(6).stores({
      accounts: 'id, name, type, currency, balance, createdAt, archivedAt',
      transactions: 'id, accountId, date, amount, currency, description, merchant, categoryId, isSubscription, metadata, [accountId+date], [categoryId+date]',
      categories: 'id, name, icon, color, parentId',
      budgets: 'id, categoryId, month, amount, carryStrategy, [categoryId+month]',
      rules: 'id, name, enabled, priority, stopProcessing',
      subscriptions: 'id, name, cadence, amount, currency, nextDueDate, accountId, categoryId',
      appMeta: 'id, schemaVersion, appVersion, createdAt, updatedAt',
      users: 'id, email, name, createdAt, lastActiveAt',
      securityCredentials: 'id, userId, type, credentialId, encryptedData, deviceName, createdAt, lastUsedAt, [userId+type]',
      securitySettings: 'id, userId, autoLockMinutes, privacyMode, biometricEnabled, pinEnabled, updatedAt',
      settings: 'id, value, createdAt, updatedAt',
      goals: 'id, userId, name, type, category, status, priority, targetDate, createdAt, [userId+status], [userId+targetDate]',
      goalMilestones: 'id, goalId, targetAmount, achievedAt, [goalId+achievedAt]',
      goalContributions: 'id, goalId, date, amount, source, [goalId+date]',
      anomalyInsights: 'id, type, severity, detectedAt, dismissed, [type+detectedAt], [dismissed+detectedAt]',
      // New backup table
      backups: 'id, name, type, createdAt, size, [type+createdAt]'
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
      const clearPromises = [
        this.accounts.clear(),
        this.transactions.clear(),
        this.categories.clear(),
        this.budgets.clear(),
        this.rules.clear(),
        this.subscriptions.clear(),
        this.securityCredentials.clear(),
        // Don't clear users or security settings - preserve security config
      ]
      
      // Clear new tables if they exist (after migration)
      if (this.goals) {
        clearPromises.push(this.goals.clear())
        clearPromises.push(this.goalMilestones.clear())
        clearPromises.push(this.goalContributions.clear())
        clearPromises.push(this.anomalyInsights.clear())
      }
      
      // Clear backups table if exists
      if (this.backups) {
        clearPromises.push(this.backups.clear())
      }
      
      await Promise.all(clearPromises)
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
  appMeta,
  users,
  securityCredentials,
  securitySettings,
  settings,
  goals,
  goalMilestones,
  goalContributions,
  anomalyInsights,
  backups
} = db