# Services API Reference

This document provides comprehensive documentation for all service modules in the Kite application.

## Service Architecture

Services in Kite are implemented as singleton classes that provide business logic and utility functions. They are stateless and focus on data processing, formatting, and business rules.

```typescript
// Service pattern
export class ServiceName {
  // Business logic methods
  async processData(input: InputType): Promise<OutputType> {
    // Implementation
  }
}

// Export singleton instance
export const serviceName = new ServiceName()
```

## Format Service

Handles all data formatting, localization, and display logic.

### Currency Formatting

#### `formatCurrency(amount: number, currency?: string): string`
Formats currency amounts using user settings and locale.

```typescript
import { formatService } from '@/services'

formatService.formatCurrency(1234.56, 'USD') // "$1,234.56"
formatService.formatCurrency(-50.00) // "-$50.00" (uses default currency)
```

#### `formatCurrencyCompact(amount: number, currency?: string): string`
Formats large currency amounts with compact notation.

```typescript
formatService.formatCurrencyCompact(1250000) // "$1.3M"
formatService.formatCurrencyCompact(1500) // "$1,500"
```

#### `formatTransactionAmount(amount: number, currency?: string): { formatted: string; isPositive: boolean; isNegative: boolean }`
Formats transaction amounts with color coding information.

```typescript
const result = formatService.formatTransactionAmount(-50.00)
// {
//   formatted: "-$50.00",
//   isPositive: false,
//   isNegative: true
// }
```

### Date and Time Formatting

#### `formatDate(date: Date | string | undefined, formatString?: string): string`
Formats dates using user preferences.

```typescript
formatService.formatDate(new Date()) // "14/08/2024" (DD/MM/YYYY format)
formatService.formatDate(new Date(), 'yyyy-MM-dd') // "2024-08-14"
```

#### `formatRelativeDate(date: Date | string | undefined): string`
Formats dates with relative time for recent dates.

```typescript
formatService.formatRelativeDate(new Date()) // "Today"
formatService.formatRelativeDate(yesterday) // "Yesterday"
formatService.formatRelativeDate(lastWeek) // "Monday"
formatService.formatRelativeDate(lastMonth) // "15/07/2024"
```

#### `formatTimeAgo(date: Date | string): string`
Formats time distance to now.

```typescript
formatService.formatTimeAgo(new Date(Date.now() - 2 * 60 * 60 * 1000)) // "2 hours ago"
```

#### `formatMonthYear(date: Date | string): string`
Formats month and year for display.

```typescript
formatService.formatMonthYear(new Date()) // "August 2024"
```

#### `formatBudgetMonth(monthString: string | undefined): string`
Formats budget month strings (YYYY-MM format).

```typescript
formatService.formatBudgetMonth('2024-08') // "August 2024"
```

### Number and Text Formatting

#### `formatPercentage(value: number, decimals?: number): string`
Formats numbers as percentages.

```typescript
formatService.formatPercentage(75.5) // "75.5%"
formatService.formatPercentage(75.567, 2) // "75.57%"
```

#### `formatNumber(value: number, minimumFractionDigits?: number): string`
Formats numbers with locale-specific separators.

```typescript
formatService.formatNumber(1234567.89) // "1,234,567.89"
formatService.formatNumber(1234567, 0) // "1,234,567"
```

#### `formatFileSize(bytes: number): string`
Formats file sizes in human-readable format.

```typescript
formatService.formatFileSize(1024) // "1 KB"
formatService.formatFileSize(1048576) // "1 MB"
formatService.formatFileSize(1073741824) // "1 GB"
```

#### `truncateText(text: string, maxLength: number, suffix?: string): string`
Truncates text to specified length.

```typescript
formatService.truncateText('This is a long text', 10) // "This is..."
formatService.truncateText('Short', 10) // "Short"
```

### Domain-Specific Formatting

#### `formatAccountType(type: string): string`
Formats account types for display.

```typescript
formatService.formatAccountType('checking') // "Current Account"
formatService.formatAccountType('savings') // "Savings Account"
formatService.formatAccountType('credit') // "Credit Card"
```

#### `formatCarryStrategy(strategy: string): string`
Formats budget carry-over strategies.

```typescript
formatService.formatCarryStrategy('carryUnspent') // "Carry Unspent"
formatService.formatCarryStrategy('carryOverspend') // "Carry Overspend"
formatService.formatCarryStrategy('carryNone') // "No Carryover"
```

### Fiscal Year Functions

#### `getFiscalYear(date: Date): number`
Gets fiscal year for a given date based on user settings.

```typescript
formatService.getFiscalYear(new Date('2024-03-15')) // 2024 or 2023 depending on fiscal year start
```

#### `formatFiscalYearRange(fiscalYear: number): string`
Formats fiscal year date range.

```typescript
formatService.formatFiscalYearRange(2024) // "01 Jan 2024 - 31 Dec 2024"
```

#### `getWeekStartDay(): number`
Gets week start day from user settings.

```typescript
formatService.getWeekStartDay() // 0 (Sunday) or 1 (Monday)
```

### Validation and Utility

#### `formatValidationErrors(errors: Array<{ field: string; message: string }>): string`
Formats validation errors for display.

```typescript
const errors = [
  { field: 'amount', message: 'Amount is required' },
  { field: 'date', message: 'Date must be valid' }
]
formatService.formatValidationErrors(errors)
// "2 validation errors:\n• Amount is required\n• Date must be valid"
```

#### `formatInitials(name: string): string`
Creates initials from a name.

```typescript
formatService.formatInitials('John Doe') // "JD"
formatService.formatInitials('Jane') // "J"
```

#### `formatPhoneNumber(phoneNumber: string): string`
Formats phone numbers (UK format).

```typescript
formatService.formatPhoneNumber('01234567890') // "0123 456 7890"
```

## Budgeting Service

Handles budget calculations, carryover logic, and spending analysis.

### Budget Ledger Calculations

#### `calculateBudgetLedger(categoryId: string, month: string): Promise<BudgetLedger>`
Calculates detailed budget ledger with carryovers and spending.

```typescript
import { budgetingService } from '@/services'

const ledger = await budgetingService.calculateBudgetLedger('category-food', '2024-01')
console.log(ledger)
// {
//   categoryId: 'category-food',
//   month: '2024-01',
//   entries: [
//     { type: 'budgeted', amount: 500, description: 'Budgeted for January 2024', date: ... },
//     { type: 'carryIn', amount: 50, description: 'Carried over from December 2023', date: ... },
//     { type: 'spent', amount: 25.50, description: 'Grocery store', date: ... },
//     // ... more entries
//   ],
//   totalBudgeted: 500,
//   totalSpent: 450,
//   totalCarriedIn: 50,
//   totalCarriedOut: 0,
//   remaining: 100
// }
```

### Budget Analysis

#### `calculateBudgetProgress(spent: number, budgeted: number): number`
Calculates budget progress as percentage.

```typescript
budgetingService.calculateBudgetProgress(250, 500) // 50
budgetingService.calculateBudgetProgress(600, 500) // 100 (capped at 100%)
```

#### `isBudgetOverspent(spent: number, budgeted: number): boolean`
Checks if budget is overspent.

```typescript
budgetingService.isBudgetOverspent(600, 500) // true
budgetingService.isBudgetOverspent(400, 500) // false
```

#### `getBudgetStatus(spent: number, budgeted: number): 'good' | 'warning' | 'danger'`
Gets budget status for UI indicators.

```typescript
budgetingService.getBudgetStatus(400, 500) // 'good' (80% or less)
budgetingService.getBudgetStatus(450, 500) // 'warning' (80-100%)
budgetingService.getBudgetStatus(550, 500) // 'danger' (over 100%)
```

### Monthly Totals

#### `getTotalBudgetForMonth(month: string): Promise<number>`
Calculates total budgeted amount for a month.

```typescript
const totalBudget = await budgetingService.getTotalBudgetForMonth('2024-01') // 2500.00
```

#### `getTotalSpentForMonth(month: string): Promise<number>`
Calculates total spending for a month across categorized transactions.

```typescript
const totalSpent = await budgetingService.getTotalSpentForMonth('2024-01') // 2100.50
```

## Rules Service

Manages transaction automation rules and categorization logic.

### Rule Processing

#### `applyRules(transaction: Transaction): Promise<Partial<Transaction>>`
Applies matching rules to a transaction and returns modifications.

```typescript
import { rulesService } from '@/services'

const transaction = {
  id: 'tx-1',
  merchant: 'Walmart',
  description: 'WALMART SUPERCENTER',
  amount: -45.67,
  // ... other fields
}

const modifications = await rulesService.applyRules(transaction)
// { categoryId: 'category-groceries', isSubscription: false }
```

#### `findMatchingRules(transaction: Transaction): Promise<Rule[]>`
Finds all rules that match a transaction.

```typescript
const matchingRules = await rulesService.findMatchingRules(transaction)
```

#### `testRuleCondition(condition: RuleCondition, transaction: Transaction): boolean`
Tests if a single rule condition matches a transaction.

```typescript
const condition = {
  field: 'merchant',
  op: 'eq',
  value: 'Walmart'
}

const matches = rulesService.testRuleCondition(condition, transaction) // true
```

### Rule Management

#### `validateRule(rule: Omit<Rule, 'id'>): ValidationError[]`
Validates rule configuration.

```typescript
const errors = rulesService.validateRule({
  name: 'Test Rule',
  enabled: true,
  priority: 1,
  conditions: [
    { field: 'merchant', op: 'eq', value: '' } // Invalid: empty value
  ],
  actions: [],
  stopProcessing: false
})
// [{ field: 'conditions[0].value', message: 'Value cannot be empty' }]
```

#### `optimizeRuleOrder(rules: Rule[]): Rule[]`
Optimizes rule order for better performance.

```typescript
const optimizedRules = rulesService.optimizeRuleOrder(existingRules)
```

## CSV Service

Handles CSV import/export functionality for transactions and other data.

### CSV Import

#### `parseCSV(csvContent: string): Promise<string[][]>`
Parses CSV content into rows and columns.

```typescript
import { csvService } from '@/services'

const csvContent = `Date,Amount,Description
2024-01-15,-25.50,Coffee Shop
2024-01-16,2000.00,Salary`

const rows = await csvService.parseCSV(csvContent)
// [
//   ['Date', 'Amount', 'Description'],
//   ['2024-01-15', '-25.50', 'Coffee Shop'],
//   ['2024-01-16', '2000.00', 'Salary']
// ]
```

#### `detectDelimiter(csvContent: string): string`
Automatically detects CSV delimiter.

```typescript
const delimiter = csvService.detectDelimiter(csvContent) // ',' or ';' or '\t'
```

#### `mapCSVToTransactions(rows: string[][], mapping: CSVMapping): Promise<ImportPreview>`
Maps CSV data to transaction format with validation.

```typescript
const mapping = {
  date: 'Date',
  amount: 'Amount', 
  description: 'Description',
  merchant: 'Merchant',
  account: 'Account'
}

const preview = await csvService.mapCSVToTransactions(rows, mapping)
// {
//   totalRows: 100,
//   validRows: 95,
//   errors: [
//     { row: 15, field: 'amount', message: 'Invalid amount format', value: 'abc' }
//   ],
//   sample: [/* first 5 valid transactions */]
// }
```

#### `importTransactions(preview: ImportPreview): Promise<Transaction[]>`
Imports validated transactions to the database.

```typescript
const importedTransactions = await csvService.importTransactions(preview)
```

### CSV Export

#### `exportTransactionsToCSV(transactions: Transaction[]): string`
Exports transactions to CSV format.

```typescript
const csvContent = csvService.exportTransactionsToCSV(transactions)
```

#### `exportBudgetsToCSV(budgets: Budget[]): string`
Exports budgets to CSV format.

```typescript
const csvContent = csvService.exportBudgetsToCSV(budgets)
```

#### `exportAccountsToCSV(accounts: Account[]): string`
Exports accounts to CSV format.

```typescript
const csvContent = csvService.exportAccountsToCSV(accounts)
```

### Validation and Utilities

#### `validateCSVRow(row: string[], mapping: CSVMapping): ValidationError[]`
Validates a single CSV row against mapping.

```typescript
const errors = csvService.validateCSVRow(
  ['2024-01-15', 'invalid', 'Coffee'], 
  mapping
)
// [{ field: 'amount', message: 'Invalid number format', value: 'invalid' }]
```

#### `sanitizeCSVField(field: string): string`
Sanitizes CSV field content for safe import.

```typescript
const sanitized = csvService.sanitizeCSVField('"quoted,value"') // "quoted,value"
```

## Security Service

Handles data encryption, PIN verification, and security features.

### Authentication

#### `verifyPIN(pin: string): Promise<boolean>`
Verifies user PIN against stored hash.

```typescript
import { securityService } from '@/services'

const isValid = await securityService.verifyPIN('1234')
```

#### `setPIN(pin: string): Promise<void>`
Sets a new PIN with secure hashing.

```typescript
await securityService.setPIN('1234')
```

#### `enableBiometricAuth(): Promise<boolean>`
Enables biometric authentication if available.

```typescript
const enabled = await securityService.enableBiometricAuth()
```

#### `verifyBiometric(): Promise<boolean>`
Verifies biometric authentication.

```typescript
const isValid = await securityService.verifyBiometric()
```

### Data Encryption

#### `encryptData(data: string, password: string): Promise<EncryptedData>`
Encrypts sensitive data.

```typescript
const encrypted = await securityService.encryptData(
  JSON.stringify(sensitiveData),
  userPassword
)
// { iv: '...', data: '...', tag: '...' }
```

#### `decryptData(encryptedData: EncryptedData, password: string): Promise<string>`
Decrypts data.

```typescript
const decrypted = await securityService.decryptData(encrypted, userPassword)
const originalData = JSON.parse(decrypted)
```

### Security Validation

#### `validatePasswordStrength(password: string): { score: number; feedback: string[] }`
Validates password strength.

```typescript
const result = securityService.validatePasswordStrength('weak123')
// {
//   score: 2,
//   feedback: ['Add uppercase letters', 'Add special characters']
// }
```

#### `checkDataIntegrity(): Promise<boolean>`
Checks database integrity.

```typescript
const isIntact = await securityService.checkDataIntegrity()
```

## Notifications Service

Manages alerts, reminders, and notification logic.

### Budget Notifications

#### `checkBudgetAlerts(): Promise<BudgetAlert[]>`
Checks for budget threshold alerts.

```typescript
import { notificationsService } from '@/services'

const alerts = await notificationsService.checkBudgetAlerts()
// [
//   {
//     categoryId: 'category-food',
//     categoryName: 'Food & Dining',
//     budgetAmount: 500,
//     spentAmount: 450,
//     percentage: 90,
//     severity: 'warning'
//   }
// ]
```

#### `sendBudgetAlert(alert: BudgetAlert): Promise<void>`
Sends budget alert notification.

```typescript
await notificationsService.sendBudgetAlert(alert)
```

### Transaction Notifications

#### `checkLargeTransactions(): Promise<Transaction[]>`
Finds transactions above threshold.

```typescript
const largeTransactions = await notificationsService.checkLargeTransactions()
```

#### `sendTransactionAlert(transaction: Transaction): Promise<void>`
Sends large transaction alert.

```typescript
await notificationsService.sendTransactionAlert(transaction)
```

### Subscription Reminders

#### `checkUpcomingSubscriptions(): Promise<Subscription[]>`
Finds subscriptions due soon.

```typescript
const upcoming = await notificationsService.checkUpcomingSubscriptions()
```

#### `sendSubscriptionReminder(subscription: Subscription): Promise<void>`
Sends subscription due reminder.

```typescript
await notificationsService.sendSubscriptionReminder(subscription)
```

### Report Generation

#### `generateWeeklySummary(): Promise<WeeklySummary>`
Generates weekly spending summary.

```typescript
const summary = await notificationsService.generateWeeklySummary()
// {
//   totalSpent: 350.75,
//   totalIncome: 2000.00,
//   topCategories: [
//     { categoryId: 'food', amount: 150.00 },
//     { categoryId: 'transport', amount: 75.50 }
//   ],
//   budgetPerformance: 'good'
// }
```

#### `generateMonthlyReport(): Promise<MonthlyReport>`
Generates comprehensive monthly report.

```typescript
const report = await notificationsService.generateMonthlyReport()
```

### Notification Settings

#### `scheduleNotification(notification: ScheduledNotification): Promise<void>`
Schedules a future notification.

```typescript
await notificationsService.scheduleNotification({
  type: 'subscription_due',
  title: 'Netflix payment due',
  body: '$15.99 will be charged tomorrow',
  scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
  data: { subscriptionId: 'sub-1' }
})
```

#### `cancelNotification(notificationId: string): Promise<void>`
Cancels a scheduled notification.

```typescript
await notificationsService.cancelNotification('notification-1')
```

## Demo Service

Provides demo data generation for testing and onboarding.

### Data Generation

#### `generateDemoData(): Promise<void>`
Generates complete demo dataset.

```typescript
import { demoService } from '@/services'

await demoService.generateDemoData()
```

#### `generateDemoTransactions(count: number): Transaction[]`
Generates realistic demo transactions.

```typescript
const transactions = demoService.generateDemoTransactions(100)
```

#### `generateDemoAccounts(): Account[]`
Generates demo accounts.

```typescript
const accounts = demoService.generateDemoAccounts()
```

#### `generateDemoCategories(): Category[]`
Generates demo category hierarchy.

```typescript
const categories = demoService.generateDemoCategories()
```

#### `generateDemoBudgets(): Budget[]`
Generates demo budgets.

```typescript
const budgets = demoService.generateDemoBudgets()
```

### Cleanup

#### `clearDemoData(): Promise<void>`
Removes all demo data.

```typescript
await demoService.clearDemoData()
```

#### `isDemoDataActive(): Promise<boolean>`
Checks if demo data is currently loaded.

```typescript
const hasDemo = await demoService.isDemoDataActive()
```

## Best Practices

### Service Usage Guidelines

1. **Stateless Design**: Services should not maintain state between calls
2. **Error Handling**: Always throw meaningful errors that stores can handle
3. **Type Safety**: Use TypeScript interfaces for all parameters and return types
4. **Documentation**: Include JSDoc comments for all public methods
5. **Testing**: Write unit tests for business logic

### Performance Considerations

1. **Async Operations**: Use async/await for database operations
2. **Batch Processing**: Prefer bulk operations when possible
3. **Memoization**: Cache expensive calculations
4. **Lazy Loading**: Load data on demand

### Example: Creating a New Service

```typescript
export class MyService {
  /**
   * Process data with validation
   * @param input - Input data to process
   * @returns Processed result
   * @throws Error if validation fails
   */
  async processData(input: InputType): Promise<OutputType> {
    // Validate input
    if (!this.validateInput(input)) {
      throw new Error('Invalid input data')
    }
    
    // Process data
    const result = await this.performProcessing(input)
    
    // Validate output
    if (!this.validateOutput(result)) {
      throw new Error('Processing failed')
    }
    
    return result
  }
  
  private validateInput(input: InputType): boolean {
    // Validation logic
    return true
  }
  
  private async performProcessing(input: InputType): Promise<OutputType> {
    // Processing logic
    return {} as OutputType
  }
  
  private validateOutput(output: OutputType): boolean {
    // Output validation
    return true
  }
}

// Export singleton
export const myService = new MyService()
```

### Error Handling Pattern

```typescript
// In service
async processData(data: unknown): Promise<Result> {
  try {
    // Validate data
    if (!this.isValidData(data)) {
      throw new Error('Invalid data format')
    }
    
    // Process data
    return await this.doProcessing(data)
  } catch (error) {
    // Log error for debugging
    console.error('Processing failed:', error)
    
    // Re-throw with user-friendly message
    throw new Error('Failed to process data. Please try again.')
  }
}

// In store
async processAction(data: unknown) {
  set((state) => {
    state.isLoading = true
    state.error = null
  })
  
  try {
    const result = await myService.processData(data)
    set((state) => {
      state.data = result
      state.isLoading = false
    })
  } catch (error) {
    set((state) => {
      state.error = error instanceof Error ? error.message : 'Unknown error'
      state.isLoading = false
    })
    throw error
  }
}
```