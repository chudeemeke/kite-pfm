import React from 'react'
import { useSettingsStore, useUIStore, toast } from '@/stores'
import { 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  DollarSign, 
  Settings,
  X
} from 'lucide-react'
import { ToggleSwitch } from './ToggleSwitch'

interface QuickSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({ isOpen, onClose }) => {
  const { 
    appearance, 
    notifications, 
    privacy, 
    updateAppearance, 
    updateNotifications, 
    updatePrivacy 
  } = useSettingsStore()
  
  const { setTheme } = useUIStore()

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateAppearance({ theme })
    setTheme(theme)
    toast.success('Theme updated')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Theme Toggle */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              {appearance.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Theme
            </h3>
            <div className="flex gap-2">
              {['light', 'dark', 'system'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme as 'light' | 'dark' | 'system')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    appearance.theme === theme 
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Budget Alerts
                </span>
              </div>
              <ToggleSwitch
                checked={notifications.budgetAlerts}
                onChange={(checked) => {
                  updateNotifications({ budgetAlerts: checked })
                  toast.success('Budget alerts updated')
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Privacy Mode
                </span>
              </div>
              <ToggleSwitch
                checked={privacy.privacyMode}
                onChange={(checked) => {
                  updatePrivacy({ privacyMode: checked })
                  toast.success('Privacy mode updated')
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Show Balance
                </span>
              </div>
              <ToggleSwitch
                checked={appearance.showBalance}
                onChange={(checked) => {
                  updateAppearance({ showBalance: checked })
                  toast.success('Balance visibility updated')
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Sound Effects
                </span>
              </div>
              <ToggleSwitch
                checked={notifications.soundEffects}
                onChange={(checked) => {
                  updateNotifications({ soundEffects: checked })
                  toast.success('Sound effects updated')
                }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Quick Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Theme:</span>
                <span className="text-gray-900 dark:text-gray-100 capitalize">
                  {appearance.theme}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Currency:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Notifications:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {notifications.budgetAlerts ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}