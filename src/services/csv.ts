import { format, parse } from 'date-fns'
import { nanoid } from 'nanoid'
import { accountRepo, transactionRepo, categoryRepo } from '@/db/repositories'
import type { 
  Transaction, 
  Account, 
  Category, 
  CSVMapping, 
  ImportPreview, 
  ImportError 
} from '@/types'

interface CSVRow {
  [key: string]: string
}

export class CSVService {
  private readonly BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
  
  /**
   * Parse CSV content into rows
   */
  parseCSV(content: string): CSVRow[] {
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '')
    
    const lines = cleanContent.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    if (lines.length < 2) return []
    
    const headers = this.parseCSVLine(lines[0])
    const rows: CSVRow[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length === headers.length) {
        const row: CSVRow = {}
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || ''
        })
        rows.push(row)
      }
    }
    
    return rows
  }
  
  /**
   * Parse a single CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // Field delimiter
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  }
  
  /**
   * Infer column mapping from CSV headers
   */
  inferColumnMapping(headers: string[]): Partial<CSVMapping> {
    const mapping: Partial<CSVMapping> = {}
    const lowerHeaders = headers.map(h => h.toLowerCase())
    
    // Date field mapping
    const datePatterns = ['date', 'transaction date', 'posted date', 'created', 'timestamp']
    const dateHeader = lowerHeaders.find(h => 
      datePatterns.some(pattern => h.includes(pattern))
    )
    if (dateHeader) {
      mapping.date = headers[lowerHeaders.indexOf(dateHeader)]
    }
    
    // Amount field mapping
    const amountPatterns = ['amount', 'value', 'total', 'sum', 'debit', 'credit']
    const amountHeader = lowerHeaders.find(h => 
      amountPatterns.some(pattern => h.includes(pattern))
    )
    if (amountHeader) {
      mapping.amount = headers[lowerHeaders.indexOf(amountHeader)]
    }
    
    // Description field mapping
    const descriptionPatterns = ['description', 'memo', 'details', 'narrative', 'reference']
    const descriptionHeader = lowerHeaders.find(h => 
      descriptionPatterns.some(pattern => h.includes(pattern))
    )
    if (descriptionHeader) {
      mapping.description = headers[lowerHeaders.indexOf(descriptionHeader)]
    }
    
    // Merchant field mapping
    const merchantPatterns = ['merchant', 'payee', 'vendor', 'company', 'name']
    const merchantHeader = lowerHeaders.find(h => 
      merchantPatterns.some(pattern => h.includes(pattern))
    )
    if (merchantHeader) {
      mapping.merchant = headers[lowerHeaders.indexOf(merchantHeader)]
    }
    
    // Category field mapping
    const categoryPatterns = ['category', 'type', 'classification', 'group']
    const categoryHeader = lowerHeaders.find(h => 
      categoryPatterns.some(pattern => h.includes(pattern))
    )
    if (categoryHeader) {
      mapping.category = headers[lowerHeaders.indexOf(categoryHeader)]
    }
    
    // Account field mapping
    const accountPatterns = ['account', 'bank', 'source']
    const accountHeader = lowerHeaders.find(h => 
      accountPatterns.some(pattern => h.includes(pattern))
    )
    if (accountHeader) {
      mapping.account = headers[lowerHeaders.indexOf(accountHeader)]
    }
    
    return mapping
  }
  
  /**
   * Preview CSV import
   */
  async previewImport(rows: CSVRow[], mapping: CSVMapping): Promise<ImportPreview> {
    const errors: ImportError[] = []
    const sample: Transaction[] = []
    let validRows = 0
    
    const accounts = await accountRepo.getAll()
    const categories = await categoryRepo.getAll()
    
    for (let i = 0; i < Math.min(rows.length, 100); i++) { // Preview first 100 rows
      const row = rows[i]
      const rowNumber = i + 2 // Account for header row
      
      try {
        const transaction = await this.mapRowToTransaction(row, mapping, accounts, categories)
        
        // Validate transaction
        const validationErrors = this.validateTransaction(transaction, rowNumber)
        if (validationErrors.length === 0) {
          sample.push(transaction)
          validRows++
        } else {
          errors.push(...validationErrors)
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error',
          value: row
        })
      }
    }
    
    return {
      totalRows: rows.length,
      validRows,
      errors: errors.slice(0, 50), // Limit errors shown
      sample: sample.slice(0, 10) // Show first 10 valid transactions
    }
  }
  
  /**
   * Import transactions from CSV
   */
  async importTransactions(
    rows: CSVRow[], 
    mapping: CSVMapping, 
    options: { deduplication?: boolean; dryRun?: boolean } = {}
  ): Promise<{ imported: number; skipped: number; errors: ImportError[] }> {
    const { deduplication = true, dryRun = false } = options
    const errors: ImportError[] = []
    const transactions: Transaction[] = []
    
    const accounts = await accountRepo.getAll()
    const categories = await categoryRepo.getAll()
    const existingTransactions = deduplication ? await transactionRepo.getAll() : []
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2
      
      try {
        const transaction = await this.mapRowToTransaction(row, mapping, accounts, categories)
        
        // Validate transaction
        const validationErrors = this.validateTransaction(transaction, rowNumber)
        if (validationErrors.length > 0) {
          errors.push(...validationErrors)
          continue
        }
        
        // Check for duplicates
        if (deduplication && this.isDuplicateTransaction(transaction, existingTransactions)) {
          continue // Skip duplicate
        }
        
        transactions.push(transaction)
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error',
          value: row
        })
      }
    }
    
    let imported = 0
    if (!dryRun) {
      // Import transactions
      for (const transaction of transactions) {
        try {
          await transactionRepo.create(transaction)
          imported++
        } catch (error) {
          errors.push({
            row: 0,
            field: 'database',
            message: error instanceof Error ? error.message : 'Failed to save transaction',
            value: transaction
          })
        }
      }
    } else {
      imported = transactions.length
    }
    
    return {
      imported,
      skipped: rows.length - transactions.length - errors.length,
      errors
    }
  }
  
  /**
   * Map CSV row to transaction
   */
  private async mapRowToTransaction(
    row: CSVRow, 
    mapping: CSVMapping, 
    accounts: Account[], 
    categories: Category[]
  ): Promise<Transaction> {
    // Parse date
    const dateStr = row[mapping.date]
    if (!dateStr) throw new Error('Date is required')
    
    const date = this.parseDate(dateStr)
    if (!date) throw new Error(`Invalid date format: ${dateStr}`)
    
    // Parse amount
    const amountStr = row[mapping.amount]
    if (!amountStr) throw new Error('Amount is required')
    
    const amount = this.parseAmount(amountStr)
    if (isNaN(amount)) throw new Error(`Invalid amount: ${amountStr}`)
    
    // Get description
    const description = row[mapping.description] || 'Imported transaction'
    
    // Get merchant (optional)
    const merchant = mapping.merchant ? row[mapping.merchant] : undefined
    
    // Find account
    let accountId = accounts[0]?.id // Default to first account
    if (mapping.account && row[mapping.account]) {
      const accountName = row[mapping.account]
      const account = accounts.find(a => 
        a.name.toLowerCase() === accountName.toLowerCase()
      )
      if (account) {
        accountId = account.id
      }
    }
    
    // Find category
    let categoryId: string | undefined
    if (mapping.category && row[mapping.category]) {
      const categoryName = row[mapping.category]
      const category = categories.find(c => 
        c.name.toLowerCase() === categoryName.toLowerCase()
      )
      categoryId = category?.id
    }
    
    return {
      id: nanoid(),
      accountId,
      date,
      amount,
      currency: 'GBP', // Default currency
      description,
      merchant,
      categoryId
    }
  }
  
  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): Date | null {
    const formats = [
      'dd/MM/yyyy',
      'MM/dd/yyyy', 
      'yyyy-MM-dd',
      'dd-MM-yyyy',
      'MM-dd-yyyy',
      'dd/MM/yy',
      'MM/dd/yy'
    ]
    
    for (const formatStr of formats) {
      try {
        const date = parse(dateStr, formatStr, new Date())
        if (!isNaN(date.getTime())) {
          return date
        }
      } catch {
        // Try next format
      }
    }
    
    // Try native Date parsing as last resort
    const nativeDate = new Date(dateStr)
    return isNaN(nativeDate.getTime()) ? null : nativeDate
  }
  
  /**
   * Parse amount handling various formats
   */
  private parseAmount(amountStr: string): number {
    // Remove currency symbols and spaces
    let cleaned = amountStr.replace(/[£$€¥₹,\s]/g, '')
    
    // Handle parentheses for negative amounts
    const isNegative = cleaned.includes('(') && cleaned.includes(')')
    cleaned = cleaned.replace(/[()]/g, '')
    
    // Handle different decimal separators
    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')
    
    if (lastDot > lastComma) {
      // Dot is decimal separator
      cleaned = cleaned.replace(/,/g, '').replace(/\./g, '.')
    } else if (lastComma > lastDot) {
      // Comma is decimal separator
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.')
    }
    
    const amount = parseFloat(cleaned)
    return isNegative ? -Math.abs(amount) : amount
  }
  
  /**
   * Validate transaction
   */
  private validateTransaction(transaction: Transaction, rowNumber: number): ImportError[] {
    const errors: ImportError[] = []
    
    if (!transaction.accountId) {
      errors.push({
        row: rowNumber,
        field: 'account',
        message: 'Account is required',
        value: transaction.accountId
      })
    }
    
    if (isNaN(transaction.date.getTime())) {
      errors.push({
        row: rowNumber,
        field: 'date',
        message: 'Valid date is required',
        value: transaction.date
      })
    }
    
    if (isNaN(transaction.amount) || transaction.amount === 0) {
      errors.push({
        row: rowNumber,
        field: 'amount',
        message: 'Valid non-zero amount is required',
        value: transaction.amount
      })
    }
    
    if (!transaction.description || transaction.description.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'description',
        message: 'Description is required',
        value: transaction.description
      })
    }
    
    return errors
  }
  
  /**
   * Check if transaction is duplicate
   */
  private isDuplicateTransaction(transaction: Transaction, existing: Transaction[]): boolean {
    return existing.some(t => 
      t.accountId === transaction.accountId &&
      Math.abs(t.date.getTime() - transaction.date.getTime()) < 24 * 60 * 60 * 1000 && // Same day
      Math.abs(t.amount - transaction.amount) < 0.01 && // Same amount (within penny)
      t.description.toLowerCase() === transaction.description.toLowerCase()
    )
  }
  
  /**
   * Export transactions to CSV
   */
  async exportTransactions(transactions: Transaction[]): Promise<string> {
    const accounts = await accountRepo.getAll()
    const categories = await categoryRepo.getAll()
    
    const headers = [
      'Date',
      'Account',
      'Amount',
      'Currency',
      'Description',
      'Merchant',
      'Category',
      'Is Subscription'
    ]
    
    const rows = transactions.map(t => {
      const account = accounts.find(a => a.id === t.accountId)
      const category = categories.find(c => c.id === t.categoryId)
      
      return [
        format(t.date, 'dd/MM/yyyy'),
        account?.name || '',
        t.amount.toFixed(2),
        t.currency,
        t.description,
        t.merchant || '',
        category?.name || '',
        t.isSubscription ? 'Yes' : 'No'
      ]
    })
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => this.escapeCSVField(field)).join(','))
      .join('\n')
    
    return this.BOM + csvContent
  }
  
  /**
   * Export accounts to CSV
   */
  async exportAccounts(): Promise<string> {
    const accounts = await accountRepo.getAll()
    
    const headers = ['Name', 'Type', 'Currency', 'Balance', 'Created Date', 'Status']
    
    const rows = accounts.map(a => [
      a.name,
      a.type,
      a.currency,
      a.balance.toFixed(2),
      format(a.createdAt, 'dd/MM/yyyy'),
      a.archivedAt ? 'Archived' : 'Active'
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => this.escapeCSVField(field)).join(','))
      .join('\n')
    
    return this.BOM + csvContent
  }
  
  /**
   * Escape CSV field for proper formatting
   */
  private escapeCSVField(field: string | number): string {
    const str = String(field)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  
  /**
   * Download CSV file
   */
  downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}

// Export singleton instance
export const csvService = new CSVService()