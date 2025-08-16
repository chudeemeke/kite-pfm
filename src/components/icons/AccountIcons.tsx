/**
 * Account Type Icons
 * Beautiful, unique icons for different account types
 * Matches the quality of category icons with gradients and depth
 */

import React from 'react'

interface IconProps {
  size?: number
  className?: string
}

// Checking Account - Modern bank building
export const CheckingIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="checking-building" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="checking-windows" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#dbeafe" />
        <stop offset="100%" stopColor="#93c5fd" />
      </linearGradient>
      <filter id="checking-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.2"/>
      </filter>
    </defs>
    
    <g filter="url(#checking-shadow)">
      {/* Building base */}
      <rect x="5" y="6" width="14" height="14" fill="url(#checking-building)" rx="1"/>
      {/* Roof/Top */}
      <rect x="4" y="5" width="16" height="2" fill="#2563eb" rx="0.5"/>
      {/* Windows grid */}
      <rect x="7" y="8" width="3" height="3" fill="url(#checking-windows)" opacity="0.9"/>
      <rect x="11" y="8" width="3" height="3" fill="url(#checking-windows)" opacity="0.9"/>
      <rect x="15" y="8" width="2" height="3" fill="url(#checking-windows)" opacity="0.9"/>
      <rect x="7" y="12" width="3" height="3" fill="url(#checking-windows)" opacity="0.9"/>
      <rect x="11" y="12" width="3" height="3" fill="url(#checking-windows)" opacity="0.9"/>
      <rect x="15" y="12" width="2" height="3" fill="url(#checking-windows)" opacity="0.9"/>
      {/* Door */}
      <rect x="10" y="16" width="4" height="4" fill="#1e40af"/>
      {/* Foundation */}
      <rect x="3" y="20" width="18" height="1" fill="#1e3a8a"/>
    </g>
  </svg>
)

// Savings Account - Piggy bank with coins
export const SavingsIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <radialGradient id="savings-piggy">
        <stop offset="0%" stopColor="#86efac" />
        <stop offset="100%" stopColor="#10b981" />
      </radialGradient>
      <linearGradient id="savings-coin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <filter id="savings-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.2"/>
      </filter>
    </defs>
    
    <g filter="url(#savings-shadow)">
      {/* Piggy body */}
      <ellipse cx="12" cy="12" rx="8" ry="6" fill="url(#savings-piggy)"/>
      {/* Snout */}
      <ellipse cx="7" cy="12" rx="2.5" ry="2" fill="#059669"/>
      <circle cx="6.5" cy="12" r="0.3" fill="#022c22"/>
      <circle cx="7.5" cy="12" r="0.3" fill="#022c22"/>
      {/* Eye */}
      <circle cx="10" cy="10" r="0.8" fill="white"/>
      <circle cx="10.2" cy="10.2" r="0.4" fill="#1f2937"/>
      {/* Ear */}
      <path d="M13 8l2-2v3z" fill="#059669"/>
      {/* Legs */}
      <rect x="8" y="16" width="1.5" height="3" fill="#059669" rx="0.5"/>
      <rect x="14" y="16" width="1.5" height="3" fill="#059669" rx="0.5"/>
      {/* Coin slot */}
      <rect x="11" y="6" width="4" height="0.8" fill="#1f2937" rx="0.4"/>
      {/* Coin going in */}
      <ellipse cx="13" cy="5" rx="1.5" ry="0.5" fill="url(#savings-coin)">
        <animateTransform attributeName="transform" type="translate" 
                         values="0,-2; 0,2; 0,2" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;1;0" dur="3s" repeatCount="indefinite"/>
      </ellipse>
    </g>
  </svg>
)

// Credit Card Account
export const CreditIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="credit-card" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
      <linearGradient id="credit-shine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.3"/>
        <stop offset="50%" stopColor="white" stopOpacity="0.1"/>
        <stop offset="100%" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <filter id="credit-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.25"/>
      </filter>
    </defs>
    
    <g filter="url(#credit-shadow)">
      {/* Card body */}
      <rect x="4" y="7" width="16" height="10" rx="2" fill="url(#credit-card)"/>
      {/* Magnetic strip */}
      <rect x="4" y="9" width="16" height="3" fill="#1f2937" opacity="0.8"/>
      {/* Chip */}
      <rect x="6" y="13" width="3" height="2.5" rx="0.3" fill="#fbbf24"/>
      <path d="M6.5 13.5h2m-2 0.5h2m-2 0.5h2m-2 0.5h2" stroke="#f59e0b" strokeWidth="0.2"/>
      {/* Card number dots */}
      <circle cx="11" cy="14.5" r="0.3" fill="white" opacity="0.8"/>
      <circle cx="12" cy="14.5" r="0.3" fill="white" opacity="0.8"/>
      <circle cx="13" cy="14.5" r="0.3" fill="white" opacity="0.8"/>
      <circle cx="14" cy="14.5" r="0.3" fill="white" opacity="0.8"/>
      <circle cx="16" cy="14.5" r="0.3" fill="white" opacity="0.8"/>
      <circle cx="17" cy="14.5" r="0.3" fill="white" opacity="0.8"/>
      <circle cx="18" cy="14.5" r="0.3" fill="white" opacity="0.8"/>
      {/* Shine effect */}
      <rect x="4" y="7" width="16" height="10" rx="2" fill="url(#credit-shine)"/>
    </g>
  </svg>
)

// Investment Account - Growing graph with arrow
export const InvestmentAccountIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="invest-graph" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="invest-bars" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#ddd6fe" />
      </linearGradient>
      <filter id="invest-shadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2"/>
      </filter>
    </defs>
    
    <g filter="url(#invest-shadow)">
      {/* Chart bars */}
      <rect x="5" y="16" width="3" height="4" fill="url(#invest-bars)" opacity="0.7"/>
      <rect x="9" y="13" width="3" height="7" fill="url(#invest-bars)" opacity="0.8"/>
      <rect x="13" y="10" width="3" height="10" fill="url(#invest-bars)" opacity="0.9"/>
      <rect x="17" y="7" width="3" height="13" fill="url(#invest-bars)"/>
      {/* Growth line */}
      <path d="M6 17l4-3 3-2 5-5" stroke="url(#invest-graph)" strokeWidth="2" strokeLinecap="round"/>
      {/* Arrow */}
      <path d="M18 7l2-2m0 0v4m0-4h-4" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
      {/* Dots on line */}
      <circle cx="6" cy="17" r="1" fill="#8b5cf6"/>
      <circle cx="10" cy="14" r="1" fill="#8b5cf6"/>
      <circle cx="13" cy="12" r="1" fill="#8b5cf6"/>
      <circle cx="18" cy="7" r="1" fill="#8b5cf6"/>
    </g>
  </svg>
)

// Cash/Wallet Account
export const CashIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="cash-wallet" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="cash-bills" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="100%" stopColor="#4ade80" />
      </linearGradient>
      <filter id="cash-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.2"/>
      </filter>
    </defs>
    
    <g filter="url(#cash-shadow)">
      {/* Wallet body */}
      <path d="M4 8h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" fill="url(#cash-wallet)"/>
      {/* Wallet flap */}
      <path d="M4 8c0-1 1-2 2-2h12c1 0 2 1 2 2H4z" fill="#92400e"/>
      {/* Bills sticking out */}
      <rect x="6" y="5" width="12" height="6" rx="0.5" fill="url(#cash-bills)" transform="rotate(-5 12 8)"/>
      <rect x="7" y="5" width="10" height="6" rx="0.5" fill="#86efac" transform="rotate(-3 12 8)"/>
      <rect x="8" y="5" width="8" height="6" rx="0.5" fill="#4ade80" transform="rotate(-1 12 8)"/>
      {/* Wallet clasp */}
      <rect x="10" y="11" width="4" height="3" rx="1" fill="#fbbf24"/>
      {/* Stitching */}
      <path d="M5 9h14" stroke="#451a03" strokeWidth="0.3" strokeDasharray="1 1" opacity="0.5"/>
      <path d="M5 19h14" stroke="#451a03" strokeWidth="0.3" strokeDasharray="1 1" opacity="0.5"/>
    </g>
  </svg>
)

// Loan Account - Contract with pen
export const LoanIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="loan-paper" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fde68a" />
      </linearGradient>
      <linearGradient id="loan-pen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="100%" stopColor="#3730a3" />
      </linearGradient>
      <filter id="loan-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.2"/>
      </filter>
    </defs>
    
    <g filter="url(#loan-shadow)">
      {/* Paper */}
      <rect x="5" y="3" width="12" height="16" fill="url(#loan-paper)" rx="1"/>
      {/* Text lines */}
      <rect x="7" y="5" width="8" height="0.5" fill="#92400e" opacity="0.4"/>
      <rect x="7" y="7" width="6" height="0.5" fill="#92400e" opacity="0.4"/>
      <rect x="7" y="9" width="8" height="0.5" fill="#92400e" opacity="0.4"/>
      <rect x="7" y="11" width="5" height="0.5" fill="#92400e" opacity="0.4"/>
      <rect x="7" y="13" width="7" height="0.5" fill="#92400e" opacity="0.4"/>
      {/* Signature line */}
      <rect x="7" y="16" width="8" height="0.5" fill="#1f2937"/>
      {/* Pen */}
      <g transform="rotate(45 16 16)">
        <rect x="14" y="14" width="2" height="8" fill="url(#loan-pen)"/>
        <path d="M14 22l1-2 1 2z" fill="#1f2937"/>
        <rect x="14" y="13" width="2" height="1" fill="#dc2626"/>
      </g>
    </g>
  </svg>
)

// Retirement/Pension Account - Nest egg
export const RetirementIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <radialGradient id="retirement-egg">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fbbf24" />
      </radialGradient>
      <linearGradient id="retirement-nest" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <filter id="retirement-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.2"/>
      </filter>
      <radialGradient id="retirement-shine">
        <stop offset="0%" stopColor="white" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="white" stopOpacity="0"/>
      </radialGradient>
    </defs>
    
    <g filter="url(#retirement-shadow)">
      {/* Nest */}
      <ellipse cx="12" cy="16" rx="8" ry="4" fill="url(#retirement-nest)"/>
      <path d="M4 16c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0 2-1 3 0 2 1 3 0" 
            stroke="#451a03" strokeWidth="0.5" opacity="0.5"/>
      {/* Golden egg */}
      <ellipse cx="12" cy="12" rx="5" ry="6" fill="url(#retirement-egg)"/>
      {/* Shine on egg */}
      <ellipse cx="10" cy="10" rx="2" ry="3" fill="url(#retirement-shine)"/>
      {/* Currency symbol on egg */}
      <text x="12" y="14" fontSize="6" fill="#92400e" textAnchor="middle" fontWeight="bold">£</text>
    </g>
  </svg>
)

// Business Account - Briefcase
export const BusinessIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="business-case" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#374151" />
        <stop offset="100%" stopColor="#1f2937" />
      </linearGradient>
      <linearGradient id="business-handle" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6b7280" />
        <stop offset="100%" stopColor="#4b5563" />
      </linearGradient>
      <filter id="business-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.25"/>
      </filter>
    </defs>
    
    <g filter="url(#business-shadow)">
      {/* Handle */}
      <path d="M9 7V5c0-1 1-2 2-2h2c1 0 2 1 2 2v2" 
            stroke="url(#business-handle)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Case body */}
      <rect x="4" y="8" width="16" height="12" rx="2" fill="url(#business-case)"/>
      {/* Clasp/Lock */}
      <rect x="10" y="11" width="4" height="3" rx="0.5" fill="#fbbf24"/>
      <circle cx="12" cy="12.5" r="0.5" fill="#92400e"/>
      {/* Side details */}
      <rect x="4" y="10" width="1" height="8" fill="#111827" opacity="0.3"/>
      <rect x="19" y="10" width="1" height="8" fill="#111827" opacity="0.3"/>
      {/* Top seam */}
      <rect x="4" y="8" width="16" height="0.5" fill="#111827" opacity="0.3"/>
    </g>
  </svg>
)

// Generic/Other Account - Safe/Vault
export const OtherAccountIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="other-vault" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#9ca3af" />
        <stop offset="100%" stopColor="#6b7280" />
      </linearGradient>
      <radialGradient id="other-dial">
        <stop offset="0%" stopColor="#e5e7eb" />
        <stop offset="100%" stopColor="#9ca3af" />
      </radialGradient>
      <filter id="other-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.25"/>
      </filter>
    </defs>
    
    <g filter="url(#other-shadow)">
      {/* Vault body */}
      <rect x="5" y="5" width="14" height="15" rx="2" fill="url(#other-vault)"/>
      {/* Door frame */}
      <rect x="6" y="6" width="12" height="13" rx="1" fill="#4b5563"/>
      {/* Combination dial */}
      <circle cx="12" cy="11" r="3" fill="url(#other-dial)"/>
      <circle cx="12" cy="11" r="2" fill="#374151"/>
      {/* Dial marks */}
      <path d="M12 9v1m2 1h-1m-1 2v-1m-2-1h1" stroke="#e5e7eb" strokeWidth="0.3"/>
      {/* Handle */}
      <rect x="14" y="11" width="3" height="1" rx="0.5" fill="#1f2937"/>
      {/* Hinges */}
      <rect x="6" y="7" width="0.5" height="2" fill="#1f2937"/>
      <rect x="6" y="13" width="0.5" height="2" fill="#1f2937"/>
      <rect x="6" y="17" width="0.5" height="2" fill="#1f2937"/>
    </g>
  </svg>
)

// Icon mapping for dynamic usage based on account type
export const accountTypeIcons: Record<string, React.FC<IconProps>> = {
  checking: CheckingIcon,
  savings: SavingsIcon,
  credit: CreditIcon,
  investment: InvestmentAccountIcon,
  cash: CashIcon,
  loan: LoanIcon,
  retirement: RetirementIcon,
  pension: RetirementIcon,
  business: BusinessIcon,
  other: OtherAccountIcon,
  default: OtherAccountIcon
}

// Helper function to get icon by account type
export const getAccountIcon = (type: string): React.FC<IconProps> => {
  const key = type.toLowerCase().replace(/[^\w]/g, '')
  return accountTypeIcons[key] || OtherAccountIcon
}

// Component to render account icon by type
export const AccountIconRenderer = ({ 
  accountType, 
  size = 24,
  className = '' 
}: { 
  accountType: string
  size?: number
  className?: string 
}) => {
  const Icon = getAccountIcon(accountType)
  return <Icon size={size} className={className} />
}

export default AccountIconRenderer