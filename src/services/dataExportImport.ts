/**
 * Data Export/Import Service - Refactored to use IndexedDB
 * Handles data export and import without using localStorage
 */

import { db } from '@/db/schema'
import { backupService } from '@/services/backup'
import { useAccountsStore } from '@/stores/accounts'
import { useTransactionsStore } from '@/stores/transactions'
import { useBudgetsStore } from '@/stores/budgets'
import { useCategoriesStore } from '@/stores/categories'
import { useSettingsStore } from '@/stores/settings'
import { toast } from '@/stores'
import type { Account, Transaction, Budget, Category } from '@/types'

export interface ExportData {
  version: string
  exportDate: string
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  categories: Category[]
  settings: any
  metadata: {
    totalAccounts: number
    totalTransactions: number
    totalBudgets: number
    totalCategories: number
    dateRange: {
      earliest: string | null
      latest: string | null
    }
  }
}

export interface ImportResult {
  success: boolean
  errors: string[]
  warnings: string[]
  imported: {
    accounts: number
    transactions: number
    budgets: number
    categories: number
  }
  skipped: {
    accounts: number
    transactions: number
    budgets: number
    categories: number
  }
}

export class DataExportImportService {
  private static instance: DataExportImportService

  public static getInstance(): DataExportImportService {
    if (!DataExportImportService.instance) {
      DataExportImportService.instance = new DataExportImportService()
    }
    return DataExportImportService.instance
  }

  /**
   * Export all data in the specified format
   */
  public async exportData(format: 'json' | 'csv' | 'excel'): Promise<void> {
    try {
      const data = await this.gatherExportData()
      
      switch (format) {
        case 'json':
          await this.exportAsJSON(data)
          break
        case 'csv':
          await this.exportAsCSV(data)
          break
        case 'excel':
          await this.exportAsExcel(data)
          break
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
      
      toast.success('Export completed', 'Your data has been successfully exported')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed', error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }

  /**
   * Import data from file
   */
  public async importData(file: File): Promise<ImportResult> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      switch (fileExtension) {
        case 'json':
          return await this.importFromJSON(file)
        case 'csv':
          return await this.importFromCSV(file)
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`)
      }
    } catch (error) {
      console.error('Import failed:', error)
      throw error
    }
  }

  /**
   * Create a backup using the backup service (which uses IndexedDB)
   */
  public async createBackup(name?: string): Promise<string> {
    try {
      const backup = await backupService.createBackup(name, 'manual')
      toast.success('Backup created', `Backup "${backup.name}" has been created`)
      return backup.id
    } catch (error) {
      console.error('Backup creation failed:', error)
      toast.error('Backup failed', 'Failed to create backup')
      throw error
    }
  }

  /**
   * Restore from a backup using the backup service
   */
  public async restoreFromBackup(backupId: string): Promise<void> {
    try {
      await backupService.restoreBackup(backupId)
      toast.success('Restore completed', 'Your data has been restored successfully')
      
      // Reload stores after restore
      await this.reloadStores()
    } catch (error) {
      console.error('Restore failed:', error)
      toast.error('Restore failed', 'Failed to restore from backup')
      throw error
    }
  }

  /**
   * List all available backups
   */
  public async listBackups(): Promise<Array<{ id: string; created: string; version: string; name: string }>> {
    try {
      const backups = await backupService.getAllBackups()
      return backups.map(backup => ({
        id: backup.id,
        created: backup.createdAt.toISOString(),
        version: backup.metadata.version,
        name: backup.name
      }))
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }

  /**
   * Delete a backup
   */
  public async deleteBackup(backupId: string): Promise<void> {
    try {
      await backupService.deleteBackup(backupId)
      toast.success('Backup deleted', 'Backup has been deleted')
    } catch (error) {
      console.error('Failed to delete backup:', error)
      toast.error('Delete failed', 'Failed to delete backup')
      throw error
    }
  }

  /**
   * Get cache information from IndexedDB
   */
  public async getCacheInfo(): Promise<{ 
    totalSize: number; 
    itemCount: number; 
    breakdown: Record<string, number> 
  }> {
    try {
      const breakdown: Record<string, number> = {}
      let totalSize = 0
      let itemCount = 0

      // Get counts from each table
      const tables = [
        'accounts', 'transactions', 'categories', 'budgets', 'rules', 
        'subscriptions', 'goals', 'notifications', 'backups'
      ]

      for (const tableName of tables) {
        const count = await (db as any)[tableName]?.count() || 0
        breakdown[tableName] = count
        itemCount += count
      }

      // Estimate size (rough approximation)
      // In a real implementation, you'd need to serialize and measure actual size
      const transactions = await db.transactions.toArray()
      const transactionsSize = JSON.stringify(transactions).length
      
      const accounts = await db.accounts.toArray()
      const accountsSize = JSON.stringify(accounts).length
      
      totalSize = transactionsSize + accountsSize // Add more tables as needed

      return { totalSize, itemCount, breakdown }
    } catch (error) {
      console.error('Failed to get cache info:', error)
      return { totalSize: 0, itemCount: 0, breakdown: {} }
    }
  }

  /**
   * Clear cache data from IndexedDB (keeping user settings and backups)
   */
  public async clearCache(): Promise<void> {
    try {
      // Clear only transient data, not user settings or backups
      await db.transaction('rw', 
        db.notifications,
        db.anomalyInsights,
        async () => {
          await db.notifications.clear()
          await db.anomalyInsights.clear()
        }
      )
      
      toast.success('Cache cleared', 'Temporary data has been cleared')
    } catch (error) {
      console.error('Failed to clear cache:', error)
      toast.error('Clear failed', 'Failed to clear cache')
      throw error
    }
  }

  /**
   * Gather all data for export
   */
  private async gatherExportData(): Promise<ExportData> {
    const accounts = await db.accounts.toArray()
    const transactions = await db.transactions.toArray()
    const budgets = await db.budgets.toArray()
    const categories = await db.categories.toArray()
    const settings = useSettingsStore.getState()

    // Calculate date range
    const dates = transactions.map(t => t.date.getTime())
    const earliest = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null
    const latest = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null

    return {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      accounts,
      transactions,
      budgets,
      categories,
      settings,
      metadata: {
        totalAccounts: accounts.length,
        totalTransactions: transactions.length,
        totalBudgets: budgets.length,
        totalCategories: categories.length,
        dateRange: { earliest, latest }
      }
    }
  }

  /**
   * Export data as JSON file
   */
  private async exportAsJSON(data: ExportData): Promise<void> {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `kite-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Export data as CSV files (multiple files in a zip)
   */
  private async exportAsCSV(data: ExportData): Promise<void> {
    // Convert accounts to CSV
    const accountsCSV = this.convertToCSV(data.accounts, [
      'id', 'name', 'type', 'balance', 'currency', 'createdAt'
    ])
    
    // Convert transactions to CSV
    const transactionsCSV = this.convertToCSV(data.transactions.map(t => ({
      ...t,
      date: t.date.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt?.toISOString()
    })), [
      'id', 'accountId', 'date', 'amount', 'description', 'merchant', 
      'categoryId', 'tags', 'notes', 'createdAt'
    ])

    // For simplicity, create separate downloads
    // In production, you'd want to use a zip library
    this.downloadCSV(accountsCSV, 'accounts.csv')
    this.downloadCSV(transactionsCSV, 'transactions.csv')
  }

  /**
   * Export as Excel (simplified - creates CSV that Excel can open)
   */
  private async exportAsExcel(data: ExportData): Promise<void> {
    // For now, just export as CSV which Excel can open
    // In production, you'd use a library like xlsx
    await this.exportAsCSV(data)
  }

  /**
   * Import data from JSON file
   */
  private async importFromJSON(file: File): Promise<ImportResult> {
    const text = await file.text()
    const data = JSON.parse(text) as ExportData
    
    const result: ImportResult = {
      success: true,
      errors: [],
      warnings: [],
      imported: { accounts: 0, transactions: 0, budgets: 0, categories: 0 },
      skipped: { accounts: 0, transactions: 0, budgets: 0, categories: 0 }
    }

    try {
      // Import categories first (as transactions depend on them)
      for (const category of data.categories || []) {
        try {
          await db.categories.add(category)
          result.imported.categories++
        } catch (error) {
          result.skipped.categories++
          result.warnings.push(`Skipped category ${category.name}: already exists`)
        }
      }

      // Import accounts
      for (const account of data.accounts || []) {
        try {
          await db.accounts.add(account)
          result.imported.accounts++
        } catch (error) {
          result.skipped.accounts++
          result.warnings.push(`Skipped account ${account.name}: already exists`)
        }
      }

      // Import transactions
      for (const transaction of data.transactions || []) {
        try {
          await db.transactions.add({
            ...transaction,
            date: new Date(transaction.date),
            createdAt: new Date(transaction.createdAt),
            updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt) : undefined
          })
          result.imported.transactions++
        } catch (error) {
          result.skipped.transactions++
        }
      }

      // Import budgets
      for (const budget of data.budgets || []) {
        try {
          await db.budgets.add(budget)
          result.imported.budgets++
        } catch (error) {
          result.skipped.budgets++
        }
      }

      // Reload stores after import
      await this.reloadStores()
      
      toast.success('Import completed', 
        `Imported ${result.imported.accounts} accounts, ${result.imported.transactions} transactions`)
    } catch (error) {
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      toast.error('Import failed', 'Some data could not be imported')
    }

    return result
  }

  /**
   * Import from CSV file
   */
  private async importFromCSV(file: File): Promise<ImportResult> {
    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    const result: ImportResult = {
      success: true,
      errors: [],
      warnings: [],
      imported: { accounts: 0, transactions: 0, budgets: 0, categories: 0 },
      skipped: { accounts: 0, transactions: 0, budgets: 0, categories: 0 }
    }

    // Simple CSV import - would need enhancement for production
    toast.info('CSV Import', 'CSV import is limited. Use JSON for full data import.')
    
    return result
  }

  /**
   * Convert array of objects to CSV string
   */
  private convertToCSV(data: any[], headers: string[]): string {
    const csvHeaders = headers.join(',')
    const csvRows = data.map(item => 
      headers.map(header => {
        const value = item[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  /**
   * Download CSV file
   */
  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Reload all stores after import/restore
   */
  private async reloadStores(): Promise<void> {
    // Force reload of all stores from database
    const accountsStore = useAccountsStore.getState()
    const transactionsStore = useTransactionsStore.getState()
    const budgetsStore = useBudgetsStore.getState()
    const categoriesStore = useCategoriesStore.getState()
    
    // These would need to be implemented in each store
    // For now, we'll just reload the page to ensure fresh data
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }
}

// Export singleton instance
export const dataExportImportService = DataExportImportService.getInstance()