import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface SettingsSectionProps {
  title: string
  description?: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
  searchHighlight?: boolean
  isExpanded?: boolean
  onToggle?: (title: string) => void
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  children,
  defaultExpanded = false,
  searchHighlight = false,
  isExpanded: controlledExpanded,
  onToggle
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  return (
    <div className={`card overflow-hidden transition-all duration-200 ${
      searchHighlight ? 'ring-2 ring-primary-500/50 bg-primary-50/50 dark:bg-primary-900/10' : ''
    }`}>
      <button
        onClick={() => {
          if (onToggle) {
            onToggle(title)
          } else {
            setInternalExpanded(!internalExpanded)
          }
        }}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="transition-transform duration-200">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      <div className={`transition-all duration-200 ease-in-out ${
        isExpanded 
          ? 'max-h-[2000px] opacity-100' 
          : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      </div>
    </div>
  )
}