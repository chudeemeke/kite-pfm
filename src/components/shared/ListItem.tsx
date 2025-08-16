import { ReactNode } from 'react'

/**
 * Universal ListItem Component
 * Ensures perfect vertical alignment across all list views
 * Based on 8px grid system for Apple-level design quality
 */

interface ListItemProps {
  // Selection
  selectable?: boolean
  selected?: boolean
  onSelectChange?: (selected: boolean) => void
  
  // Main content
  icon?: ReactNode
  title: string
  subtitle?: string
  metadata?: string
  
  // Right side content
  value?: string | ReactNode
  valueColor?: 'default' | 'success' | 'danger' | 'warning'
  
  // Actions
  actions?: ReactNode
  
  // Interaction
  onClick?: () => void
  href?: string
  
  // Styling
  variant?: 'default' | 'compact' | 'large'
  className?: string
  disabled?: boolean
}

export const ListItem = ({
  selectable = false,
  selected = false,
  onSelectChange,
  icon,
  title,
  subtitle,
  metadata,
  value,
  valueColor = 'default',
  actions,
  onClick,
  href,
  variant = 'default',
  className = '',
  disabled = false
}: ListItemProps) => {
  // Height based on variant
  const heightClass = variant === 'compact' ? 'h-12' : variant === 'large' ? 'h-20' : 'h-16'
  const paddingClass = variant === 'compact' ? 'px-3 py-2' : 'px-4 py-3'
  
  // Value color classes
  const valueColorClasses = {
    default: 'text-gray-900 dark:text-gray-100',
    success: 'text-success-600 dark:text-success-400',
    danger: 'text-danger-600 dark:text-danger-400',
    warning: 'text-warning-600 dark:text-warning-400'
  }
  
  // Handle click with proper event handling
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return
    
    // Don't trigger onClick if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button, input, select, a')) {
      return
    }
    
    if (onClick) {
      onClick()
    }
  }
  
  const content = (
    <div
      className={`
        list-item-grid
        ${heightClass}
        ${paddingClass}
        ${disabled ? 'opacity-50 cursor-not-allowed' : onClick || href ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}
        ${selected ? 'bg-primary-50 dark:bg-primary-900/20 selected' : ''}
        transition-colors duration-200
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Selection Checkbox - smaller and less prominent */}
      {selectable && (
        <div className="list-item-grid__checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation()
              onSelectChange?.(e.target.checked)
            }}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 
                     text-primary-600 focus:ring-primary-500 focus:ring-1"
            disabled={disabled}
          />
        </div>
      )}
      
      {/* Icon */}
      {icon && (
        <div className="flex items-center justify-center w-8 h-8">
          <div className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400">
            {icon}
          </div>
        </div>
      )}
      
      {/* Main Content - gets maximum space */}
      <div className="list-item-grid__content min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {metadata && (
            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-auto">
              {metadata}
            </span>
          )}
        </div>
        
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Value */}
      {value && (
        <div className={`list-item-grid__amount ${valueColorClasses[valueColor]} font-medium`}>
          {typeof value === 'string' ? (
            <span className="tabular-nums">{value}</span>
          ) : (
            value
          )}
        </div>
      )}
      
      {/* Actions */}
      {actions && (
        <div className="list-item-grid__actions">
          {actions}
        </div>
      )}
    </div>
  )
  
  // Wrap in anchor tag if href is provided
  if (href) {
    return (
      <a href={href} className="block no-underline">
        {content}
      </a>
    )
  }
  
  return content
}

/**
 * ListItem Action Button Component
 * Consistent action buttons for list items
 */
interface ListItemActionProps {
  icon: ReactNode
  onClick: () => void
  variant?: 'default' | 'danger' | 'success'
  label?: string
  disabled?: boolean
}

export const ListItemAction = ({
  icon,
  onClick,
  variant = 'default',
  label,
  disabled = false
}: ListItemActionProps) => {
  const variantClasses = {
    default: 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400',
    danger: 'hover:bg-red-100 dark:hover:bg-red-900/20 text-red-400',
    success: 'hover:bg-green-100 dark:hover:bg-green-900/20 text-green-400'
  }
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`
        touch-target
        p-2 rounded-lg
        ${variantClasses[variant]}
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title={label}
      disabled={disabled}
    >
      <div className="w-4 h-4">
        {icon}
      </div>
    </button>
  )
}

/**
 * ListItem Group Component
 * Groups list items with consistent spacing
 */
interface ListItemGroupProps {
  children: ReactNode
  title?: string
  className?: string
}

export const ListItemGroup = ({ children, title, className = '' }: ListItemGroupProps) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
      )}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </div>
    </div>
  )
}

export default ListItem