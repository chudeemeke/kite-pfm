import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, Menu, Download, Upload, Eye, EyeOff, HelpCircle, Info, X, Database, FileText, RefreshCw } from 'lucide-react'
import { useUIStore, useTransactionsStore, useAccountsStore, useBudgetsStore, useSettingsStore } from '@/stores'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import BackupManager from '../BackupManager'
import DataImport from '../DataImport'
import ConfirmDialog from '../ConfirmDialog'

/**
 * Top navigation bar component for the Kite finance application.
 * 
 * Provides the main application header with branding, theme toggle, and a comprehensive
 * settings menu. The menu includes data management features like export/import, backup/restore,
 * privacy controls, and application information.
 * 
 * @returns JSX element representing the top navigation bar
 * 
 * @example
 * ```tsx
 * import TopBar from '@/components/Layout/TopBar'
 * 
 * function Layout() {
 *   return (
 *     <div>
 *       <TopBar />
 *       <main>{/* page content *}</main>
 *     </div>
 *   )
 * }
 * ```
 * 
 * Features:
 * - **Theme Toggle**: Switch between light and dark modes
 * - **Data Export**: Download all app data as JSON
 * - **Data Import**: Import transactions from CSV or JSON files
 * - **Backup & Restore**: Manage data backups with encryption
 * - **Privacy Mode**: Hide sensitive financial information
 * - **Cache Management**: Clear local storage and reset app
 * - **About Dialog**: View app version and feature information
 * 
 * @remarks
 * - Uses click-outside detection to close the dropdown menu
 * - Integrates with multiple Zustand stores for state management
 * - Supports keyboard navigation (ESC key to close modals)
 * - Fixed positioning with mobile-safe area support
 * - Responsive design optimized for mobile devices
 */
const TopBar = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useUIStore()
  const settingsStore = useSettingsStore()
  const { privacy, updatePrivacy } = settingsStore
  const privacyMode = privacy?.privacyMode || false
  
  const [showMenu, setShowMenu] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])
  
  const handleExportData = () => {
    setShowMenu(false)
    const transactions = useTransactionsStore.getState().transactions
    const accounts = useAccountsStore.getState().accounts
    const budgets = useBudgetsStore.getState().budgets
    const settingsData = useSettingsStore.getState()
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        transactions,
        accounts,
        budgets,
        settings: settingsData
      }
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kite-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleClearCache = () => {
    // Clear localStorage data
    localStorage.clear()
    setShowClearConfirm(false)
    setShowMenu(false)
    window.location.reload()
  }
  
  const menuItems = [
    {
      icon: Download,
      label: 'Export Data',
      onClick: handleExportData,
      description: 'Download all data as JSON'
    },
    {
      icon: Upload,
      label: 'Import Data',
      onClick: () => {
        setShowMenu(false)
        setShowImport(true)
      },
      description: 'Import from CSV or JSON'
    },
    {
      icon: Database,
      label: 'Backup & Restore',
      onClick: () => {
        setShowMenu(false)
        setShowBackup(true)
      },
      description: 'Manage data backups'
    },
    {
      divider: true
    },
    {
      icon: privacyMode ? EyeOff : Eye,
      label: privacyMode ? 'Disable Privacy Mode' : 'Enable Privacy Mode',
      onClick: () => {
        updatePrivacy({ privacyMode: !privacyMode })
        setShowMenu(false)
      },
      description: privacyMode ? 'Show sensitive data' : 'Hide sensitive data'
    },
    {
      icon: RefreshCw,
      label: 'Clear Cache & Reset',
      onClick: () => {
        setShowMenu(false)
        setShowClearConfirm(true)
      },
      description: 'Clear all local data',
      danger: true
    },
    {
      divider: true
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      onClick: () => {
        setShowMenu(false)
        navigate('/settings')
      },
      description: 'Get help and support'
    },
    {
      icon: Info,
      label: 'About Kite',
      onClick: () => {
        setShowMenu(false)
        setShowAbout(true)
      },
      description: 'Version and info'
    }
  ]
  
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 top-bar-safe">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* UK Flag Badge */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-red-600 flex items-center justify-center text-white text-sm font-bold">
              🇬🇧
            </div>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Kite
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Personal Finance
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
                'transition-colors duration-200'
              )}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            
            {/* Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
                  'transition-colors duration-200',
                  showMenu && 'bg-gray-200 dark:bg-gray-600'
                )}
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {menuItems.map((item, index) => {
                    if (item.divider) {
                      return <div key={index} className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={item.onClick}
                        className={cn(
                          'w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left',
                          item.danger && 'hover:bg-red-50 dark:hover:bg-red-900/20'
                        )}
                      >
                        {item.icon && <item.icon className={cn(
                          'w-5 h-5 mt-0.5 flex-shrink-0',
                          item.danger ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
                        )} />}
                        <div className="flex-1">
                          <div className={cn(
                            'text-sm font-medium',
                            item.danger ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                          )}>
                            {item.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Backup Manager Modal */}
      {showBackup && (
        <BackupManager onClose={() => setShowBackup(false)} />
      )}
      
      {/* Import Modal */}
      {showImport && (
        <DataImport onClose={() => setShowImport(false)} />
      )}
      
      {/* Clear Cache Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearCache}
        title="Clear Cache & Reset"
        message="This will clear all local data including transactions, accounts, budgets, and settings. This action cannot be undone. Are you sure?"
        confirmText="Clear All Data"
        variant="danger"
      />
      
      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                About Kite
              </h3>
              <button
                onClick={() => setShowAbout(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Kite Finance
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Version 1.0.0
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Features</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    Smart budgeting with carryover • Auto-categorization • Multi-currency support • Data export/import • Privacy mode
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Storage</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    All data is stored locally on your device using IndexedDB
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Privacy</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    No data leaves your device. Complete privacy and security.
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowAbout(false)}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TopBar