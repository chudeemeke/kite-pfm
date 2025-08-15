# Kite Components Documentation

## Overview

The Kite Personal Finance Manager is built using a modern React architecture with TypeScript, featuring a comprehensive component system that follows established design patterns and accessibility guidelines. This documentation provides an overview of the component architecture, organization, and design principles.

## Component Architecture

### Design Principles

1. **Composition over Inheritance**: Components are designed to be composable and reusable
2. **Accessibility First**: All components follow WCAG guidelines with proper ARIA attributes
3. **Type Safety**: Comprehensive TypeScript interfaces for all props and data structures
4. **Dark Mode Support**: Full dark/light theme support throughout the component system
5. **Mobile-First**: Responsive design optimized for mobile and desktop usage
6. **Performance**: Optimized rendering with proper memoization and state management

### Component Categories

The component system is organized into four main categories:

#### 1. Core Components (`/src/components/`)
Reusable UI components that form the foundation of the application:

- **Layout Components**: Page structure and navigation
- **Modal Components**: Dialogs, confirmations, and overlays
- **Form Components**: Inputs, selects, and form controls
- **Data Display**: Charts, tables, and status indicators
- **Utility Components**: Loading states, error handling, and helpers

#### 2. Page Components (`/src/pages/`)
Top-level route components that compose multiple core components:

- **Home**: Dashboard with financial overview
- **Activity**: Transaction management and history
- **Budgets**: Budget creation and monitoring
- **Accounts**: Account management
- **Insights**: Analytics and reporting
- **Settings**: Application configuration

#### 3. Feature Components
Specialized components for specific business logic:

- **BackupManager**: Data backup and restore functionality
- **DataImport**: CSV and JSON import handling
- **CategoriesManager**: Category management interface
- **RulesManager**: Transaction categorization rules
- **OnboardingFlow**: User onboarding and tours

#### 4. Settings Components (`/src/components/settings/`)
Configuration and preferences components:

- **SettingsItem**: Standardized settings row component
- **ToggleSwitch**: Boolean setting controls
- **ColorPicker**: Color selection interface
- **SelectDropdown**: Options selection
- **Slider**: Numeric range controls

## Component Organization Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx          # Main page layout wrapper
│   │   ├── TopBar.tsx          # Application header with navigation
│   │   └── BottomNav.tsx       # Mobile navigation bar
│   ├── Charts/
│   │   ├── CashflowChart.tsx   # Income/expense flow visualization
│   │   ├── SpendingByCategory.tsx # Category spending breakdown
│   │   ├── SafeResponsive.tsx  # Responsive chart wrapper
│   │   └── index.ts            # Chart component exports
│   ├── settings/
│   │   ├── SettingsItem.tsx    # Standardized settings row
│   │   ├── ToggleSwitch.tsx    # Boolean toggle control
│   │   ├── ColorPicker.tsx     # Color selection component
│   │   ├── SelectDropdown.tsx  # Dropdown selection
│   │   ├── Slider.tsx          # Range slider control
│   │   ├── SettingsSection.tsx # Settings group container
│   │   ├── QuickSettings.tsx   # Quick access settings
│   │   └── index.ts            # Settings component exports
│   ├── Onboarding/
│   │   └── OnboardingFlow.tsx  # User onboarding tour
│   ├── __tests__/
│   │   └── LoadingSpinner.test.tsx # Component tests
│   ├── BackupManager.tsx       # Data backup/restore interface
│   ├── CategoriesManager.tsx   # Category management
│   ├── ConfirmDialog.tsx       # Confirmation modal
│   ├── DataImport.tsx          # Data import interface
│   ├── ErrorBoundary.tsx       # Error handling wrapper
│   ├── InputModal.tsx          # Text input modal
│   ├── LoadingSpinner.tsx      # Loading state indicator
│   ├── PinEntryModal.tsx       # PIN/password entry
│   ├── ProfileEditor.tsx       # User profile editing
│   ├── QuickAddModal.tsx       # Quick action modal
│   ├── RulesManager.tsx        # Rule management interface
│   └── ToastContainer.tsx      # Notification system
├── pages/
│   ├── Home.tsx                # Dashboard page
│   ├── Activity.tsx            # Transaction history
│   ├── Budgets.tsx             # Budget management
│   ├── Accounts.tsx            # Account overview
│   ├── AccountDetail.tsx       # Individual account view
│   ├── Insights.tsx            # Analytics and charts
│   └── Settings.tsx            # Application settings
└── types/
    └── index.ts                # TypeScript type definitions
```

## Design System Overview

### Color Palette

The application uses a semantic color system with support for light and dark themes:

```css
/* Primary Colors */
--primary-50: #eff6ff
--primary-500: #3b82f6
--primary-600: #2563eb
--primary-700: #1d4ed8

/* Semantic Colors */
--success-500: #10b981  /* Positive actions, income */
--danger-500: #ef4444   /* Destructive actions, expenses */
--warning-500: #f59e0b  /* Alerts, warnings */
--info-500: #3b82f6    /* Information, neutrals */

/* Gray Scale */
--gray-50: #f9fafb     /* Light backgrounds */
--gray-100: #f3f4f6    /* Subtle backgrounds */
--gray-500: #6b7280    /* Text secondary */
--gray-900: #111827    /* Text primary */
```

### Typography Scale

```css
/* Text Sizes */
text-xs:    12px / 16px
text-sm:    14px / 20px
text-base:  16px / 24px
text-lg:    18px / 28px
text-xl:    20px / 28px
text-2xl:   24px / 32px
text-3xl:   30px / 36px

/* Font Weights */
font-medium:    500
font-semibold:  600
font-bold:      700
```

### Spacing System

The application uses a consistent 4px-based spacing system:

```css
/* Common Spacing Values */
gap-1:  4px
gap-2:  8px
gap-3:  12px
gap-4:  16px
gap-6:  24px
gap-8:  32px

/* Padding/Margin */
p-2:    8px
p-3:    12px
p-4:    16px
p-6:    24px
```

### Component Styling Patterns

#### Card Pattern
```css
.card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}
```

#### Button Patterns
```css
.btn-primary {
  @apply px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors font-medium;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;
}
```

#### Input Pattern
```css
.input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500;
}
```

## Common Patterns and Conventions

### State Management Integration

Components integrate with Zustand stores for state management:

```typescript
import { useAccountsStore, useTransactionsStore } from '@/stores'

const MyComponent = () => {
  const { accounts, createAccount, isLoading } = useAccountsStore()
  const { transactions, fetchTransactions } = useTransactionsStore()
  
  // Component logic...
}
```

### Error Handling Pattern

```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  )
}

if (hasError) {
  return (
    <div className="p-4">
      <div className="card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Error Loading Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={retry} className="btn-primary">
          Retry
        </button>
      </div>
    </div>
  )
}
```

### Modal Pattern

```typescript
const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        {children}
      </div>
    </div>
  )
}
```

### Form Validation Pattern

```typescript
interface FormState<T> {
  values: T
  errors: ValidationError[]
  isSubmitting: boolean
  isDirty: boolean
}

const useForm = <T>(initialValues: T) => {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: [],
    isSubmitting: false,
    isDirty: false
  })
  
  // Form management logic...
}
```

## Accessibility Guidelines

### ARIA Attributes
- All interactive elements have proper `aria-label` or `aria-labelledby`
- Form controls include `aria-describedby` for error messages
- Modals use `aria-modal="true"` and `role="dialog"`
- Loading states include `role="status"` and `aria-label="Loading"`

### Keyboard Navigation
- Tab order follows logical flow
- Modal dialogs trap focus
- ESC key closes modals and dropdowns
- Enter key submits forms and activates primary actions

### Screen Reader Support
- Semantic HTML elements (`<main>`, `<nav>`, `<section>`)
- Hidden labels with `sr-only` class for icon-only buttons
- Status announcements for dynamic content changes
- Proper heading hierarchy (h1, h2, h3)

### Color and Contrast
- All text meets WCAG AA contrast requirements (4.5:1 minimum)
- Color is not the only means of conveying information
- Focus indicators are clearly visible
- Support for user color preferences (dark/light mode)

## Performance Considerations

### Code Splitting
- Page components are lazy-loaded
- Feature components are dynamically imported
- Chart libraries are code-split by route

### Memoization
- React.memo for expensive pure components
- useMemo for expensive calculations
- useCallback for stable function references

### Bundle Optimization
- Tree-shaking for unused utilities
- Dynamic imports for conditional features
- Optimized icon imports (only used icons)

## Testing Strategy

### Unit Tests
- Components are tested in isolation
- Props validation and rendering
- User interaction simulation
- Accessibility compliance checks

### Integration Tests
- Store integration with components
- Form submission flows
- Modal interactions
- Navigation behavior

### Visual Regression Tests
- Component appearance across themes
- Responsive behavior
- Animation states
- Error states

## Development Guidelines

### Component Creation Checklist
- [ ] TypeScript interfaces for all props
- [ ] Default prop values where appropriate
- [ ] Dark mode styling support
- [ ] Accessibility attributes
- [ ] Error boundary compatibility
- [ ] Mobile-responsive design
- [ ] Loading and error states
- [ ] Unit tests with good coverage

### Code Style
- Use functional components with hooks
- Prefer composition over inheritance
- Extract custom hooks for complex logic
- Use semantic HTML elements
- Follow consistent naming conventions
- Document complex prop interfaces

### File Organization
- One component per file
- Co-locate related files (tests, styles)
- Use index.ts files for clean imports
- Group related components in subdirectories
- Keep component files under 500 lines

## Related Documentation

- [Core Components](./core-components.md) - Detailed documentation for reusable UI components
- [Page Components](./page-components.md) - Documentation for page-level components
- [Feature Components](./feature-components.md) - Documentation for feature-specific components
- [API Documentation](../api/README.md) - Backend API and data layer documentation
- [Testing Guide](../testing.md) - Comprehensive testing documentation