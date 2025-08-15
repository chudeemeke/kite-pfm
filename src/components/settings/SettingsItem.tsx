import React from 'react'

interface SettingsItemProps {
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  disabled?: boolean
  badge?: string
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  title,
  description,
  icon,
  children,
  disabled = false,
  badge
}) => {
  return (
    <div className={`p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
      disabled ? 'opacity-50 pointer-events-none' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {icon && (
            <div className="text-gray-500 dark:text-gray-400">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {title}
              </p>
              {badge && (
                <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="ml-4">
          {children}
        </div>
      </div>
    </div>
  )
}