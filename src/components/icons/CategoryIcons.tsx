/**
 * Custom Category Icons
 * Beautiful, unique SVG icons for categories
 * Professional design without emojis
 */

import React from 'react'

interface IconProps {
  size?: number
  color?: string
  className?: string
}

// Salary Icon - Upward trending chart with currency
export const SalaryIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M3 3v18h18" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M7 14l4-4 3 3 5-5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="19" cy="8" r="2" fill={color} opacity="0.3"/>
  </svg>
)

// Freelance Icon - Laptop with creative spark
export const FreelanceIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M3 14h18" stroke={color} strokeWidth="2"/>
    <path d="M8 20h8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path 
      d="M12 4l1.5 2L16 5.5 14 8l.5 2.5L12 9l-2.5 1.5L10 8 8 5.5 10.5 6z" 
      fill={color} 
      opacity="0.3"
    />
  </svg>
)

// Investment Icon - Growth arrow with compound effect
export const InvestmentIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M4 20l4-8 4 4 8-12" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="20" cy="4" r="2" fill={color}/>
    <circle cx="12" cy="12" r="1.5" fill={color} opacity="0.5"/>
    <circle cx="8" cy="12" r="1.5" fill={color} opacity="0.3"/>
  </svg>
)

// Food & Dining Icon - Minimalist fork and plate
export const FoodIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <path d="M8 12v-4m0 0v-2m0 2h1.5m-1.5 0h-1.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 6v6l-1 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Housing Icon - Modern house silhouette
export const HousingIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M3 12l9-9 9 9M5 10v10h14V10" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <rect x="9" y="14" width="6" height="6" fill={color} opacity="0.3"/>
  </svg>
)

// Transport Icon - Streamlined vehicle
export const TransportIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M5 15h14l-2-6H7l-2 6z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
    <circle cx="7" cy="18" r="2" stroke={color} strokeWidth="2"/>
    <circle cx="17" cy="18" r="2" stroke={color} strokeWidth="2"/>
    <path d="M7 9l2-3h6l2 3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Healthcare Icon - Medical cross with shield
export const HealthcareIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M12 3c-4 0-7 2-7 5v5c0 5 7 8 7 8s7-3 7-8v-5c0-3-3-5-7-5z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
    <path d="M12 8v8m-4-4h8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Entertainment Icon - Play button with sparkle
export const EntertainmentIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <path d="M10 8l6 4-6 4V8z" fill={color} opacity="0.3" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

// Shopping Icon - Modern shopping bag
export const ShoppingIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M5 8h14l-1 10H6L5 8z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
    <path d="M9 8V6c0-1.5 1.5-3 3-3s3 1.5 3 3v2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Utilities Icon - Power plug with lightning
export const UtilitiesIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M13 2L7 14h5l-1 8 7-12h-5l1-8z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={color} opacity="0.2"/>
  </svg>
)

// Education Icon - Graduation cap with book
export const EducationIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3L2 9l10 6 10-6-10-6z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 9v6c0 2 4 4 10 4s10-2 10-4V9" stroke={color} strokeWidth="2" opacity="0.5"/>
    <path d="M22 9v8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Banking Icon - Bank building with columns
export const BankingIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 21h18M3 10h18M12 3L3 10h18L12 3z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M6 14v4m4-4v4m4-4v4m4-4v4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Generic Category Icon - Tag shape
export const CategoryIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M12 2L3 7v10c0 5 9 7 9 7s9-2 9-7V7l-9-5z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill={color} opacity="0.3"/>
  </svg>
)

// Icon mapping for dynamic usage
export const categoryIcons: Record<string, React.FC<IconProps>> = {
  salary: SalaryIcon,
  freelance: FreelanceIcon,
  investment: InvestmentIcon,
  investments: InvestmentIcon,
  food: FoodIcon,
  'food & dining': FoodIcon,
  housing: HousingIcon,
  transport: TransportIcon,
  healthcare: HealthcareIcon,
  entertainment: EntertainmentIcon,
  shopping: ShoppingIcon,
  utilities: UtilitiesIcon,
  'utilities & bills': UtilitiesIcon,
  education: EducationIcon,
  banking: BankingIcon,
  'banking & fees': BankingIcon,
  default: CategoryIcon
}

// Helper function to get icon by name
export const getCategoryIcon = (name: string): React.FC<IconProps> => {
  const key = name.toLowerCase().replace(/[^\w\s&]/g, '')
  return categoryIcons[key] || CategoryIcon
}

// Component to render category icon by name
export const CategoryIconRenderer = ({ 
  category, 
  size = 24, 
  color,
  className = '' 
}: { 
  category: string
  size?: number
  color?: string
  className?: string 
}) => {
  const Icon = getCategoryIcon(category)
  return <Icon size={size} color={color} className={className} />
}

export default CategoryIconRenderer