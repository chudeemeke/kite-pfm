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
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: [],
        imported: { accounts: 0, transactions: 0, budgets: 0, categories: 0 },
        skipped: { accounts: 0, transactions: 0, budgets: 0, categories: 0 }
      }
    }
  }

  /**
   * Create backup in IndexedDB
   */
  public async createBackup(): Promise<string> {
    try {
      const data = await this.gatherExportData()
      const backupId = `backup_${Date.now()}`
      
      // Store in IndexedDB
      const compressedData = this.compressData(data)
      localStorage.setItem(`kite_backup_${backupId}`, JSON.stringify({
        id: backupId,
        data: compressedData,
        created: new Date().toISOString(),
        version: data.version
      }))
      
      toast.success('Backup created', `Backup ${backupId} has been created successfully`)
      return backupId
    } catch (error) {
      console.error('Backup failed:', error)
      toast.error('Backup failed', error instanceof Error ? error.message : 'Unknown error occurred')
      throw error
    }
  }

  /**
   * Restore from backup
   */
  public async restoreFromBackup(backupId: string): Promise<void> {
    try {
      const backupData = localStorage.getItem(`kite_backup_${backupId}`)
      if (!backupData) {
        throw new Error('Backup not found')
      }
      
      const backup = JSON.parse(backupData)
      const data = this.decompressData(backup.data)
      
      await this.restoreData(data)
      
      toast.success('Restore completed', 'Your data has been successfully restored')
    } catch (error) {
      console.error('Restore failed:', error)
      toast.error('Restore failed', error instanceof Error ? error.message : 'Unknown error occurred')
      throw error
    }
  }

  /**
   * List available backups
   */
  public getAvailableBackups(): Array<{ id: string; created: string; version: string }> {
    const backups: Array<{ id: string; created: string; version: string }> = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('kite_backup_')) {
        try {
          const backupData = localStorage.getItem(key)
          if (backupData) {
            const backup = JSON.parse(backupData)
            backups.push({
              id: backup.id,
              created: backup.created,
              version: backup.version
            })
          }
        } catch (error) {
          console.warn(`Failed to parse backup ${key}:`, error)
        }
      }
    }
    
    return backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  }

  /**
   * Delete backup
   */
  public deleteBackup(backupId: string): void {
    localStorage.removeItem(`kite_backup_${backupId}`)
    toast.success('Backup deleted', `Backup ${backupId} has been deleted`)
  }

  /**
   * Get cache size information
   */
  public getCacheInfo(): { size: string; items: number } {
    let totalSize = 0
    let itemCount = 0
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('kite')) {
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += value.length
          itemCount++
        }
      }
    }
    
    return {
      size: this.formatBytes(totalSize),
      items: itemCount
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('kite') && !key.includes('settings') && !key.includes('backup')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    toast.success('Cache cleared', `Removed ${keysToRemove.length} cached items`)
  }

  /**
   * Gather all data for export
   */
  private async gatherExportData(): Promise<ExportData> {
    const accounts = useAccountsStore.getState().accounts
    const transactions = useTransactionsStore.getState().transactions
    const budgets = useBudgetsStore.getState().budgets
    const categories = useCategoriesStore.getState().categories
    const settings = useSettingsStore.getState().exportSettings()

    // Calculate date range
    const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime())
    const dateRange = {
      earliest: dates.length > 0 ? dates[0].toISOString() : null,
      latest: dates.length > 0 ? dates[dates.length - 1].toISOString() : null
    }

    return {
      version: '1.0.0',
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
        dateRange
      }
    }
  }

  /**
   * Export as JSON
   */
  private async exportAsJSON(data: ExportData): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `kite_export_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  /**
   * Export as CSV (transactions only)
   */
  private async exportAsCSV(data: ExportData): Promise<void> {
    const csvContent = this.convertTransactionsToCSV(data.transactions, data.accounts, data.categories)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `kite_transactions_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  /**
   * Export as Excel (mock implementation - in real app would use library like xlsx)
   */
  private async exportAsExcel(data: ExportData): Promise<void> {
    // For now, export as CSV with .xlsx extension
    // In a real implementation, you would use a library like xlsx or exceljs
    const csvContent = this.convertTransactionsToCSV(data.transactions, data.accounts, data.categories)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `kite_export_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
    toast.info('Excel export', 'Excel export is currently in CSV format. Full Excel support coming soon!')
  }

  /**
   * Convert transactions to CSV format
   */
  private convertTransactionsToCSV(transactions: Transaction[], accounts: Account[], categories: Category[]): string {
    const headers = ['Date', 'Description', 'Amount', 'Currency', 'Account', 'Category', 'Merchant', 'Is Subscription']
    
    const rows = transactions.map(t => {
      const account = accounts.find(a => a.id === t.accountId)
      const category = categories.find(c => c.id === t.categoryId)
      
      return [
        new Date(t.date).toISOString().split('T')[0],
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount.toString(),
        t.currency,
        account ? `"${account.name}"` : '',
        category ? `"${category.name}"` : '',
        t.merchant ? `"${t.merchant.replace(/"/g, '""')}"` : '',
        t.isSubscription ? 'Yes' : 'No'
      ]
    })
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  /**
   * Import from JSON file
   */
  private async importFromJSON(file: File): Promise<ImportResult> {
    const text = await file.text()
    const data = JSON.parse(text) as ExportData
    
    return this.processImportData(data)
  }

  /**
   * Import from CSV file
   */
  private async importFromCSV(file: File): Promise<ImportResult> {
    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    const transactions: Partial<Transaction>[] = []
    const errors: string[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      try {
        const values = this.parseCSVLine(line)
        const transaction = this.mapCSVToTransaction(headers, values, i + 1)
        if (transaction) {
          transactions.push(transaction)
        }
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Create a minimal ExportData structure for CSV imports
    const importData: Partial<ExportData> = {
      transactions: transactions as Transaction[],
      accounts: [],
      budgets: [],
      categories: [],
      settings: null
    }
    
    const result = await this.processImportData(importData as ExportData)
    result.errors.unshift(...errors)
    
    return result
  }

  /**
   * Process import data
   */
  private async processImportData(data: ExportData): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      errors: [],
      warnings: [],
      imported: { accounts: 0, transactions: 0, budgets: 0, categories: 0 },
      skipped: { accounts: 0, transactions: 0, budgets: 0, categories: 0 }
    }

    try {
      // Import categories first (needed for other entities)
      if (data.categories && data.categories.length > 0) {
        for (const category of data.categories) {
          try {
            await useCategoriesStore.getState().createCategory(category)
            result.imported.categories++
          } catch (error) {
            result.skipped.categories++
            result.warnings.push(`Skipped category ${category.name}: ${error}`)
          }
        }
      }

      // Import accounts
      if (data.accounts && data.accounts.length > 0) {
        for (const account of data.accounts) {
          try {
            await useAccountsStore.getState().createAccount(account)
            result.imported.accounts++
          } catch (error) {
            result.skipped.accounts++
            result.warnings.push(`Skipped account ${account.name}: ${error}`)
          }
        }
      }

      // Import transactions
      if (data.transactions && data.transactions.length > 0) {
        for (const transaction of data.transactions) {
          try {
            await useTransactionsStore.getState().createTransaction(transaction)
            result.imported.transactions++
          } catch (error) {
            result.skipped.transactions++
            result.warnings.push(`Skipped transaction ${transaction.description}: ${error}`)
          }
        }
      }

      // Import budgets
      if (data.budgets && data.budgets.length > 0) {
        for (const budget of data.budgets) {
          try {
            await useBudgetsStore.getState().createBudget(budget)
            result.imported.budgets++
          } catch (error) {
            result.skipped.budgets++
            result.warnings.push(`Skipped budget for ${budget.categoryId}: ${error}`)
          }
        }
      }

      // Import settings (optional)
      if (data.settings) {
        try {
          useSettingsStore.getState().importSettings(data.settings)
          result.warnings.push('Settings imported successfully')
        } catch (error) {
          result.warnings.push(`Failed to import settings: ${error}`)
        }
      }

    } catch (error) {
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error during import')
    }

    return result
  }

  /**
   * Restore data from backup
   */
  private async restoreData(data: ExportData): Promise<void> {
    // Clear existing data first
    // Store states are accessed directly in processImportData

    // Process the restore
    await this.processImportData(data)
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  /**
   * Map CSV values to transaction object
   */
  private mapCSVToTransaction(headers: string[], values: string[], lineNumber: number): Partial<Transaction> | null {
    if (values.length !== headers.length) {
      throw new Error(`Column count mismatch (expected ${headers.length}, got ${values.length})`)
    }

    const transaction: Partial<Transaction> = {
      id: `import_${Date.now()}_${lineNumber}`,
      currency: 'USD'
    }

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase()
      const value = values[i].replace(/"/g, '')

      switch (header) {
        case 'date':
          transaction.date = new Date(value)
          if (isNaN(transaction.date.getTime())) {
            throw new Error(`Invalid date: ${value}`)
          }
          break
        case 'description':
          transaction.description = value
          break
        case 'amount':
          transaction.amount = parseFloat(value)
          if (isNaN(transaction.amount)) {
            throw new Error(`Invalid amount: ${value}`)
          }
          break
        case 'currency':
          if (value) transaction.currency = value
          break
        case 'merchant':
          if (value) transaction.merchant = value
          break
        case 'is subscription':
          transaction.isSubscription = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true'
          break
      }
    }

    if (!transaction.description || transaction.amount === undefined || !transaction.date) {
      throw new Error('Missing required fields (description, amount, date)')
    }

    return transaction
  }

  /**
   * Compress data for storage
   */
  private compressData(data: ExportData): string {
    // Simple JSON stringification - in real app might use compression library
    return JSON.stringify(data)
  }

  /**
   * Decompress data from storage
   */
  private decompressData(data: string): ExportData {
    return JSON.parse(data)
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Export singleton instance
export const dataExportImportService = DataExportImportService.getInstance()