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

// User management types
export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  lastActiveAt: Date
  profilePicture?: string
}

// Security types
export interface SecurityCredential {
  id: string
  userId: string
  type: 'biometric' | 'pin' | 'webauthn'
  credentialId: string
  encryptedData: string // Base64 encoded encrypted credential data
  deviceName?: string
  createdAt: Date
  lastUsedAt: Date
  algorithm?: string // Encryption algorithm used
  salt?: string // Salt for encryption if used
}

export interface SecuritySettings {
  id: string
  userId: string
  autoLockMinutes: number
  privacyMode: boolean
  biometricEnabled: boolean
  pinEnabled: boolean
  updatedAt: Date
  failedAttempts?: number
  lockedUntil?: Date
}

export interface Settings {
  id: string
  value: string
  createdAt: Date
  updatedAt: Date
}

// Goal tracking types
export interface Goal {
  id: string
  userId: string
  name: string
  description?: string
  type: 'savings' | 'debt' | 'investment' | 'emergency' | 'purchase' | 'custom'
  category: 'short-term' | 'medium-term' | 'long-term' // < 1 year, 1-5 years, > 5 years
  targetAmount: number
  currentAmount: number
  currency: string
  targetDate: Date
  startDate: Date
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  // Tracking configuration
  trackingMethod: 'manual' | 'automatic' | 'hybrid'
  linkedAccountIds?: string[] // Accounts to track for automatic progress
  linkedCategoryIds?: string[] // Categories to exclude from spending for savings goals
  
  // Milestones
  milestones?: GoalMilestone[]
  
  // Visual customization
  icon?: string
  color?: string
  imageUrl?: string
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  notes?: string
}

export interface GoalMilestone {
  id: string
  goalId: string
  name: string
  targetAmount: number
  targetDate?: Date
  achievedAt?: Date
  celebrationShown?: boolean
}

export interface GoalContribution {
  id: string
  goalId: string
  amount: number
  date: Date
  source: 'manual' | 'automatic' | 'transfer' | 'interest'
  description?: string
  transactionId?: string // Link to transaction if applicable
  createdAt: Date
}

// Insights and analytics types
export interface InsightPeriod {
  start: Date
  end: Date
  label: string
}

export interface SpendingTrend {
  period: InsightPeriod
  categoryId?: string
  totalSpent: number
  transactionCount: number
  averageTransaction: number
  percentageChange?: number // vs previous period
  isAnomaly?: boolean
}

export interface CategoryInsight {
  categoryId: string
  categoryName: string
  totalSpent: number
  percentage: number // of total spending
  transactionCount: number
  averageTransaction: number
  trend: 'increasing' | 'decreasing' | 'stable'
  trendPercentage: number
  topMerchants?: MerchantSpending[]
}

export interface MerchantSpending {
  merchant: string
  amount: number
  count: number
  lastTransaction: Date
}

export interface CashFlowInsight {
  period: InsightPeriod
  income: number
  expenses: number
  netFlow: number
  savingsRate: number // percentage
  categories: CategoryInsight[]
}

export interface PredictiveInsight {
  type: 'spending' | 'saving' | 'budget'
  prediction: number
  confidence: number // 0-100
  basis: string // explanation of prediction
  recommendations?: string[]
}

export interface AnomalyInsight {
  id: string
  type: 'unusual_spending' | 'duplicate' | 'pattern_break' | 'large_transaction'
  severity: 'info' | 'warning' | 'alert'
  transactionIds: string[]
  amount?: number
  description: string
  detectedAt: Date
  dismissed?: boolean
}

export interface InsightSummary {
  period: InsightPeriod
  cashFlow: CashFlowInsight
  trends: SpendingTrend[]
  categories: CategoryInsight[]
  predictions?: PredictiveInsight[]
  anomalies?: AnomalyInsight[]
  goalProgress?: GoalProgressSummary[]
}

export interface GoalProgressSummary {
  goalId: string
  goalName: string
  progressPercentage: number
  projectedCompletion?: Date
  isOnTrack: boolean
  requiredMonthlySaving?: number
  lastContribution?: Date
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

// Backup types
export interface Backup {
  id: string
  name: string
  createdAt: Date
  size: number
  type: 'manual' | 'automatic'
  encryptedData?: string
  metadata: {
    accounts: number
    transactions: number
    categories: number
    budgets: number
    goals?: number
    version: string
  }
}

export interface BackupData {
  accounts: Account[]
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  rules?: Rule[]
  subscriptions?: Subscription[]
  goals?: Goal[]
  goalMilestones?: GoalMilestone[]
  goalContributions?: GoalContribution[]
  settings?: Settings
  exportDate: Date
  appVersion: string
}