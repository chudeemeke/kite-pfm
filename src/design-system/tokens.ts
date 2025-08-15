/**
 * Design System Tokens
 * Comprehensive design tokens for achieving Apple-level design quality
 * Based on 8px grid system for perfect vertical rhythm
 */

// Spacing Scale (8px base grid)
export const spacing = {
  xxs: '0.25rem',  // 4px
  xs: '0.5rem',     // 8px
  sm: '0.75rem',    // 12px
  md: '1rem',       // 16px
  lg: '1.25rem',    // 20px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  '3xl': '2.5rem',  // 40px
  '4xl': '3rem',    // 48px
  '5xl': '4rem',    // 64px
  '6xl': '5rem',    // 80px
} as const

// Typography Scale with consistent line heights for vertical rhythm
export const typography = {
  // Font sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  
  // Line heights for vertical rhythm (multiples of 8px)
  lineHeight: {
    xs: '1rem',       // 16px
    sm: '1.25rem',    // 20px
    base: '1.5rem',   // 24px
    lg: '1.75rem',    // 28px
    xl: '2rem',       // 32px
    '2xl': '2.5rem',  // 40px
    '3xl': '3rem',    // 48px
    '4xl': '3.5rem',  // 56px
  },
  
  // Font weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  }
} as const

// Component Heights (multiples of 8px for alignment)
export const heights = {
  // Buttons
  button: {
    sm: '2rem',     // 32px
    md: '2.5rem',   // 40px
    lg: '3rem',     // 48px
  },
  
  // Input fields
  input: {
    sm: '2rem',     // 32px
    md: '2.5rem',   // 40px
    lg: '3rem',     // 48px
  },
  
  // List items
  listItem: {
    sm: '3rem',     // 48px
    md: '4rem',     // 64px
    lg: '5rem',     // 80px
  },
  
  // Cards
  card: {
    min: '4rem',    // 64px
    base: '5rem',   // 80px
    extended: '6rem', // 96px
  },
  
  // Navigation
  nav: {
    top: '4rem',    // 64px
    bottom: '5rem', // 80px
  }
} as const

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
  pill: '9999px',
} as const

// Shadows (Apple-inspired elevation)
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const

// Transitions (smooth micro-interactions)
export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  }
} as const

// Z-index layers
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 30,
  popover: 40,
  tooltip: 50,
  toast: 60,
  loading: 70,
} as const

// Breakpoints for responsive design
export const breakpoints = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Grid system configuration
export const grid = {
  columns: 12,
  gutter: '1rem',    // 16px
  maxWidth: {
    xs: '100%',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
} as const

// Currency symbols mapping
export const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  ZAR: 'R',
  KES: 'KSh',
  GHS: 'GH₵',
  EGP: 'E£',
  MAD: 'DH',
  TZS: 'TSh',
  UGX: 'USh',
  XOF: 'CFA',
  XAF: 'FCFA',
} as const

// Icon sizes (consistent with text for proper alignment)
export const iconSizes = {
  xs: '0.75rem',    // 12px
  sm: '1rem',       // 16px
  md: '1.25rem',    // 20px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '2.5rem',  // 40px
} as const

// Touch targets (minimum 44px for accessibility)
export const touchTargets = {
  min: '2.75rem',   // 44px (Apple HIG minimum)
  comfortable: '3rem', // 48px
  large: '3.5rem',  // 56px
} as const