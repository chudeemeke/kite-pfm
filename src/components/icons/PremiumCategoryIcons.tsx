/**
 * Premium Category Icons
 * Emoji-quality beautiful icons with gradients, shadows, and depth
 * Professional design that matches or exceeds emoji visual quality
 */

import React from 'react'

interface IconProps {
  size?: number
  className?: string
}

// Salary Icon - Premium 3D money stack with shine
export const SalaryIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="salary-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
      <filter id="salary-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
      </filter>
      <radialGradient id="salary-shine">
        <stop offset="0%" stopColor="#86efac" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#34d399" stopOpacity="0"/>
      </radialGradient>
    </defs>
    
    <g filter="url(#salary-shadow)">
      <rect x="4" y="12" width="16" height="6" rx="1" fill="url(#salary-gradient)"/>
      <rect x="5" y="8" width="14" height="5" rx="1" fill="url(#salary-gradient)" opacity="0.8"/>
      <rect x="6" y="4" width="12" height="5" rx="1" fill="url(#salary-gradient)" opacity="0.6"/>
      <circle cx="12" cy="10" r="3" fill="url(#salary-shine)"/>
    </g>
    <text x="12" y="16" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">£</text>
  </svg>
)

// Food Icon - Delicious plate with steam
export const FoodIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="food-plate" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <radialGradient id="food-center">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#fb923c" />
      </radialGradient>
      <filter id="food-shadow">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
        <feOffset dx="0" dy="2"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3"/>
        </feComponentTransfer>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g filter="url(#food-shadow)">
      <ellipse cx="12" cy="16" rx="9" ry="3" fill="url(#food-plate)"/>
      <circle cx="12" cy="14" r="7" fill="url(#food-center)"/>
      <circle cx="12" cy="14" r="5" fill="#fef3c7"/>
      
      {/* Steam animation */}
      <path d="M9 10c0-1 1-2 1-3" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <animate attributeName="d" values="M9 10c0-1 1-2 1-3;M9 10c0-1 0-2 1-3;M9 10c0-1 1-2 1-3" dur="3s" repeatCount="indefinite"/>
      </path>
      <path d="M12 9c0-1 -1-2 0-3" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <animate attributeName="d" values="M12 9c0-1 -1-2 0-3;M12 9c0-1 1-2 0-3;M12 9c0-1 -1-2 0-3" dur="3s" repeatCount="indefinite"/>
      </path>
      <path d="M15 10c0-1 -1-2 -1-3" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <animate attributeName="d" values="M15 10c0-1 -1-2 -1-3;M15 10c0-1 0-2 -1-3;M15 10c0-1 -1-2 -1-3" dur="3s" repeatCount="indefinite"/>
      </path>
    </g>
  </svg>
)

// Housing Icon - Beautiful 3D house with roof gradient
export const HousingIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="house-roof" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
      <linearGradient id="house-wall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fde68a" />
      </linearGradient>
      <linearGradient id="house-door" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <filter id="house-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.25"/>
      </filter>
    </defs>
    
    <g filter="url(#house-shadow)">
      {/* Roof */}
      <path d="M3 10l9-7 9 7v-2l-9-6-9 6z" fill="url(#house-roof)"/>
      {/* Chimney */}
      <rect x="16" y="5" width="2" height="4" fill="#78350f"/>
      {/* Walls */}
      <rect x="5" y="10" width="14" height="10" fill="url(#house-wall)"/>
      {/* Door */}
      <rect x="10" y="14" width="4" height="6" fill="url(#house-door)"/>
      {/* Windows */}
      <rect x="6" y="12" width="3" height="3" fill="#60a5fa" opacity="0.8"/>
      <rect x="15" y="12" width="3" height="3" fill="#60a5fa" opacity="0.8"/>
      {/* Window shine */}
      <path d="M6 12l3 3" stroke="white" strokeWidth="0.5" opacity="0.6"/>
      <path d="M15 12l3 3" stroke="white" strokeWidth="0.5" opacity="0.6"/>
    </g>
  </svg>
)

// Transport Icon - Sleek modern car with reflection
export const TransportIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="car-body" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
      <linearGradient id="car-window" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#7dd3fc" />
      </linearGradient>
      <radialGradient id="car-wheel">
        <stop offset="0%" stopColor="#4b5563" />
        <stop offset="100%" stopColor="#1f2937" />
      </radialGradient>
      <filter id="car-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1" floodOpacity="0.3"/>
      </filter>
    </defs>
    
    <g filter="url(#car-shadow)">
      {/* Body */}
      <path d="M4 13h16l-2-5h-3l-2-2h-2l-2 2h-3z" fill="url(#car-body)"/>
      <rect x="3" y="13" width="18" height="4" rx="1" fill="url(#car-body)"/>
      {/* Windows */}
      <path d="M8 10h3l1-1h0l1 1h3l1 2H7z" fill="url(#car-window)"/>
      {/* Wheels */}
      <circle cx="7" cy="18" r="2" fill="url(#car-wheel)"/>
      <circle cx="17" cy="18" r="2" fill="url(#car-wheel)"/>
      <circle cx="7" cy="18" r="0.8" fill="#9ca3af"/>
      <circle cx="17" cy="18" r="0.8" fill="#9ca3af"/>
      {/* Headlights */}
      <ellipse cx="20" cy="14" rx="0.8" ry="0.5" fill="#fef3c7" opacity="0.9"/>
      {/* Reflection */}
      <path d="M5 11h10" stroke="white" strokeWidth="0.5" opacity="0.4"/>
    </g>
  </svg>
)

// Healthcare Icon - Medical cross with heartbeat
export const HealthcareIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="health-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f9a8d4" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <filter id="health-glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g filter="url(#health-glow)">
      {/* Shield shape */}
      <path d="M12 3c-4 0-7 2-7 5v5c0 5 7 8 7 8s7-3 7-8v-5c0-3-3-5-7-5z" 
            fill="url(#health-bg)" opacity="0.9"/>
      {/* Cross */}
      <rect x="11" y="8" width="2" height="8" fill="white" rx="0.5"/>
      <rect x="8" y="11" width="8" height="2" fill="white" rx="0.5"/>
      {/* Heartbeat line */}
      <path d="M6 12h2l1-2 1 4 1-2h7" stroke="white" strokeWidth="0.5" opacity="0.7" strokeLinecap="round">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite"/>
      </path>
    </g>
  </svg>
)

// Shopping Icon - Shopping bag with packages
export const ShoppingIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="bag-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="100%" stopColor="#84cc16" />
      </linearGradient>
      <linearGradient id="bag-handle" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#65a30d" />
        <stop offset="100%" stopColor="#4d7c0f" />
      </linearGradient>
      <filter id="bag-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.2"/>
      </filter>
    </defs>
    
    <g filter="url(#bag-shadow)">
      {/* Bag body */}
      <path d="M5 8h14l-1 11a1 1 0 01-1 1H7a1 1 0 01-1-1L5 8z" fill="url(#bag-gradient)"/>
      {/* Handle */}
      <path d="M9 8V6c0-1.5 1.5-3 3-3s3 1.5 3 3v2" 
            stroke="url(#bag-handle)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Decorative items inside */}
      <rect x="8" y="11" width="3" height="4" fill="#fbbf24" opacity="0.7" rx="0.5"/>
      <rect x="13" y="12" width="3" height="3" fill="#f472b6" opacity="0.7" rx="0.5"/>
      <circle cx="10" cy="17" r="1.5" fill="#60a5fa" opacity="0.7"/>
    </g>
  </svg>
)

// Banking Icon - 3D Bank building with columns
export const BankingIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="bank-roof" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6b7280" />
        <stop offset="100%" stopColor="#4b5563" />
      </linearGradient>
      <linearGradient id="bank-columns" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e5e7eb" />
        <stop offset="100%" stopColor="#d1d5db" />
      </linearGradient>
      <filter id="bank-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.3"/>
      </filter>
    </defs>
    
    <g filter="url(#bank-shadow)">
      {/* Foundation */}
      <rect x="3" y="19" width="18" height="2" fill="#6b7280"/>
      {/* Roof */}
      <path d="M12 3L3 9h18L12 3z" fill="url(#bank-roof)"/>
      <rect x="3" y="9" width="18" height="2" fill="#4b5563"/>
      {/* Columns */}
      <rect x="5" y="11" width="2" height="8" fill="url(#bank-columns)"/>
      <rect x="9" y="11" width="2" height="8" fill="url(#bank-columns)"/>
      <rect x="13" y="11" width="2" height="8" fill="url(#bank-columns)"/>
      <rect x="17" y="11" width="2" height="8" fill="url(#bank-columns)"/>
      {/* Central door */}
      <rect x="10" y="14" width="4" height="5" fill="#1f2937"/>
      {/* Coin symbol */}
      <circle cx="12" cy="6" r="1.5" fill="#fbbf24"/>
      <text x="12" y="7" fontSize="2" fill="#78350f" textAnchor="middle">£</text>
    </g>
  </svg>
)

// Education Icon - Graduation cap with book
export const EducationIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="cap-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="book-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="100%" stopColor="#14b8a6" />
      </linearGradient>
      <filter id="edu-shadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
      </filter>
    </defs>
    
    <g filter="url(#edu-shadow)">
      {/* Book */}
      <rect x="7" y="14" width="10" height="7" fill="url(#book-gradient)" rx="1"/>
      <path d="M12 14v7" stroke="white" strokeWidth="0.5" opacity="0.7"/>
      {/* Graduation cap */}
      <path d="M12 3L2 9l10 6 10-6z" fill="url(#cap-gradient)"/>
      <path d="M2 9v5c0 2 4 3 10 3s10-1 10-3V9" stroke="#0f172a" strokeWidth="1.5" fill="none" opacity="0.5"/>
      {/* Tassel */}
      <line x1="22" y1="9" x2="22" y2="15" stroke="#fbbf24" strokeWidth="1.5"/>
      <circle cx="22" cy="16" r="1" fill="#fbbf24"/>
    </g>
  </svg>
)

// Entertainment Icon - Film reel with play button
export const EntertainmentIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <radialGradient id="reel-gradient">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f97316" />
      </radialGradient>
      <filter id="ent-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.25"/>
      </filter>
    </defs>
    
    <g filter="url(#ent-shadow)">
      {/* Film reel */}
      <circle cx="12" cy="12" r="9" fill="url(#reel-gradient)"/>
      <circle cx="12" cy="12" r="7" fill="#1f2937"/>
      {/* Film holes */}
      <circle cx="12" cy="6" r="1.5" fill="#374151"/>
      <circle cx="18" cy="12" r="1.5" fill="#374151"/>
      <circle cx="12" cy="18" r="1.5" fill="#374151"/>
      <circle cx="6" cy="12" r="1.5" fill="#374151"/>
      {/* Play button */}
      <path d="M10 9l5 3-5 3V9z" fill="white" opacity="0.9"/>
    </g>
  </svg>
)

// Freelance Icon - Creative palette with sparkles
export const FreelanceIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <radialGradient id="palette-gradient">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#fbbf24" />
      </radialGradient>
      <filter id="sparkle-glow">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g filter="url(#sparkle-glow)">
      {/* Palette */}
      <ellipse cx="12" cy="14" rx="8" ry="6" fill="url(#palette-gradient)"/>
      <circle cx="9" cy="11" r="1.5" fill="#ef4444"/>
      <circle cx="15" cy="11" r="1.5" fill="#3b82f6"/>
      <circle cx="9" cy="16" r="1.5" fill="#10b981"/>
      <circle cx="15" cy="16" r="1.5" fill="#8b5cf6"/>
      <ellipse cx="12" cy="14" rx="2" ry="1.5" fill="#374151" opacity="0.3"/>
      {/* Sparkles */}
      <g opacity="0.8">
        <circle cx="6" cy="6" r="0.5" fill="white">
          <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="18" cy="7" r="0.5" fill="white">
          <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="19" cy="18" r="0.5" fill="white">
          <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite"/>
        </circle>
      </g>
    </g>
  </svg>
)

// Investment Icon - Growing plant with coins
export const InvestmentIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="plant-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#84cc16" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
      <radialGradient id="coin-gradient">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fbbf24" />
      </radialGradient>
      <filter id="invest-shadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2"/>
      </filter>
    </defs>
    
    <g filter="url(#invest-shadow)">
      {/* Pot */}
      <path d="M8 18h8l-1 3H9z" fill="#92400e"/>
      {/* Soil */}
      <ellipse cx="12" cy="18" rx="4" ry="1" fill="#78350f"/>
      {/* Plant stem */}
      <path d="M12 18c0-6 -2-8 0-10s2 4 2 10" stroke="url(#plant-gradient)" strokeWidth="2" fill="none"/>
      {/* Leaves */}
      <ellipse cx="10" cy="10" rx="2" ry="3" fill="url(#plant-gradient)" transform="rotate(-30 10 10)"/>
      <ellipse cx="14" cy="11" rx="2" ry="3" fill="url(#plant-gradient)" transform="rotate(30 14 11)"/>
      <ellipse cx="12" cy="7" rx="2" ry="3" fill="url(#plant-gradient)"/>
      {/* Coins */}
      <circle cx="7" cy="16" r="2" fill="url(#coin-gradient)"/>
      <circle cx="17" cy="16" r="2" fill="url(#coin-gradient)"/>
      <text x="7" y="17" fontSize="3" fill="#92400e" textAnchor="middle">£</text>
      <text x="17" y="17" fontSize="3" fill="#92400e" textAnchor="middle">£</text>
    </g>
  </svg>
)

// Utilities Icon - Lightning bolt with power
export const UtilitiesIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="bolt-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="50%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <filter id="bolt-glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g filter="url(#bolt-glow)">
      {/* Lightning bolt */}
      <path d="M13 2L6 14h5l-1 8 8-13h-5z" fill="url(#bolt-gradient)"/>
      {/* Glow effect */}
      <path d="M13 2L6 14h5l-1 8 8-13h-5z" fill="white" opacity="0.3"/>
      {/* Energy particles */}
      <circle cx="8" cy="8" r="0.5" fill="#fbbf24" opacity="0.8">
        <animate attributeName="r" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="16" cy="16" r="0.5" fill="#fbbf24" opacity="0.8">
        <animate attributeName="r" values="0.5;1;0.5" dur="2s" begin="1s" repeatCount="indefinite"/>
      </circle>
    </g>
  </svg>
)

// Generic Category Icon - Beautiful gem/crystal
export const CategoryIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="gem-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="gem-shine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <filter id="gem-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
      </filter>
    </defs>
    
    <g filter="url(#gem-shadow)">
      {/* Gem facets */}
      <path d="M12 3l-5 5 5 11 5-11z" fill="url(#gem-gradient)"/>
      <path d="M7 8h10l-5 11z" fill="#7c3aed" opacity="0.7"/>
      <path d="M12 3l-5 5h10z" fill="#a78bfa"/>
      {/* Shine */}
      <path d="M12 3l-3 3 3 6z" fill="url(#gem-shine)"/>
      {/* Sparkle */}
      <circle cx="10" cy="7" r="0.5" fill="white" opacity="0.8"/>
    </g>
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
export const PremiumCategoryIconRenderer = ({ 
  category, 
  size = 24,
  className = '' 
}: { 
  category: string
  size?: number
  className?: string 
}) => {
  const Icon = getCategoryIcon(category)
  return <Icon size={size} className={className} />
}

export default PremiumCategoryIconRenderer