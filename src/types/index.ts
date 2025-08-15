// Core entity types for Kite Personal Finance Manager
export interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'loan' | 'other'
  currency: string
  balance: number
  createdAt: Date
  archivedAt?: Date
  isDefault?: boolean
}

export interface Transaction {
  id: string
  accountId: string
  date: Date
  amount: number
  currency: string
  description: string
  merchant?: string
  categoryId?: string
  isSubscription?: boolean
  metadata?: Record<string, unknown>
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  parentId?: string
}

export interface Budget {
  id: string
  categoryId: string
  month: string // YYYY-MM format
  amount: number
  carryStrategy: 'carryNone' | 'carryUnspent' | 'carryOverspend'
  notes?: string
}

export interface Rule {
  id: string
  name: string
  enabled: boolean
  priority: number
  conditions: RuleCondition[]
  actions: RuleAction[]
  stopProcessing: boolean
}

export interface RuleCondition {
  field: 'merchant' | 'description' | 'amount'
  op: 'eq' | 'contains' | 'regex' | 'range'
  value: string | number | { min: number; max: number }
}

export interface RuleAction {
  setCategoryId?: string
  setIsSubscription?: boolean
  setNotesAppend?: string
}

export interface Subscription {
  id: string
  name: string
  cadence: 'monthly' | 'yearly' | 'custom'
  amount: number
  currency: string
  nextDueDate: Date
  accountId?: string
  categoryId?: string
  notes?: string
}

export interface AppMeta {
  id: 'singleton'
  schemaVersion: number
  appVersion: string
  createdAt: Date
  updatedAt: Date
  migrations: string[]
}

// Budget ledger types
export interface BudgetLedgerEntry {
  type: 'carryIn' | 'carryOut' | 'spent' | 'budgeted'
  amount: number
  description: string
  date: Date
}

export interface BudgetLedger {
  categoryId: string
  month: string
  entries: BudgetLedgerEntry[]
  totalBudgeted: number
  totalSpent: number
  totalCarriedIn: number
  totalCarriedOut: number
  remaining: number
}

// UI State types
export interface UIState {
  theme: 'light' | 'dark' | 'system'
  tourProgress: {
    completed: boolean
    currentStep?: number
  }
  toasts: Toast[]
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

// CSV Import/Export types
export interface CSVMapping {
  date: string
  amount: string
  description: string
  merchant?: string
  category?: string
  account?: string
}

export interface ImportPreview {
  totalRows: number
  validRows: number
  errors: ImportError[]
  sample: Transaction[]
}

export interface ImportError {
  row: number
  field: string
  message: string
  value: unknown
}

// Chart data types
export interface CashflowData {
  date: string
  income: number
  expenses: number
  net: number
}

export interface SpendByCategoryData {
  categoryId: string
  categoryName: string
  amount: number
  color: string
  percentage: number
}

export interface NetWorthData {
  date: string
  assets: number
  liabilities: number
  netWorth: number
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T> {
  values: T
  errors: ValidationError[]
  isSubmitting: boolean
  isDirty: boolean
}

// API Response types (for future sync functionality)
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

// Security types (for future encryption)
export interface EncryptedData {
  iv: string
  data: string
  tag: string
}

export interface KeyDerivation {
  salt: string
  iterations: number
  keyLength: number
}