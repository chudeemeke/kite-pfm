import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Settings types
export interface ProfileSettings {
  name: string
  email: string
  avatar?: string
  subscriptionStatus: 'free' | 'premium'
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  fontSize: 'small' | 'medium' | 'large'
  viewDensity: 'compact' | 'comfortable' | 'spacious'
  showBalance: boolean
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  numberFormat: 'us' | 'eu' | 'uk' | 'ca'
}

export interface NotificationSettings {
  budgetAlerts: boolean
  budgetThreshold: number
  largeTransactionAlerts: boolean
  largeTransactionThreshold: number
  weeklySummary: boolean
  monthlyReport: boolean
  reminderNotifications: boolean
  soundEffects: boolean
  vibration: boolean
}

export interface PrivacySettings {
  biometricUnlock: boolean
  autoLockTimer: number // minutes
  privacyMode: boolean
  dataSharing: boolean
  analyticsOptIn: boolean
  twoFactorAuth: boolean
}

export interface CurrencySettings {
  primaryCurrency: string
  multiCurrencySupport: boolean
  language: string
  region: string
  firstDayOfWeek: 'monday' | 'sunday'
  fiscalYearStart: string // MM-DD format
}

export interface BudgetSettings {
  defaultCarryStrategy: 'carryNone' | 'carryUnspent' | 'carryOverspend'
  budgetPeriod: 'monthly' | 'weekly' | 'custom'
  warningThreshold: number
  autoCreateBudgets: boolean
  defaultAccountId?: string
}

export interface TransactionSettings {
  defaultAccountId?: string
  autoCategorization: boolean
  duplicateDetectionSensitivity: 'low' | 'medium' | 'high'
  defaultTransactionNotes: string
  receiptScanning: boolean
}

export interface DataSettings {
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  exportFormat: 'csv' | 'json' | 'excel'
  cloudSync: boolean
  dataRetentionPeriod: number // months
}

export interface AdvancedSettings {
  developerMode: boolean
  debugMode: boolean
  performanceMode: boolean
  cacheSize: number // MB
  experimentalFeatures: boolean
}

export interface AllSettings {
  profile: ProfileSettings
  appearance: AppearanceSettings
  notifications: NotificationSettings
  privacy: PrivacySettings
  currency: CurrencySettings
  budget: BudgetSettings
  transaction: TransactionSettings
  data: DataSettings
  advanced: AdvancedSettings
}

interface SettingsStore extends AllSettings {
  // Actions
  updateProfile: (settings: Partial<ProfileSettings>) => void
  updateAppearance: (settings: Partial<AppearanceSettings>) => void
  updateNotifications: (settings: Partial<NotificationSettings>) => void
  updatePrivacy: (settings: Partial<PrivacySettings>) => void
  updateCurrency: (settings: Partial<CurrencySettings>) => void
  updateBudget: (settings: Partial<BudgetSettings>) => void
  updateTransaction: (settings: Partial<TransactionSettings>) => void
  updateData: (settings: Partial<DataSettings>) => void
  updateAdvanced: (settings: Partial<AdvancedSettings>) => void
  
  // Utilities
  resetAllSettings: () => void
  exportSettings: () => AllSettings
  importSettings: (settings: Partial<AllSettings>) => void
  
  // Search functionality
  searchTerm: string
  setSearchTerm: (term: string) => void
}

// Default settings
const defaultSettings: AllSettings = {
  profile: {
    name: 'User',
    email: 'user@example.com',
    subscriptionStatus: 'free'
  },
  appearance: {
    theme: 'system',
    accentColor: '#3b82f6',
    fontSize: 'medium',
    viewDensity: 'comfortable',
    showBalance: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'us'
  },
  notifications: {
    budgetAlerts: true,
    budgetThreshold: 90,
    largeTransactionAlerts: true,
    largeTransactionThreshold: 500,
    weeklySummary: true,
    monthlyReport: true,
    reminderNotifications: true,
    soundEffects: true,
    vibration: true
  },
  privacy: {
    biometricUnlock: false,
    autoLockTimer: 5,
    privacyMode: false,
    dataSharing: false,
    analyticsOptIn: true,
    twoFactorAuth: false
  },
  currency: {
    primaryCurrency: 'USD',
    multiCurrencySupport: false,
    language: 'en',
    region: 'US',
    firstDayOfWeek: 'monday',
    fiscalYearStart: '01-01'
  },
  budget: {
    defaultCarryStrategy: 'carryUnspent',
    budgetPeriod: 'monthly',
    warningThreshold: 80,
    autoCreateBudgets: true
  },
  transaction: {
    autoCategorization: true,
    duplicateDetectionSensitivity: 'medium',
    defaultTransactionNotes: '',
    receiptScanning: false
  },
  data: {
    autoBackup: false,
    backupFrequency: 'weekly',
    exportFormat: 'csv',
    cloudSync: false,
    dataRetentionPeriod: 36
  },
  advanced: {
    developerMode: false,
    debugMode: false,
    performanceMode: false,
    cacheSize: 100,
    experimentalFeatures: false
  }
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      searchTerm: '',
      
      updateProfile: (settings) => set((state) => ({
        profile: { ...state.profile, ...settings }
      })),
      
      updateAppearance: (settings) => set((state) => ({
        appearance: { ...state.appearance, ...settings }
      })),
      
      updateNotifications: (settings) => set((state) => ({
        notifications: { ...state.notifications, ...settings }
      })),
      
      updatePrivacy: (settings) => set((state) => ({
        privacy: { ...state.privacy, ...settings }
      })),
      
      updateCurrency: (settings) => set((state) => ({
        currency: { ...state.currency, ...settings }
      })),
      
      updateBudget: (settings) => set((state) => ({
        budget: { ...state.budget, ...settings }
      })),
      
      updateTransaction: (settings) => set((state) => ({
        transaction: { ...state.transaction, ...settings }
      })),
      
      updateData: (settings) => set((state) => ({
        data: { ...state.data, ...settings }
      })),
      
      updateAdvanced: (settings) => set((state) => ({
        advanced: { ...state.advanced, ...settings }
      })),
      
      resetAllSettings: () => set(defaultSettings),
      
      exportSettings: () => {
        const { 
          profile, appearance, notifications, privacy, 
          currency, budget, transaction, data, advanced 
        } = get()
        return {
          profile, appearance, notifications, privacy,
          currency, budget, transaction, data, advanced
        }
      },
      
      importSettings: (settings) => set((state) => ({
        ...state,
        ...settings
      })),
      
      setSearchTerm: (term) => set({ searchTerm: term })
    }),
    {
      name: 'kite-settings-store',
      version: 1
    }
  )
)