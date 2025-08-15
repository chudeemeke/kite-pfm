import { useState, useMemo, useEffect } from 'react'
import { 
  useSettingsStore, 
  useUIStore, 
  useAccountsStore,
  toast 
} from '@/stores'
import { demoService } from '@/services'
import { 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Globe, 
  Target, 
  CreditCard, 
  Database, 
  Settings as SettingsIcon, 
  Info,
  Search,
  Moon,
  Sun,
  DollarSign,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Star,
  Crown,
  Zap,
  HelpCircle,
  MessageSquare,
  Heart,
  Share2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Volume2,
  Vibrate,
  Clock,
  FileText,
  Cloud,
  Fingerprint,
  Key,
  ScanLine,
  BarChart3,
  Sliders,
  Bug,
  Cpu,
  HardDrive,
  Tag
} from 'lucide-react'

// Import components
import { SettingsSection } from '@/components/settings/SettingsSection'
import { SettingsItem } from '@/components/settings/SettingsItem'
import { ToggleSwitch } from '@/components/settings/ToggleSwitch'
import { ColorPicker } from '@/components/settings/ColorPicker'
import { Slider } from '@/components/settings/Slider'
import { SelectDropdown } from '@/components/settings/SelectDropdown'
import CategoriesManager from '@/components/CategoriesManager'
import DataImport from '@/components/DataImport'
import RulesManager from '@/components/RulesManager'
import BackupManager from '@/components/BackupManager'
import ProfileEditor from '@/components/ProfileEditor'
import PinEntryModal from '@/components/PinEntryModal'
import { notificationService } from '@/services/notifications'
import { securityService } from '@/services/security'
import { currencySymbols } from '@/design-system/tokens'

// Helper function to get currency symbol
const getCurrencySymbol = (currency: string): string => {
  return currencySymbols[currency as keyof typeof currencySymbols] || currency
}

const SettingsPage = () => {
  const {
    profile,
    appearance,
    notifications,
    privacy,
    currency,
    budget,
    transaction,
    data,
    advanced,
    updateProfile,
    updateAppearance,
    updateNotifications,
    updatePrivacy,
    updateCurrency,
    updateBudget,
    updateTransaction,
    updateData,
    updateAdvanced,
    resetAllSettings,
    searchTerm,
    setSearchTerm
  } = useSettingsStore()

  const { setTheme } = useUIStore()
  const { accounts } = useAccountsStore()

  const [confirmReset, setConfirmReset] = useState(false)
  const [cacheInfo, setCacheInfo] = useState({ size: '0 KB', items: 0 })
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  const [showDataImport, setShowDataImport] = useState(false)
  const [showRulesManager, setShowRulesManager] = useState(false)
  const [showBackupManager, setShowBackupManager] = useState(false)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Filter sections based on search term
  const filteredSections = useMemo(() => {
    if (!searchTerm) return []
    
    const term = searchTerm.toLowerCase()
    const matchedSections: string[] = []
    
    // Define searchable content for each section
    const sectionContent = {
      profile: ['profile', 'account', 'user', 'name', 'email', 'avatar', 'subscription', 'premium'],
      appearance: ['appearance', 'theme', 'color', 'font', 'size', 'view', 'balance', 'date', 'number', 'format'],
      notifications: ['notifications', 'alerts', 'budget', 'transaction', 'summary', 'report', 'reminder', 'sound', 'vibration'],
      privacy: ['privacy', 'security', 'biometric', 'lock', 'blur', 'data', 'sharing', 'analytics', 'two-factor'],
      currency: ['currency', 'language', 'region', 'country', 'week', 'fiscal', 'year'],
      categories: ['categories', 'icons', 'colors', 'rules', 'income', 'expense'],
      budget: ['budget', 'carryover', 'period', 'warning', 'threshold', 'auto-create', 'templates'],
      transaction: ['transaction', 'account', 'categorization', 'duplicate', 'detection', 'notes', 'receipt', 'scanning'],
      data: ['data', 'backup', 'export', 'import', 'sync', 'cloud', 'retention'],
      advanced: ['advanced', 'developer', 'debug', 'performance', 'cache', 'experimental', 'features'],
      about: ['about', 'version', 'terms', 'privacy', 'help', 'support', 'rate', 'share']
    }
    
    Object.entries(sectionContent).forEach(([section, keywords]) => {
      if (keywords.some(keyword => keyword.includes(term))) {
        matchedSections.push(section)
      }
    })
    
    return matchedSections
  }, [searchTerm])

  // Handle accordion toggle
  const handleSectionToggle = (sectionTitle: string) => {
    setExpandedSection(expandedSection === sectionTitle ? null : sectionTitle)
  }

  // Auto-expand sections when searching
  useEffect(() => {
    if (searchTerm && filteredSections.length === 1) {
      // If only one section matches, auto-expand it
      const sectionKey = filteredSections[0]
      const sectionTitles: Record<string, string> = {
        profile: 'Profile & Account',
        appearance: 'Appearance & Display',
        notifications: 'Notifications & Alerts',
        privacy: 'Privacy & Security',
        currency: 'Currency & Regional',
        categories: 'Categories Management',
        budget: 'Budget Preferences',
        transaction: 'Transaction Settings',
        data: 'Data & Backup',
        advanced: 'Advanced Settings',
        about: 'About & Support'
      }
      setExpandedSection(sectionTitles[sectionKey] || null)
    } else if (!searchTerm) {
      // Close all sections when search is cleared
      setExpandedSection(null)
    }
  }, [searchTerm, filteredSections])

  // Handle theme change with UI store sync
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateAppearance({ theme })
    setTheme(theme)
  }

  const handleResetData = async () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    
    try {
      await demoService.clearAllData()
      await demoService.seedDemoData()
      resetAllSettings()
      toast.success('Data reset successfully', 'Demo data has been restored')
      window.location.reload()
    } catch (error) {
      toast.error('Failed to reset data', 'Please try again')
    } finally {
      setConfirmReset(false)
    }
  }

  const handleExportData = async () => {
    try {
      const { dataExportImportService } = await import('@/services/dataExportImport')
      await dataExportImportService.exportData(data.exportFormat as 'json' | 'csv' | 'excel')
    } catch (error) {
      toast.error('Export failed', 'Please try again')
    }
  }


  const saveSettings = (message: string) => {
    toast.success('Settings saved', message)
  }

  const handleCreateBackup = async () => {
    try {
      const { dataExportImportService } = await import('@/services/dataExportImport')
      const backupId = await dataExportImportService.createBackup()
      toast.success('Backup created', `Backup ${backupId} created successfully`)
    } catch (error) {
      toast.error('Backup failed', 'Please try again')
    }
  }


  const handleClearCache = async () => {
    try {
      const { dataExportImportService } = await import('@/services/dataExportImport')
      dataExportImportService.clearCache()
      updateCacheInfo()
    } catch (error) {
      toast.error('Failed to clear cache', 'Please try again')
    }
  }

  const handleShowCacheInfo = () => {
    updateCacheInfo()
    toast.info('Cache information', `${cacheInfo.size} used by ${cacheInfo.items} items`)
  }

  const updateCacheInfo = async () => {
    try {
      const { dataExportImportService } = await import('@/services/dataExportImport')
      const info = dataExportImportService.getCacheInfo()
      setCacheInfo(info)
    } catch (error) {
      console.warn('Failed to get cache info:', error)
    }
  }

  // Update cache info on component mount
  useEffect(() => {
    updateCacheInfo()
  }, [])

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Customize your Kite experience
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search settings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Profile & Account */}
      <SettingsSection
        title="Profile & Account"
        description="Manage your personal information and subscription"
        icon={<User className="w-5 h-5 text-primary-600" />}
        isExpanded={expandedSection === 'Profile & Account'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('profile') : false}
      >
        <SettingsItem
          title="Profile Name"
          description="Your display name in the app"
          icon={<User className="w-4 h-4" />}
        >
          <input
            type="text"
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </SettingsItem>

        <SettingsItem
          title="Email Address"
          description="Your email for notifications and account recovery"
          icon={<FileText className="w-4 h-4" />}
        >
          <input
            type="email"
            value={profile.email}
            onChange={(e) => updateProfile({ email: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </SettingsItem>

        <SettingsItem
          title="Subscription Status"
          description="Upgrade to unlock premium features"
          icon={profile.subscriptionStatus === 'premium' ? <Crown className="w-4 h-4" /> : <Star className="w-4 h-4" />}
          badge={profile.subscriptionStatus === 'premium' ? 'Premium' : 'Free'}
        >
          {profile.subscriptionStatus === 'free' && (
            <button
              onClick={() => toast.info('Premium upgrade coming soon')}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg hover:from-primary-700 hover:to-purple-700 transition-colors"
            >
              Upgrade
            </button>
          )}
        </SettingsItem>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="space-y-3">
            <button
              onClick={() => setShowProfileEditor(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="w-4 h-4" />
              Edit Profile & Security
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Update your profile information, change password, and manage account settings
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Appearance & Display */}
      <SettingsSection
        title="Appearance & Display"
        description="Customize the look and feel of your app"
        icon={<Palette className="w-5 h-5 text-pink-600" />}
        isExpanded={expandedSection === 'Appearance & Display'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('appearance') : false}
      >
        <SettingsItem
          title="Theme"
          description="Choose your preferred color scheme"
          icon={appearance.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        >
          <div className="flex gap-2">
            {['light', 'dark', 'system'].map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme as 'light' | 'dark' | 'system')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  appearance.theme === theme 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </SettingsItem>

        <SettingsItem
          title="Accent Color"
          description="Primary color used throughout the app"
          icon={<Palette className="w-4 h-4" />}
        >
          <ColorPicker
            value={appearance.accentColor}
            onChange={(color) => {
              updateAppearance({ accentColor: color })
              saveSettings('Accent color updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Font Size"
          description="Adjust text size for better readability"
          icon={<FileText className="w-4 h-4" />}
        >
          <SelectDropdown
            value={appearance.fontSize}
            onChange={(size) => {
              updateAppearance({ fontSize: size as 'small' | 'medium' | 'large' })
              saveSettings('Font size updated')
            }}
            options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="View Density"
          description="Control spacing and layout density"
          icon={<Sliders className="w-4 h-4" />}
        >
          <SelectDropdown
            value={appearance.viewDensity}
            onChange={(density) => {
              updateAppearance({ viewDensity: density as 'compact' | 'comfortable' | 'spacious' })
              saveSettings('View density updated')
            }}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'spacious', label: 'Spacious' }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="Show Balance"
          description="Display account balances on overview"
          icon={<DollarSign className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={appearance.showBalance}
            onChange={(checked) => {
              updateAppearance({ showBalance: checked })
              saveSettings('Balance visibility updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Date Format"
          description="How dates are displayed"
          icon={<Calendar className="w-4 h-4" />}
        >
          <SelectDropdown
            value={appearance.dateFormat}
            onChange={(format) => {
              updateAppearance({ dateFormat: format as any })
              saveSettings('Date format updated')
            }}
            options={[
              { value: 'DD/MM/YYYY', label: '31/12/2024' },
              { value: 'MM/DD/YYYY', label: '12/31/2024' },
              { value: 'YYYY-MM-DD', label: '2024-12-31' }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="Number Format"
          description="Currency and number formatting"
          icon={<BarChart3 className="w-4 h-4" />}
        >
          <SelectDropdown
            value={appearance.numberFormat}
            onChange={(format) => {
              updateAppearance({ numberFormat: format as any })
              saveSettings('Number format updated')
            }}
            options={[
              { value: 'us', label: '1,234.56' },
              { value: 'eu', label: '1.234,56' },
              { value: 'uk', label: '1,234.56' },
              { value: 'ca', label: '1 234,56' }
            ]}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Notifications & Alerts */}
      <SettingsSection
        title="Notifications & Alerts"
        description="Control how and when you receive notifications"
        icon={<Bell className="w-5 h-5 text-blue-600" />}
        isExpanded={expandedSection === 'Notifications & Alerts'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('notifications') : false}
      >
        <SettingsItem
          title="Budget Alerts"
          description="Get notified when approaching budget limits"
          icon={<Target className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={notifications.budgetAlerts}
            onChange={(checked) => {
              updateNotifications({ budgetAlerts: checked })
              saveSettings('Budget alerts updated')
            }}
          />
        </SettingsItem>

        {notifications.budgetAlerts && (
          <SettingsItem
            title="Budget Alert Threshold"
            description="Alert when spending reaches this percentage"
            icon={<AlertTriangle className="w-4 h-4" />}
          >
            <Slider
              value={notifications.budgetThreshold}
              onChange={(value) => updateNotifications({ budgetThreshold: value })}
              min={50}
              max={100}
              step={5}
              suffix="%"
            />
          </SettingsItem>
        )}

        <SettingsItem
          title="Large Transaction Alerts"
          description="Alert for transactions above a certain amount"
          icon={<CreditCard className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={notifications.largeTransactionAlerts}
            onChange={(checked) => {
              updateNotifications({ largeTransactionAlerts: checked })
              saveSettings('Transaction alerts updated')
            }}
          />
        </SettingsItem>

        {notifications.largeTransactionAlerts && (
          <SettingsItem
            title="Large Transaction Threshold"
            description="Alert for transactions above this amount"
            icon={<DollarSign className="w-4 h-4" />}
          >
            <Slider
              value={notifications.largeTransactionThreshold}
              onChange={(value) => updateNotifications({ largeTransactionThreshold: value })}
              min={100}
              max={2000}
              step={50}
              prefix={getCurrencySymbol(currency.primaryCurrency)}
            />
          </SettingsItem>
        )}

        <SettingsItem
          title="Weekly Summary"
          description="Receive weekly spending summaries"
          icon={<Calendar className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={notifications.weeklySummary}
            onChange={(checked) => {
              updateNotifications({ weeklySummary: checked })
              saveSettings('Weekly summary updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Monthly Report"
          description="Receive detailed monthly reports"
          icon={<FileText className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={notifications.monthlyReport}
            onChange={(checked) => {
              updateNotifications({ monthlyReport: checked })
              saveSettings('Monthly report updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Reminder Notifications"
          description="Reminders for bill payments and goals"
          icon={<Clock className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={notifications.reminderNotifications}
            onChange={(checked) => {
              updateNotifications({ reminderNotifications: checked })
              saveSettings('Reminder notifications updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Sound Effects"
          description="Play sounds for notifications and actions"
          icon={<Volume2 className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={notifications.soundEffects}
            onChange={(checked) => {
              updateNotifications({ soundEffects: checked })
              saveSettings('Sound effects updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Vibration"
          description="Vibrate for notifications on mobile devices"
          icon={<Vibrate className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={notifications.vibration}
            onChange={(checked) => {
              updateNotifications({ vibration: checked })
              saveSettings('Vibration settings updated')
            }}
          />
        </SettingsItem>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="space-y-3">
            <button
              onClick={() => {
                notificationService.triggerTestNotification()
                toast.success('Test notification sent', 'Check your notification center')
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              Test Notification
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Send a test notification to verify your settings are working
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Privacy & Security */}
      <SettingsSection
        title="Privacy & Security"
        description="Protect your financial data and privacy"
        icon={<Shield className="w-5 h-5 text-green-600" />}
        isExpanded={expandedSection === 'Privacy & Security'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('privacy') : false}
      >
        <SettingsItem
          title="Biometric Unlock"
          description="Use fingerprint or face recognition to unlock"
          icon={<Fingerprint className="w-4 h-4" />}
          badge="Premium"
          disabled={profile.subscriptionStatus === 'free'}
        >
          <ToggleSwitch
            checked={privacy.biometricUnlock}
            onChange={(checked) => {
              updatePrivacy({ biometricUnlock: checked })
              saveSettings('Biometric unlock updated')
            }}
            disabled={profile.subscriptionStatus === 'free'}
          />
        </SettingsItem>

        <SettingsItem
          title="Auto-Lock Timer"
          description="Automatically lock the app after inactivity"
          icon={<Lock className="w-4 h-4" />}
        >
          <SelectDropdown
            value={privacy.autoLockTimer.toString()}
            onChange={(value) => {
              updatePrivacy({ autoLockTimer: parseInt(value) })
              saveSettings('Auto-lock timer updated')
            }}
            options={[
              { value: '1', label: '1 minute' },
              { value: '5', label: '5 minutes' },
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '60', label: '1 hour' }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="Privacy Mode"
          description="Blur sensitive amounts when app is backgrounded"
          icon={privacy.privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={privacy.privacyMode}
            onChange={(checked) => {
              updatePrivacy({ privacyMode: checked })
              saveSettings('Privacy mode updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Data Sharing"
          description="Share anonymized data to improve the app"
          icon={<Share2 className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={privacy.dataSharing}
            onChange={(checked) => {
              updatePrivacy({ dataSharing: checked })
              saveSettings('Data sharing preferences updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Analytics"
          description="Help improve the app with usage analytics"
          icon={<BarChart3 className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={privacy.analyticsOptIn}
            onChange={(checked) => {
              updatePrivacy({ analyticsOptIn: checked })
              saveSettings('Analytics preferences updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Two-Factor Authentication"
          description="Add an extra layer of security"
          icon={<Key className="w-4 h-4" />}
          badge="Coming Soon"
          disabled
        >
          <ToggleSwitch
            checked={privacy.twoFactorAuth}
            onChange={(checked) => updatePrivacy({ twoFactorAuth: checked })}
            disabled
          />
        </SettingsItem>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setShowPinModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Key className="w-4 h-4" />
                Set PIN
              </button>
              
              <button
                onClick={async () => {
                  const available = await securityService.isBiometricAvailable()
                  if (available) {
                    const success = await securityService.enableBiometric()
                    if (success) {
                      toast.success('Biometric enabled', 'You can now use biometric authentication')
                    }
                  } else {
                    toast.error('Not supported', 'Biometric authentication is not available on this device')
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Fingerprint className="w-4 h-4" />
                Enable Biometric
              </button>
            </div>
            
            <button
              onClick={() => {
                securityService.lockApp('Manual lock from settings')
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Lock className="w-4 h-4" />
              Test App Lock
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Configure PIN, biometric authentication, and test security features
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Currency & Regional */}
      <SettingsSection
        title="Currency & Regional"
        description="Set your location and currency preferences"
        icon={<Globe className="w-5 h-5 text-purple-600" />}
        isExpanded={expandedSection === 'Currency & Regional'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('currency') : false}
      >
        <SettingsItem
          title="Primary Currency"
          description="Default currency for new accounts and transactions"
          icon={<DollarSign className="w-4 h-4" />}
        >
          <SelectDropdown
            value={currency.primaryCurrency}
            onChange={(value) => {
              updateCurrency({ primaryCurrency: value })
              saveSettings('Primary currency updated')
            }}
            options={[
              { value: 'GBP', label: 'British Pound (£)' },
              { value: 'NGN', label: 'Nigerian Naira (₦)' },
              { value: 'USD', label: 'US Dollar ($)' },
              { value: 'EUR', label: 'Euro (€)' },
              { value: 'CAD', label: 'Canadian Dollar (C$)' },
              { value: 'AUD', label: 'Australian Dollar (A$)' },
              { value: 'JPY', label: 'Japanese Yen (¥)' },
              { value: 'CNY', label: 'Chinese Yuan (¥)' },
              { value: 'INR', label: 'Indian Rupee (₹)' },
              { value: 'ZAR', label: 'South African Rand (R)' },
              { value: 'KES', label: 'Kenyan Shilling (KSh)' },
              { value: 'GHS', label: 'Ghanaian Cedi (GH₵)' },
              { value: 'EGP', label: 'Egyptian Pound (E£)' },
              { value: 'MAD', label: 'Moroccan Dirham (DH)' }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="Multi-Currency Support"
          description="Enable support for multiple currencies"
          icon={<Globe className="w-4 h-4" />}
          badge="Premium"
          disabled={profile.subscriptionStatus === 'free'}
        >
          <ToggleSwitch
            checked={currency.multiCurrencySupport}
            onChange={(checked) => {
              updateCurrency({ multiCurrencySupport: checked })
              saveSettings('Multi-currency support updated')
            }}
            disabled={profile.subscriptionStatus === 'free'}
          />
        </SettingsItem>

        <SettingsItem
          title="Language"
          description="App display language"
          icon={<MessageSquare className="w-4 h-4" />}
        >
          <SelectDropdown
            value={currency.language}
            onChange={(value) => {
              updateCurrency({ language: value })
              saveSettings('Language updated')
            }}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español', disabled: true },
              { value: 'fr', label: 'Français', disabled: true },
              { value: 'de', label: 'Deutsch', disabled: true }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="Region"
          description="Your country or region"
          icon={<Globe className="w-4 h-4" />}
        >
          <SelectDropdown
            value={currency.region}
            onChange={(value) => {
              updateCurrency({ region: value })
              saveSettings('Region updated')
            }}
            options={[
              { value: 'US', label: 'United States' },
              { value: 'CA', label: 'Canada' },
              { value: 'GB', label: 'United Kingdom' },
              { value: 'AU', label: 'Australia' },
              { value: 'EU', label: 'European Union' }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="First Day of Week"
          description="Start week on Monday or Sunday"
          icon={<Calendar className="w-4 h-4" />}
        >
          <SelectDropdown
            value={currency.firstDayOfWeek}
            onChange={(value) => {
              updateCurrency({ firstDayOfWeek: value as 'monday' | 'sunday' })
              saveSettings('First day of week updated')
            }}
            options={[
              { value: 'monday', label: 'Monday' },
              { value: 'sunday', label: 'Sunday' }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="Fiscal Year Start"
          description="When your fiscal year begins"
          icon={<Calendar className="w-4 h-4" />}
        >
          <SelectDropdown
            value={currency.fiscalYearStart}
            onChange={(value) => {
              updateCurrency({ fiscalYearStart: value })
              saveSettings('Fiscal year start updated')
            }}
            options={[
              { value: '01-01', label: 'January 1st' },
              { value: '04-01', label: 'April 1st' },
              { value: '07-01', label: 'July 1st' },
              { value: '10-01', label: 'October 1st' }
            ]}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Categories Management */}
      <SettingsSection
        title="Categories Management"
        description="Organize your transactions with custom categories"
        icon={<Tag className="w-5 h-5 text-orange-600" />}
        isExpanded={expandedSection === 'Categories Management'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('categories') : false}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="space-y-3">
            <button
              onClick={() => setShowCategoriesManager(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Tag className="w-4 h-4" />
              Manage Categories
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Create, edit, and organize your transaction categories with custom icons and colors
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Budget Preferences */}
      <SettingsSection
        title="Budget Preferences"
        description="Configure your budgeting workflow"
        icon={<Target className="w-5 h-5 text-orange-600" />}
        isExpanded={expandedSection === 'Budget Preferences'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('budget') : false}
      >
        <SettingsItem
          title="Default Carryover Strategy"
          description="How to handle unspent budget amounts"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          <SelectDropdown
            value={budget.defaultCarryStrategy}
            onChange={(value) => {
              updateBudget({ defaultCarryStrategy: value as any })
              saveSettings('Default carryover strategy updated')
            }}
            options={[
              { value: 'carryNone', label: 'No carryover' },
              { value: 'carryUnspent', label: 'Carry unspent amounts' },
              { value: 'carryOverspend', label: 'Carry overspent amounts' }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="Budget Period"
          description="Default budgeting timeframe"
          icon={<Calendar className="w-4 h-4" />}
        >
          <SelectDropdown
            value={budget.budgetPeriod}
            onChange={(value) => {
              updateBudget({ budgetPeriod: value as any })
              saveSettings('Budget period updated')
            }}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'custom', label: 'Custom', disabled: true }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="Warning Threshold"
          description="Show warnings when spending reaches this percentage"
          icon={<AlertTriangle className="w-4 h-4" />}
        >
          <Slider
            value={budget.warningThreshold}
            onChange={(value) => {
              updateBudget({ warningThreshold: value })
              saveSettings('Warning threshold updated')
            }}
            min={50}
            max={95}
            step={5}
            suffix="%"
          />
        </SettingsItem>

        <SettingsItem
          title="Auto-Create Budgets"
          description="Automatically create budgets for new categories"
          icon={<Zap className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={budget.autoCreateBudgets}
            onChange={(checked) => {
              updateBudget({ autoCreateBudgets: checked })
              saveSettings('Auto-create budgets updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Default Account"
          description="Default account for new transactions"
          icon={<CreditCard className="w-4 h-4" />}
        >
          <SelectDropdown
            value={budget.defaultAccountId || ''}
            onChange={(value) => {
              updateBudget({ defaultAccountId: value || undefined })
              saveSettings('Default account updated')
            }}
            options={[
              { value: '', label: 'No default' },
              ...accounts.map(account => ({
                value: account.id,
                label: account.name
              }))
            ]}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Transaction Settings */}
      <SettingsSection
        title="Transaction Settings"
        description="Configure transaction handling and processing"
        icon={<CreditCard className="w-5 h-5 text-indigo-600" />}
        isExpanded={expandedSection === 'Transaction Settings'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('transaction') : false}
      >
        <SettingsItem
          title="Auto-Categorization"
          description="Automatically categorize transactions using rules"
          icon={<Zap className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={transaction.autoCategorization}
            onChange={(checked) => {
              updateTransaction({ autoCategorization: checked })
              saveSettings('Auto-categorization updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Duplicate Detection"
          description="Sensitivity for detecting duplicate transactions"
          icon={<CheckCircle className="w-4 h-4" />}
        >
          <SelectDropdown
            value={transaction.duplicateDetectionSensitivity}
            onChange={(value) => {
              updateTransaction({ duplicateDetectionSensitivity: value as any })
              saveSettings('Duplicate detection updated')
            }}
            options={[
              { value: 'low', label: 'Low sensitivity' },
              { value: 'medium', label: 'Medium sensitivity' },
              { value: 'high', label: 'High sensitivity' }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="Default Transaction Notes"
          description="Default note text for new transactions"
          icon={<FileText className="w-4 h-4" />}
        >
          <input
            type="text"
            value={transaction.defaultTransactionNotes}
            onChange={(e) => updateTransaction({ defaultTransactionNotes: e.target.value })}
            placeholder="e.g., Added via mobile app"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </SettingsItem>

        <SettingsItem
          title="Receipt Scanning"
          description="Scan receipts to create transactions"
          icon={<ScanLine className="w-4 h-4" />}
          badge="Premium"
          disabled={profile.subscriptionStatus === 'free'}
        >
          <ToggleSwitch
            checked={transaction.receiptScanning}
            onChange={(checked) => {
              updateTransaction({ receiptScanning: checked })
              saveSettings('Receipt scanning updated')
            }}
            disabled={profile.subscriptionStatus === 'free'}
          />
        </SettingsItem>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="space-y-3">
            <button
              onClick={() => setShowRulesManager(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Manage Auto-Categorization Rules
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Create rules to automatically categorize transactions based on description, merchant, or amount
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Data & Backup */}
      <SettingsSection
        title="Data & Backup"
        description="Manage your data storage and backup settings"
        icon={<Database className="w-5 h-5 text-cyan-600" />}
        isExpanded={expandedSection === 'Data & Backup'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('data') : false}
      >
        <SettingsItem
          title="Auto-Backup"
          description="Automatically backup your data"
          icon={<Cloud className="w-4 h-4" />}
          badge="Premium"
          disabled={profile.subscriptionStatus === 'free'}
        >
          <ToggleSwitch
            checked={data.autoBackup}
            onChange={(checked) => {
              updateData({ autoBackup: checked })
              saveSettings('Auto-backup updated')
            }}
            disabled={profile.subscriptionStatus === 'free'}
          />
        </SettingsItem>

        {data.autoBackup && (
          <SettingsItem
            title="Backup Frequency"
            description="How often to create backups"
            icon={<Clock className="w-4 h-4" />}
          >
            <SelectDropdown
              value={data.backupFrequency}
              onChange={(value) => {
                updateData({ backupFrequency: value as any })
                saveSettings('Backup frequency updated')
              }}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' }
              ]}
            />
          </SettingsItem>
        )}

        <SettingsItem
          title="Export Format"
          description="Default format for data exports"
          icon={<Download className="w-4 h-4" />}
        >
          <SelectDropdown
            value={data.exportFormat}
            onChange={(value) => {
              updateData({ exportFormat: value as any })
              saveSettings('Export format updated')
            }}
            options={[
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
              { value: 'excel', label: 'Excel (Premium)', disabled: profile.subscriptionStatus === 'free' }
            ]}
          />
        </SettingsItem>

        <SettingsItem
          title="Cloud Sync"
          description="Sync data across devices"
          icon={<Cloud className="w-4 h-4" />}
          badge="Coming Soon"
          disabled
        >
          <ToggleSwitch
            checked={data.cloudSync}
            onChange={(checked) => updateData({ cloudSync: checked })}
            disabled
          />
        </SettingsItem>

        <SettingsItem
          title="Data Retention"
          description="How long to keep transaction data"
          icon={<HardDrive className="w-4 h-4" />}
        >
          <SelectDropdown
            value={data.dataRetentionPeriod.toString()}
            onChange={(value) => {
              updateData({ dataRetentionPeriod: parseInt(value) })
              saveSettings('Data retention updated')
            }}
            options={[
              { value: '12', label: '1 year' },
              { value: '24', label: '2 years' },
              { value: '36', label: '3 years' },
              { value: '60', label: '5 years' },
              { value: '0', label: 'Keep forever' }
            ]}
          />
        </SettingsItem>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleExportData}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
              <button
                onClick={() => setShowDataImport(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import Data
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCreateBackup}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Cloud className="w-4 h-4" />
                Create Backup
              </button>
              <button
                onClick={() => setShowBackupManager(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Manage Backups
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleClearCache}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache ({cacheInfo.size})
              </button>
              <button
                onClick={handleShowCacheInfo}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <HardDrive className="w-4 h-4" />
                Cache Info
              </button>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Advanced Settings */}
      <SettingsSection
        title="Advanced Settings"
        description="Developer options and experimental features"
        icon={<SettingsIcon className="w-5 h-5 text-gray-600" />}
        isExpanded={expandedSection === 'Advanced Settings'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('advanced') : false}
      >
        <SettingsItem
          title="Developer Mode"
          description="Enable developer tools and debugging"
          icon={<Bug className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={advanced.developerMode}
            onChange={(checked) => {
              updateAdvanced({ developerMode: checked })
              saveSettings('Developer mode updated')
            }}
          />
        </SettingsItem>

        {advanced.developerMode && (
          <SettingsItem
            title="Debug Mode"
            description="Show detailed error messages and logs"
            icon={<Bug className="w-4 h-4" />}
          >
            <ToggleSwitch
              checked={advanced.debugMode}
              onChange={(checked) => {
                updateAdvanced({ debugMode: checked })
                saveSettings('Debug mode updated')
              }}
            />
          </SettingsItem>
        )}

        <SettingsItem
          title="Performance Mode"
          description="Optimize app performance"
          icon={<Cpu className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={advanced.performanceMode}
            onChange={(checked) => {
              updateAdvanced({ performanceMode: checked })
              saveSettings('Performance mode updated')
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Cache Size"
          description="Amount of data to cache for faster performance"
          icon={<HardDrive className="w-4 h-4" />}
        >
          <Slider
            value={advanced.cacheSize}
            onChange={(value) => {
              updateAdvanced({ cacheSize: value })
              saveSettings('Cache size updated')
            }}
            min={50}
            max={500}
            step={25}
            suffix=" MB"
          />
        </SettingsItem>

        <SettingsItem
          title="Experimental Features"
          description="Enable experimental and beta features"
          icon={<Zap className="w-4 h-4" />}
        >
          <ToggleSwitch
            checked={advanced.experimentalFeatures}
            onChange={(checked) => {
              updateAdvanced({ experimentalFeatures: checked })
              saveSettings('Experimental features updated')
            }}
          />
        </SettingsItem>
      </SettingsSection>

      {/* About & Support */}
      <SettingsSection
        title="About & Support"
        description="App information, help, and support options"
        icon={<Info className="w-5 h-5 text-blue-600" />}
        isExpanded={expandedSection === 'About & Support'}
        onToggle={handleSectionToggle}
        searchHighlight={searchTerm ? filteredSections.includes('about') : false}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Kite Personal Finance Manager
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Version 1.0.0
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toast.info('Help center coming soon')}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Help Center
            </button>
            
            <button
              onClick={() => toast.info('Contact support coming soon')}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Contact Support
            </button>
            
            <button
              onClick={() => toast.info('Terms of service coming soon')}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Terms & Privacy
            </button>
            
            <button
              onClick={() => toast.info('Rating feature coming soon')}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Heart className="w-4 h-4" />
              Rate App
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <div className="card border-red-200 dark:border-red-800">
        <div className="p-4 border-b border-red-200 dark:border-red-800">
          <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            These actions cannot be undone. Please be careful.
          </p>
        </div>
        
        <div className="p-4 space-y-3">
          <button
            onClick={handleResetData}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
              confirmReset
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {confirmReset ? 'Confirm Reset All Data' : 'Reset All Data'}
          </button>
          {confirmReset && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              Click again to confirm. This will delete all your data and restore demo data.
            </p>
          )}
        </div>
      </div>

      {/* Categories Manager Modal */}
      {showCategoriesManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <CategoriesManager onClose={() => setShowCategoriesManager(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Data Import Modal */}
      {showDataImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <DataImport onClose={() => setShowDataImport(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Rules Manager Modal */}
      {showRulesManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <RulesManager onClose={() => setShowRulesManager(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Backup Manager Modal */}
      {showBackupManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <BackupManager onClose={() => setShowBackupManager(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Profile Editor Modal */}
      {showProfileEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <ProfileEditor onClose={() => setShowProfileEditor(false)} />
            </div>
          </div>
        </div>
      )}

      {/* PIN Entry Modal */}
      <PinEntryModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSubmit={async (pin) => {
          const success = await securityService.setPin(pin)
          if (success) {
            toast.success('PIN set', 'Security PIN has been configured')
          }
        }}
        title="Set Security PIN"
        mode="create"
        minLength={4}
        maxLength={8}
      />
    </div>
  )
}

export default SettingsPage