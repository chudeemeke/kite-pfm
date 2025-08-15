# Feature Components Documentation

This document provides detailed documentation for feature-specific components that handle complex business logic and specialized functionality in the Kite Personal Finance Manager.

## Table of Contents

1. [BackupManager](#backupmanager)
2. [DataImport](#dataimport)
3. [CategoriesManager](#categoriesmanager)
4. [RulesManager](#rulesmanager)
5. [OnboardingFlow](#onboardingflow)
6. [ProfileEditor](#profileeditor)

---

## BackupManager

Advanced backup and restore functionality for user data with automated backup strategies.

**File**: `src/components/BackupManager.tsx`

### Props

```typescript
interface BackupManagerProps {
  onClose?: () => void
}
```

### Features

- **Manual Backups**: Create instant backups with custom names
- **Automatic Backups**: Scheduled backup creation (daily, weekly, monthly)
- **Backup Restoration**: Restore data from previous backups
- **Backup Validation**: Verify backup integrity before restoration
- **Backup Compression**: Efficient storage with data compression
- **Backup Encryption**: Optional encryption for sensitive data
- **Storage Management**: Monitor and manage backup storage usage

### Data Structures

```typescript
interface Backup {
  id: string
  name: string
  createdAt: Date
  size: number
  type: 'manual' | 'automatic'
  data: {
    accounts: number
    transactions: number
    categories: number
    budgets: number
  }
  checksum?: string
  encrypted?: boolean
}

interface BackupMetadata {
  version: string
  appVersion: string
  createdAt: Date
  dataCount: {
    accounts: number
    transactions: number
    categories: number
    budgets: number
    rules: number
  }
  integrity: {
    checksum: string
    validated: boolean
  }
}
```

### State Management

```typescript
const [backups, setBackups] = useState<Backup[]>([])
const [isLoading, setIsLoading] = useState(true)
const [isCreating, setIsCreating] = useState(false)
const [isRestoring, setIsRestoring] = useState(false)
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null)
const [backupSettings, setBackupSettings] = useState({
  autoBackup: true,
  frequency: 'weekly',
  maxBackups: 10,
  compression: true,
  encryption: false
})
```

### Core Functionality

#### Creating Backups

```typescript
const createBackup = async (name: string, type: 'manual' | 'automatic' = 'manual') => {
  setIsCreating(true)
  try {
    // Gather all application data
    const backupData = {
      accounts: useAccountsStore.getState().accounts,
      transactions: useTransactionsStore.getState().transactions,
      budgets: useBudgetsStore.getState().budgets,
      categories: useCategoriesStore.getState().categories,
      rules: useRulesStore.getState().rules,
      settings: useSettingsStore.getState()
    }

    // Calculate data size and checksum
    const jsonString = JSON.stringify(backupData)
    const size = new Blob([jsonString]).size
    const checksum = await calculateChecksum(jsonString)

    // Create backup metadata
    const backup: Backup = {
      id: generateId(),
      name: name || `Backup ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      createdAt: new Date(),
      size,
      type,
      data: {
        accounts: backupData.accounts.length,
        transactions: backupData.transactions.length,
        categories: backupData.categories.length,
        budgets: backupData.budgets.length
      },
      checksum
    }

    // Store backup (IndexedDB or local storage)
    await storeBackup(backup, backupData)
    
    // Update backup list
    await loadBackups()
    
    toast.success('Backup created', `${name} saved successfully`)
  } catch (error) {
    toast.error('Backup failed', 'Unable to create backup. Please try again.')
  } finally {
    setIsCreating(false)
  }
}
```

#### Restoring Backups

```typescript
const restoreBackup = async (backupId: string) => {
  setIsRestoring(true)
  try {
    // Load backup data
    const backupData = await loadBackupData(backupId)
    
    // Validate backup integrity
    const isValid = await validateBackup(backupData)
    if (!isValid) {
      throw new Error('Backup validation failed')
    }

    // Confirm restoration (destructive operation)
    const confirmed = await confirmRestore()
    if (!confirmed) return

    // Clear current data
    await clearAllStores()

    // Restore data to stores
    if (backupData.accounts) {
      await useAccountsStore.getState().bulkCreate(backupData.accounts)
    }
    if (backupData.transactions) {
      await useTransactionsStore.getState().bulkCreate(backupData.transactions)
    }
    if (backupData.budgets) {
      await useBudgetsStore.getState().bulkCreate(backupData.budgets)
    }
    if (backupData.categories) {
      await useCategoriesStore.getState().bulkCreate(backupData.categories)
    }
    if (backupData.rules) {
      await useRulesStore.getState().bulkCreate(backupData.rules)
    }
    if (backupData.settings) {
      await useSettingsStore.getState().restore(backupData.settings)
    }

    // Refresh all data
    await refreshAllStores()
    
    toast.success('Backup restored', 'Your data has been successfully restored')
    onClose?.()
  } catch (error) {
    toast.error('Restore failed', 'Unable to restore backup. Please try again.')
  } finally {
    setIsRestoring(false)
  }
}
```

#### Automatic Backup System

```typescript
const setupAutomaticBackups = () => {
  const { autoBackup, frequency } = backupSettings
  
  if (!autoBackup) return

  const intervalMap = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000
  }

  const interval = intervalMap[frequency]
  
  setInterval(async () => {
    try {
      await createBackup(
        `Auto Backup ${format(new Date(), 'yyyy-MM-dd')}`,
        'automatic'
      )
      
      // Clean up old automatic backups
      await cleanupOldBackups()
    } catch (error) {
      console.error('Automatic backup failed:', error)
    }
  }, interval)
}

const cleanupOldBackups = async () => {
  const automaticBackups = backups
    .filter(b => b.type === 'automatic')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (automaticBackups.length > backupSettings.maxBackups) {
    const toDelete = automaticBackups.slice(backupSettings.maxBackups)
    for (const backup of toDelete) {
      await deleteBackup(backup.id)
    }
  }
}
```

### UI Components

#### Backup List

```typescript
const BackupList = ({ backups, onRestore, onDelete }: BackupListProps) => (
  <div className="space-y-3">
    {backups.map(backup => (
      <div key={backup.id} className="card p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {backup.name}
              </h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                backup.type === 'automatic' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              }`}>
                {backup.type}
              </span>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <div>Created {formatRelativeDate(backup.createdAt)}</div>
              <div>Size: {formatFileSize(backup.size)}</div>
              <div className="flex gap-4">
                <span>{backup.data.accounts} accounts</span>
                <span>{backup.data.transactions} transactions</span>
                <span>{backup.data.budgets} budgets</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onRestore(backup.id)}
              className="btn-secondary text-sm"
            >
              Restore
            </button>
            <button
              onClick={() => onDelete(backup.id)}
              className="btn-danger text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
)
```

### Integration Points

```typescript
// Backup triggers from other components
const triggerBackup = async (reason: string) => {
  if (backupSettings.autoBackup) {
    await createBackup(`Before ${reason}`, 'automatic')
  }
}

// Called before major operations
await triggerBackup('data import')
await triggerBackup('bulk delete')
await triggerBackup('settings reset')
```

---

## DataImport

Multi-step data import wizard supporting CSV and JSON formats with intelligent field mapping.

**File**: `src/components/DataImport.tsx`

### Props

```typescript
interface DataImportProps {
  onClose?: () => void
}
```

### Features

- **Multiple Formats**: Support for CSV, JSON, and OFX files
- **Intelligent Mapping**: Automatic field detection and mapping
- **Data Validation**: Real-time validation with error reporting
- **Preview Mode**: Review data before import
- **Duplicate Detection**: Identify and handle duplicate transactions
- **Progress Tracking**: Visual progress during import
- **Error Recovery**: Handle and report import errors gracefully

### Import Process Steps

```typescript
type ImportStep = 'upload' | 'mapping' | 'preview' | 'import' | 'complete'

const [step, setStep] = useState<ImportStep>('upload')
```

### Data Structures

```typescript
interface CSVMapping {
  date: string
  amount: string
  description: string
  merchant?: string
  category?: string
  account?: string
}

interface ImportPreview {
  totalRows: number
  validRows: number
  errors: ImportError[]
  sample: Transaction[]
  duplicates: DuplicateMatch[]
}

interface ImportError {
  row: number
  field: string
  message: string
  value: unknown
}

interface DuplicateMatch {
  importRow: number
  existingTransaction: Transaction
  confidence: number
  suggestions: string[]
}
```

### Step 1: File Upload

```typescript
const handleFileSelect = async (selectedFile: File) => {
  setFile(selectedFile)
  setIsLoading(true)
  
  try {
    const fileType = detectFileType(selectedFile)
    let data: any[]

    switch (fileType) {
      case 'csv':
        const content = await selectedFile.text()
        data = csvService.parseCSV(content)
        break
      case 'json':
        const jsonContent = await selectedFile.text()
        data = JSON.parse(jsonContent)
        break
      case 'ofx':
        const ofxContent = await selectedFile.text()
        data = ofxService.parseOFX(ofxContent)
        break
      default:
        throw new Error('Unsupported file format')
    }
    
    if (data.length === 0) {
      toast.error('Invalid file', 'The file appears to be empty or invalid')
      return
    }
    
    // Extract headers and prepare for mapping
    const fileHeaders = Object.keys(data[0])
    setHeaders(fileHeaders)
    setCsvData(data)
    
    // Auto-infer column mapping
    const inferredMapping = inferColumnMapping(fileHeaders)
    setMapping(inferredMapping)
    
    setStep('mapping')
    toast.success('File uploaded', `Loaded ${data.length} rows from ${selectedFile.name}`)
  } catch (error) {
    toast.error('Failed to read file', 'Please check the file format and try again')
  } finally {
    setIsLoading(false)
  }
}

const detectFileType = (file: File): 'csv' | 'json' | 'ofx' => {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'csv': return 'csv'
    case 'json': return 'json'
    case 'ofx':
    case 'qfx': return 'ofx'
    default: return 'csv' // Default to CSV
  }
}
```

### Step 2: Field Mapping

```typescript
const inferColumnMapping = (headers: string[]): CSVMapping => {
  const mapping: CSVMapping = {
    date: '',
    amount: '',
    description: '',
    merchant: '',
    category: '',
    account: ''
  }

  // Common patterns for field detection
  const patterns = {
    date: ['date', 'transaction date', 'posting date', 'created', 'timestamp'],
    amount: ['amount', 'value', 'total', 'sum', 'transaction amount'],
    description: ['description', 'memo', 'details', 'narrative', 'reference'],
    merchant: ['merchant', 'payee', 'vendor', 'company', 'counterparty'],
    category: ['category', 'type', 'classification', 'tag'],
    account: ['account', 'account name', 'account number', 'source']
  }

  // Match headers to patterns
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim()
    
    Object.entries(patterns).forEach(([field, fieldPatterns]) => {
      if (fieldPatterns.some(pattern => normalizedHeader.includes(pattern))) {
        mapping[field as keyof CSVMapping] = header
      }
    })
  })

  return mapping
}

const MappingInterface = ({ headers, mapping, onChange }: MappingProps) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Map Your Columns</h3>
    <p className="text-gray-600 dark:text-gray-400">
      Tell us which columns contain which data. Required fields are marked with *.
    </p>
    
    <div className="grid gap-4">
      {Object.entries(fieldDefinitions).map(([field, definition]) => (
        <div key={field} className="flex items-center gap-4">
          <label className="w-32 text-sm font-medium">
            {definition.label}
            {definition.required && <span className="text-red-500">*</span>}
          </label>
          
          <select
            value={mapping[field as keyof CSVMapping] || ''}
            onChange={(e) => onChange(field as keyof CSVMapping, e.target.value)}
            className="flex-1 input"
            required={definition.required}
          >
            <option value="">Select column...</option>
            {headers.map(header => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
          
          <div className="text-xs text-gray-500 w-48">
            {definition.description}
          </div>
        </div>
      ))}
    </div>
  </div>
)

const fieldDefinitions = {
  date: {
    label: 'Date',
    description: 'Transaction date',
    required: true,
    validate: (value: string) => !isNaN(Date.parse(value))
  },
  amount: {
    label: 'Amount',
    description: 'Transaction amount (+ for income, - for expense)',
    required: true,
    validate: (value: string) => !isNaN(parseFloat(value))
  },
  description: {
    label: 'Description',
    description: 'Transaction description or memo',
    required: true,
    validate: (value: string) => value.trim().length > 0
  },
  merchant: {
    label: 'Merchant',
    description: 'Store or business name (optional)',
    required: false,
    validate: () => true
  },
  category: {
    label: 'Category',
    description: 'Transaction category (optional)',
    required: false,
    validate: () => true
  },
  account: {
    label: 'Account',
    description: 'Source account (optional)',
    required: false,
    validate: () => true
  }
}
```

### Step 3: Data Preview and Validation

```typescript
const generatePreview = async (): Promise<ImportPreview> => {
  const errors: ImportError[] = []
  const validTransactions: Transaction[] = []
  const duplicates: DuplicateMatch[] = []
  
  csvData.forEach((row, index) => {
    try {
      // Map row data to transaction fields
      const transaction = mapRowToTransaction(row, mapping)
      
      // Validate transaction data
      const validationErrors = validateTransaction(transaction, index)
      errors.push(...validationErrors)
      
      if (validationErrors.length === 0) {
        validTransactions.push(transaction)
        
        // Check for duplicates
        const duplicate = findDuplicateTransaction(transaction)
        if (duplicate) {
          duplicates.push({
            importRow: index,
            existingTransaction: duplicate.transaction,
            confidence: duplicate.confidence,
            suggestions: duplicate.suggestions
          })
        }
      }
    } catch (error) {
      errors.push({
        row: index + 1,
        field: 'general',
        message: 'Failed to process row',
        value: row
      })
    }
  })
  
  return {
    totalRows: csvData.length,
    validRows: validTransactions.length,
    errors,
    sample: validTransactions.slice(0, 5), // Show first 5 for preview
    duplicates
  }
}

const mapRowToTransaction = (row: any, mapping: CSVMapping): Transaction => {
  return {
    id: generateId(),
    accountId: mapping.account ? mapAccountName(row[mapping.account]) : '',
    date: new Date(row[mapping.date]),
    amount: parseFloat(row[mapping.amount]),
    currency: 'GBP', // Default currency
    description: row[mapping.description]?.trim() || '',
    merchant: mapping.merchant ? row[mapping.merchant]?.trim() : undefined,
    categoryId: mapping.category ? mapCategoryName(row[mapping.category]) : undefined,
    metadata: {
      importedAt: new Date(),
      originalRow: row
    }
  }
}

const validateTransaction = (transaction: Transaction, rowIndex: number): ImportError[] => {
  const errors: ImportError[] = []
  
  // Validate required fields
  if (!transaction.date || isNaN(transaction.date.getTime())) {
    errors.push({
      row: rowIndex + 1,
      field: 'date',
      message: 'Invalid or missing date',
      value: transaction.date
    })
  }
  
  if (isNaN(transaction.amount)) {
    errors.push({
      row: rowIndex + 1,
      field: 'amount',
      message: 'Invalid or missing amount',
      value: transaction.amount
    })
  }
  
  if (!transaction.description || transaction.description.trim().length === 0) {
    errors.push({
      row: rowIndex + 1,
      field: 'description',
      message: 'Description is required',
      value: transaction.description
    })
  }
  
  // Validate data ranges
  if (transaction.date && transaction.date > new Date()) {
    errors.push({
      row: rowIndex + 1,
      field: 'date',
      message: 'Date cannot be in the future',
      value: transaction.date
    })
  }
  
  if (Math.abs(transaction.amount) > 1000000) {
    errors.push({
      row: rowIndex + 1,
      field: 'amount',
      message: 'Amount seems unusually large',
      value: transaction.amount
    })
  }
  
  return errors
}
```

### Step 4: Duplicate Detection

```typescript
const findDuplicateTransaction = (newTransaction: Transaction) => {
  const existingTransactions = useTransactionsStore.getState().transactions
  
  for (const existing of existingTransactions) {
    const similarity = calculateSimilarity(newTransaction, existing)
    
    if (similarity.confidence > 0.8) { // 80% confidence threshold
      return {
        transaction: existing,
        confidence: similarity.confidence,
        suggestions: similarity.suggestions
      }
    }
  }
  
  return null
}

const calculateSimilarity = (t1: Transaction, t2: Transaction) => {
  let score = 0
  const suggestions: string[] = []
  
  // Date similarity (within 3 days)
  const dateDiff = Math.abs(t1.date.getTime() - t2.date.getTime())
  const daysDiff = dateDiff / (1000 * 60 * 60 * 24)
  if (daysDiff <= 3) {
    score += 0.3
    if (daysDiff === 0) score += 0.2
  }
  
  // Amount similarity (exact match)
  if (Math.abs(t1.amount - t2.amount) < 0.01) {
    score += 0.4
    suggestions.push('Exact amount match')
  }
  
  // Description similarity
  const descSimilarity = stringSimilarity(t1.description, t2.description)
  score += descSimilarity * 0.3
  if (descSimilarity > 0.7) {
    suggestions.push('Similar description')
  }
  
  return {
    confidence: score,
    suggestions
  }
}
```

### Step 5: Import Execution

```typescript
const executeImport = async () => {
  setIsLoading(true)
  const progress = { completed: 0, total: validTransactions.length }
  
  try {
    // Process transactions in batches for better performance
    const batchSize = 50
    const batches = chunkArray(validTransactions, batchSize)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      // Import batch
      await useTransactionsStore.getState().bulkCreate(batch)
      
      // Update progress
      progress.completed += batch.length
      setImportProgress(progress)
      
      // Small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    // Apply rules to imported transactions
    await applyRulesToImportedTransactions(validTransactions)
    
    // Update related data
    await refreshRelatedData()
    
    setStep('complete')
    toast.success('Import completed', `Successfully imported ${validTransactions.length} transactions`)
  } catch (error) {
    toast.error('Import failed', 'An error occurred during import. Please try again.')
  } finally {
    setIsLoading(false)
  }
}

const applyRulesToImportedTransactions = async (transactions: Transaction[]) => {
  const rules = useRulesStore.getState().rules
  const activeRules = rules.filter(r => r.enabled).sort((a, b) => a.priority - b.priority)
  
  for (const transaction of transactions) {
    for (const rule of activeRules) {
      if (evaluateRuleConditions(rule.conditions, transaction)) {
        await applyRuleActions(rule.actions, transaction)
        
        if (rule.stopProcessing) break
      }
    }
  }
}
```

### CSV Service Integration

```typescript
// services/csv.ts
export const csvService = {
  parseCSV: (content: string): any[] => {
    // Implementation for CSV parsing
    const lines = content.split('\n')
    const headers = lines[0].split(',')
    
    return lines.slice(1).map(line => {
      const values = line.split(',')
      return headers.reduce((obj, header, index) => {
        obj[header.trim()] = values[index]?.trim() || ''
        return obj
      }, {} as any)
    })
  },
  
  inferColumnMapping: (headers: string[]): Partial<CSVMapping> => {
    // Intelligent field mapping logic
    return inferColumnMapping(headers)
  },
  
  validateData: (data: any[], mapping: CSVMapping): ImportPreview => {
    // Data validation logic
    return generatePreview()
  }
}
```

---

## CategoriesManager

Hierarchical category management system with drag-and-drop organization.

**File**: `src/components/CategoriesManager.tsx`

### Props

```typescript
interface CategoriesManagerProps {
  onClose?: () => void
}
```

### Features

- **Hierarchical Structure**: Parent/child category relationships
- **Drag & Drop**: Reorder categories and create hierarchies
- **Color Coding**: Visual category identification
- **Icon Selection**: Custom icons for categories
- **Usage Statistics**: Show transaction counts per category
- **Bulk Operations**: Multi-select for batch actions
- **Category Merging**: Combine categories with transaction migration

### Data Structures

```typescript
interface Category {
  id: string
  name: string
  icon: string
  color: string
  parentId?: string
  order?: number
  metadata?: {
    transactionCount: number
    lastUsed: Date
    isSystemCategory: boolean
  }
}

interface CategoryNode extends Category {
  children: CategoryNode[]
  depth: number
  isExpanded: boolean
}
```

### State Management

```typescript
const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
const [editingCategory, setEditingCategory] = useState<Category | null>(null)
const [showAddCategory, setShowAddCategory] = useState(false)
const [parentForNew, setParentForNew] = useState<string | null>(null)
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
const [draggedCategory, setDraggedCategory] = useState<string | null>(null)
const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
```

### Hierarchical Display

```typescript
const buildCategoryTree = (categories: Category[]): CategoryNode[] => {
  const categoryMap = new Map<string, CategoryNode>()
  const rootCategories: CategoryNode[] = []
  
  // Create nodes for all categories
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category,
      children: [],
      depth: 0,
      isExpanded: expandedCategories.has(category.id)
    })
  })
  
  // Build hierarchy
  categories.forEach(category => {
    const node = categoryMap.get(category.id)!
    
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId)
      if (parent) {
        parent.children.push(node)
        node.depth = parent.depth + 1
      }
    } else {
      rootCategories.push(node)
    }
  })
  
  // Sort by order and name
  const sortCategories = (categories: CategoryNode[]) => {
    categories.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      return a.name.localeCompare(b.name)
    })
    
    categories.forEach(category => {
      sortCategories(category.children)
    })
  }
  
  sortCategories(rootCategories)
  return rootCategories
}

const CategoryTreeItem = ({ category, onEdit, onDelete, onAddChild }: CategoryTreeItemProps) => {
  const hasChildren = category.children.length > 0
  const indentWidth = category.depth * 20
  
  return (
    <div>
      <div 
        className={`flex items-center gap-3 p-3 border-l-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
          selectedCategories.has(category.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
        }`}
        style={{ 
          paddingLeft: `${12 + indentWidth}px`,
          borderLeftColor: category.color
        }}
        draggable
        onDragStart={() => setDraggedCategory(category.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(category.id)}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={() => toggleExpanded(category.id)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {category.isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        
        {/* Category Icon */}
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
          style={{ backgroundColor: category.color }}
        >
          {category.icon}
        </div>
        
        {/* Category Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {category.name}
            </span>
            {category.metadata?.isSystemCategory && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                System
              </span>
            )}
          </div>
          
          {category.metadata && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {category.metadata.transactionCount} transactions
              {category.metadata.lastUsed && (
                <span> • Last used {formatRelativeDate(category.metadata.lastUsed)}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddChild(category.id)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Add subcategory"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Edit category"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          {!category.metadata?.isSystemCategory && (
            <button
              onClick={() => onDelete(category.id)}
              className="p-2 text-gray-400 hover:text-red-500"
              title="Delete category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Children */}
      {category.isExpanded && hasChildren && (
        <div>
          {category.children.map(child => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

### Drag and Drop Functionality

```typescript
const handleDrop = async (targetCategoryId: string) => {
  if (!draggedCategory || draggedCategory === targetCategoryId) return
  
  try {
    // Move dragged category to be a child of target
    await updateCategory(draggedCategory, { parentId: targetCategoryId })
    
    // Update hierarchy
    await fetchCategories()
    
    toast.success('Category moved', 'Category hierarchy updated')
  } catch (error) {
    toast.error('Failed to move category', 'Please try again')
  } finally {
    setDraggedCategory(null)
  }
}

const handleReorder = async (categoryId: string, newOrder: number) => {
  try {
    await updateCategory(categoryId, { order: newOrder })
    await fetchCategories()
  } catch (error) {
    toast.error('Failed to reorder categories')
  }
}
```

### Category Form

```typescript
const CategoryForm = ({ category, parentId, onSave, onCancel }: CategoryFormProps) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    icon: category?.icon || '📁',
    color: category?.color || '#6b7280',
    parentId: parentId || category?.parentId || ''
  })
  
  const [errors, setErrors] = useState<ValidationError[]>([])
  
  const validate = (): boolean => {
    const newErrors: ValidationError[] = []
    
    if (!formData.name.trim()) {
      newErrors.push({ field: 'name', message: 'Category name is required' })
    }
    
    if (formData.name.length > 50) {
      newErrors.push({ field: 'name', message: 'Category name must be less than 50 characters' })
    }
    
    // Check for duplicate names at the same level
    const siblings = categories.filter(c => c.parentId === formData.parentId && c.id !== category?.id)
    if (siblings.some(c => c.name.toLowerCase() === formData.name.toLowerCase())) {
      newErrors.push({ field: 'name', message: 'A category with this name already exists' })
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    try {
      await onSave(formData)
    } catch (error) {
      toast.error('Failed to save category')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Category Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={cn('input', errors.find(e => e.field === 'name') && 'border-red-500')}
          placeholder="Enter category name"
          required
        />
        {errors.find(e => e.field === 'name') && (
          <p className="mt-1 text-sm text-red-600">
            {errors.find(e => e.field === 'name')?.message}
          </p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Icon
        </label>
        <EmojiPicker
          value={formData.icon}
          onChange={(icon) => setFormData({ ...formData, icon })}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Color
        </label>
        <ColorPicker
          value={formData.color}
          onChange={(color) => setFormData({ ...formData, color })}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Parent Category
        </label>
        <select
          value={formData.parentId}
          onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
          className="input"
        >
          <option value="">No parent (top level)</option>
          {getAvailableParents(category?.id).map(parent => (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          {category ? 'Update' : 'Create'} Category
        </button>
      </div>
    </form>
  )
}
```

---

## RulesManager

Advanced rule engine for automatic transaction categorization and processing.

**File**: `src/components/RulesManager.tsx`

### Props

```typescript
interface RulesManagerProps {
  onClose?: () => void
}
```

### Features

- **Complex Conditions**: Multiple condition types with logical operators
- **Priority System**: Rule execution order management
- **Rule Testing**: Test rules against existing transactions
- **Rule Templates**: Predefined rule templates
- **Performance Analytics**: Rule execution statistics
- **Batch Processing**: Apply rules to historical transactions

### Rule Structure

```typescript
interface Rule {
  id: string
  name: string
  enabled: boolean
  priority: number
  conditions: RuleCondition[]
  actions: RuleAction[]
  stopProcessing: boolean
  metadata?: {
    createdAt: Date
    lastModified: Date
    matchCount: number
    lastMatched?: Date
  }
}

interface RuleCondition {
  field: 'merchant' | 'description' | 'amount' | 'date' | 'account'
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'range' | 'lessThan' | 'greaterThan'
  value: string | number | { min: number; max: number } | Date
  caseSensitive?: boolean
}

interface RuleAction {
  type: 'setCategory' | 'setMerchant' | 'addNote' | 'setSubscription' | 'setAccount'
  value: any
}
```

### Rule Engine

```typescript
const evaluateRule = (rule: Rule, transaction: Transaction): boolean => {
  return rule.conditions.every(condition => evaluateCondition(condition, transaction))
}

const evaluateCondition = (condition: RuleCondition, transaction: Transaction): boolean => {
  const fieldValue = getTransactionFieldValue(transaction, condition.field)
  
  switch (condition.operator) {
    case 'equals':
      return compareValues(fieldValue, condition.value, condition.caseSensitive)
    
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
    
    case 'startsWith':
      return String(fieldValue).toLowerCase().startsWith(String(condition.value).toLowerCase())
    
    case 'endsWith':
      return String(fieldValue).toLowerCase().endsWith(String(condition.value).toLowerCase())
    
    case 'regex':
      try {
        const regex = new RegExp(String(condition.value), condition.caseSensitive ? 'g' : 'gi')
        return regex.test(String(fieldValue))
      } catch {
        return false
      }
    
    case 'range':
      const rangeValue = condition.value as { min: number; max: number }
      const numValue = Number(fieldValue)
      return numValue >= rangeValue.min && numValue <= rangeValue.max
    
    case 'lessThan':
      return Number(fieldValue) < Number(condition.value)
    
    case 'greaterThan':
      return Number(fieldValue) > Number(condition.value)
    
    default:
      return false
  }
}

const applyRuleActions = async (actions: RuleAction[], transaction: Transaction) => {
  const updates: Partial<Transaction> = {}
  
  for (const action of actions) {
    switch (action.type) {
      case 'setCategory':
        updates.categoryId = action.value
        break
      
      case 'setMerchant':
        updates.merchant = action.value
        break
      
      case 'addNote':
        const existingNotes = transaction.metadata?.notes || ''
        updates.metadata = {
          ...transaction.metadata,
          notes: existingNotes ? `${existingNotes}\n${action.value}` : action.value
        }
        break
      
      case 'setSubscription':
        updates.isSubscription = action.value
        break
      
      case 'setAccount':
        updates.accountId = action.value
        break
    }
  }
  
  if (Object.keys(updates).length > 0) {
    await useTransactionsStore.getState().updateTransaction(transaction.id, updates)
  }
}
```

### Rule Testing

```typescript
const testRule = (rule: Rule): RuleTestResult => {
  const transactions = useTransactionsStore.getState().transactions
  const matches: Transaction[] = []
  const samples: Transaction[] = []
  
  for (const transaction of transactions) {
    if (evaluateRule(rule, transaction)) {
      matches.push(transaction)
      
      // Keep first 5 matches as samples
      if (samples.length < 5) {
        samples.push(transaction)
      }
    }
  }
  
  return {
    totalMatches: matches.length,
    sampleMatches: samples,
    coverage: (matches.length / transactions.length) * 100,
    wouldApply: matches.filter(t => !rule.actions.every(action => 
      isActionAlreadyApplied(action, t)
    )).length
  }
}

interface RuleTestResult {
  totalMatches: number
  sampleMatches: Transaction[]
  coverage: number
  wouldApply: number
}

const RuleTestPanel = ({ rule }: { rule: Rule }) => {
  const [testResult, setTestResult] = useState<RuleTestResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  
  const runTest = async () => {
    setIsRunning(true)
    try {
      const result = testRule(rule)
      setTestResult(result)
    } finally {
      setIsRunning(false)
    }
  }
  
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Test Rule</h4>
        <button
          onClick={runTest}
          disabled={isRunning}
          className="btn-primary"
        >
          {isRunning ? 'Testing...' : 'Run Test'}
        </button>
      </div>
      
      {testResult && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600">{testResult.totalMatches}</div>
              <div className="text-sm text-blue-600">Total Matches</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
              <div className="text-2xl font-bold text-green-600">{testResult.wouldApply}</div>
              <div className="text-sm text-green-600">Would Apply</div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
              <div className="text-2xl font-bold text-orange-600">{testResult.coverage.toFixed(1)}%</div>
              <div className="text-sm text-orange-600">Coverage</div>
            </div>
          </div>
          
          {testResult.sampleMatches.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Sample Matches:</h5>
              <div className="space-y-2">
                {testResult.sampleMatches.map(transaction => (
                  <div key={transaction.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm">
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-gray-500">
                      {formatCurrency(transaction.amount)} • {formatRelativeDate(transaction.date)}
                      {transaction.merchant && ` • ${transaction.merchant}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### Rule Templates

```typescript
const ruleTemplates = [
  {
    name: 'Subscription Services',
    description: 'Automatically categorize subscription payments',
    conditions: [
      {
        field: 'merchant',
        operator: 'contains',
        value: 'netflix|spotify|amazon prime|disney',
        caseSensitive: false
      }
    ],
    actions: [
      { type: 'setCategory', value: 'entertainment-subscriptions' },
      { type: 'setSubscription', value: true }
    ]
  },
  
  {
    name: 'Large Expenses',
    description: 'Flag large expenses for review',
    conditions: [
      {
        field: 'amount',
        operator: 'lessThan',
        value: -500
      }
    ],
    actions: [
      { type: 'addNote', value: 'Large expense - review required' }
    ]
  },
  
  {
    name: 'Income Deposits',
    description: 'Categorize salary and income deposits',
    conditions: [
      {
        field: 'amount',
        operator: 'greaterThan',
        value: 1000
      },
      {
        field: 'description',
        operator: 'contains',
        value: 'salary|wages|payroll|direct deposit'
      }
    ],
    actions: [
      { type: 'setCategory', value: 'income-salary' }
    ]
  }
]

const TemplateSelector = ({ onApplyTemplate }: { onApplyTemplate: (template: any) => void }) => (
  <div className="space-y-3">
    <h4 className="font-medium">Quick Templates</h4>
    {ruleTemplates.map((template, index) => (
      <div key={index} className="border rounded-lg p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium">{template.name}</div>
            <div className="text-sm text-gray-500">{template.description}</div>
          </div>
          <button
            onClick={() => onApplyTemplate(template)}
            className="btn-secondary text-sm"
          >
            Use Template
          </button>
        </div>
      </div>
    ))}
  </div>
)
```

### Batch Rule Application

```typescript
const applyRulesToHistoricalTransactions = async (ruleIds?: string[]) => {
  const transactions = useTransactionsStore.getState().transactions
  const rules = useRulesStore.getState().rules
    .filter(r => r.enabled && (!ruleIds || ruleIds.includes(r.id)))
    .sort((a, b) => a.priority - b.priority)
  
  let processedCount = 0
  const batchSize = 100
  
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)
    
    for (const transaction of batch) {
      for (const rule of rules) {
        if (evaluateRule(rule, transaction)) {
          await applyRuleActions(rule.actions, transaction)
          
          // Update rule statistics
          await updateRuleStats(rule.id, transaction)
          
          if (rule.stopProcessing) break
        }
      }
    }
    
    processedCount += batch.length
    
    // Update progress
    const progress = (processedCount / transactions.length) * 100
    toast.info(`Processing rules: ${Math.round(progress)}%`)
  }
  
  toast.success('Rules applied', `Processed ${processedCount} transactions`)
}
```

---

## OnboardingFlow

Interactive user onboarding with guided tours and setup wizards.

**File**: `src/components/Onboarding/OnboardingFlow.tsx`

### Features

- **Progressive Disclosure**: Step-by-step feature introduction
- **Interactive Tours**: Guided walks through key functionality
- **Setup Wizards**: Initial configuration assistance
- **Progress Tracking**: Track completion status
- **Skip Options**: Allow advanced users to skip steps

### Tour System

```typescript
interface TourStep {
  id: string
  title: string
  content: string
  target: string // CSS selector
  placement: 'top' | 'bottom' | 'left' | 'right'
  action?: {
    type: 'click' | 'input' | 'wait'
    duration?: number
  }
  validation?: () => boolean
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Kite Finance',
    content: 'Let\'s take a quick tour of your new financial dashboard.',
    target: '.dashboard-welcome',
    placement: 'bottom'
  },
  {
    id: 'add-account',
    title: 'Add Your First Account',
    content: 'Start by adding a bank account to track your finances.',
    target: '.add-account-button',
    placement: 'left',
    action: { type: 'click' }
  },
  {
    id: 'create-transaction',
    title: 'Record a Transaction',
    content: 'Use the + button to quickly add income or expenses.',
    target: '.quick-add-button',
    placement: 'top',
    action: { type: 'click' }
  }
]
```

### Implementation

This documentation provides comprehensive coverage of all feature components in the Kite application, detailing their functionality, integration points, and usage patterns. Each component is designed to handle specific business logic while maintaining consistency with the overall application architecture.