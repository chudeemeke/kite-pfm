import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Activity, 
  PieChart, 
  Target,
  CreditCard, 
  TrendingUp, 
  Settings,
  Plus 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import QuickAddModal from '../QuickAddModal'

/**
 * Bottom navigation component providing the main navigation interface for the Kite app.
 * 
 * Features a mobile-optimized tab bar with six main sections and a prominent floating
 * action button for quick data entry. The navigation includes visual indicators for
 * the active route and smooth hover transitions.
 * 
 * @returns JSX element representing the bottom navigation bar
 * 
 * @example
 * ```tsx
 * import BottomNav from '@/components/Layout/BottomNav'
 * 
 * function Layout() {
 *   return (
 *     <div>
 *       <main>{/* page content *}</main>
 *       <BottomNav />
 *     </div>
 *   )
 * }
 * ```
 * 
 * Navigation Sections:
 * - **Home**: Dashboard and overview
 * - **Activity**: Transaction history and management
 * - **Budgets**: Budget tracking and management
 * - **Accounts**: Account management
 * - **Insights**: Financial analytics and reports
 * - **Settings**: App configuration and preferences
 * 
 * @remarks
 * - Floating Action Button (FAB) positioned in center for quick add functionality
 * - Uses React Router for navigation state and routing
 * - Visual feedback with active state indicators and hover effects
 * - Fixed positioning at bottom with mobile-safe area support
 * - Integrates with QuickAddModal for rapid data entry
 * - Responsive design optimized for touch interaction
 */
const BottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/tx', icon: Activity, label: 'Activity' },
    { path: '/budgets', icon: PieChart, label: 'Budgets' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/accounts', icon: CreditCard, label: 'Accounts' },
    { path: '/insights', icon: TrendingUp, label: 'Insights' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ]
  
  const handleAddClick = () => {
    setShowQuickAdd(true)
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 bottom-nav-safe">
      <div className="max-w-lg mx-auto px-2 py-2">
        <div className="flex items-center justify-around relative">
          {/* First row of nav items */}
          {navItems.slice(0, 4).map((item) => (
            <NavItem
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.path || 
                       (item.path === '/goals' && location.pathname.startsWith('/goals'))}
              onClick={() => navigate(item.path)}
            />
          ))}
          
          {/* Floating Add Button */}
          <button
            onClick={handleAddClick}
            className={cn(
              'w-12 h-12 rounded-full',
              'bg-gradient-to-r from-primary-500 to-primary-600',
              'hover:from-primary-600 hover:to-primary-700',
              'flex items-center justify-center',
              'shadow-lg hover:shadow-xl',
              'transform active:scale-95 transition-transform duration-150',
              'absolute right-4 -top-6',
              'focus:outline-none focus:ring-4 focus:ring-primary-500/30'
            )}
            aria-label="Quick Add"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
          
          {/* Remaining nav items */}
          {navItems.slice(4).map((item) => (
            <NavItem
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
      </div>
      
      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />
    </nav>
  )
}

/**
 * Props for the NavItem component
 */
interface NavItemProps {
  /** The route path this navigation item represents */
  path: string
  /** Lucide React icon component to display */
  icon: React.ComponentType<{ className?: string }>
  /** Display label for the navigation item */
  label: string
  /** Whether this navigation item is currently active */
  isActive: boolean
  /** Click handler function for navigation */
  onClick: () => void
}

/**
 * Individual navigation item component used within the bottom navigation bar.
 * 
 * Renders a single navigation button with an icon, label, and active state indicator.
 * Provides visual feedback for user interaction and accessibility features.
 * 
 * @param props - The component props
 * @param props.icon - Icon component to display (from lucide-react)
 * @param props.label - Text label to display below the icon
 * @param props.isActive - Whether this item represents the current route
 * @param props.onClick - Function called when the item is clicked
 * @returns JSX element representing a navigation item
 * 
 * @example
 * ```tsx
 * import { Home } from 'lucide-react'
 * 
 * <NavItem
 *   path="/"
 *   icon={Home}
 *   label="Home"
 *   isActive={true}
 *   onClick={() => navigate('/')}
 * />
 * ```
 * 
 * @remarks
 * - Shows active state with color changes and scale animation
 * - Includes an active indicator dot below the label
 * - Supports hover states for better user feedback
 * - Optimized for touch interaction on mobile devices
 * - Accessible with proper ARIA labels and semantic button element
 */
const NavItem = ({ icon: Icon, label, isActive, onClick }: NavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-2 rounded-lg transition-all',
        'min-w-0 flex-1 max-w-16',
        isActive 
          ? 'text-primary-600 dark:text-primary-400' 
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
      )}
      aria-label={label}
    >
      <Icon className={cn(
        'w-5 h-5 mb-1 transition-transform',
        isActive && 'scale-110'
      )} />
      <span className={cn(
        'text-xs font-medium truncate w-full text-center',
        isActive && 'font-semibold'
      )}>
        {label}
      </span>
      
      {/* Active indicator dot */}
      {isActive && (
        <div className="w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full mt-1" />
      )}
    </button>
  )
}

export default BottomNav