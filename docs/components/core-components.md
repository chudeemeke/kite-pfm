# Core Components Documentation

This document provides detailed documentation for the core reusable components that form the foundation of the Kite Personal Finance Manager.

## Table of Contents

1. [Layout Components](#layout-components)
2. [Modal Components](#modal-components)
3. [Form Components](#form-components)
4. [Data Display Components](#data-display-components)
5. [Chart Components](#chart-components)
6. [Settings Components](#settings-components)

---

## Layout Components

### Layout

The main layout wrapper that provides the basic page structure with header, content area, and navigation.

**File**: `src/components/Layout/Layout.tsx`

#### Props

```typescript
interface LayoutProps {
  children: ReactNode
}
```

#### Usage

```tsx
import Layout from '@/components/Layout/Layout'

const App = () => (
  <Layout>
    <YourPageContent />
  </Layout>
)
```

#### Features

- **Mobile-first responsive design**: Optimized layout for all screen sizes
- **Safe area handling**: Accounts for device notches and home indicators
- **Dark mode support**: Automatic theme switching
- **Fixed positioning**: Header and navigation remain visible during scroll

#### Accessibility

- Semantic HTML structure with `<main>` element
- Proper heading hierarchy
- Skip-to-content functionality (implicit through navigation)

---

### TopBar

Application header with navigation, theme toggle, and utility menu.

**File**: `src/components/Layout/TopBar.tsx`

#### Props

No props - component manages its own state and integrates with global stores.

#### Features

- **App branding**: UK flag badge and application title
- **Theme toggle**: Light/dark mode switcher with system preference support
- **Utility menu**: Export, import, backup, privacy mode, and app info
- **Privacy mode toggle**: Hide/show sensitive financial data
- **Data management**: Export data as JSON, import from CSV/JSON
- **Cache management**: Clear application data with confirmation

#### Menu Items

| Item | Description | Icon |
|------|-------------|------|
| Export Data | Download all data as JSON | Download |
| Import Data | Import from CSV or JSON | Upload |
| Backup & Restore | Manage data backups | Database |
| Privacy Mode | Toggle sensitive data visibility | Eye/EyeOff |
| Clear Cache & Reset | Clear all local data | RefreshCw |
| Help & Support | Navigate to help section | HelpCircle |
| About Kite | Show app version and info | Info |

#### State Management Integration

```typescript
const { theme, toggleTheme } = useUIStore()
const { privacy, updatePrivacy } = useSettingsStore()
```

#### Accessibility

- Keyboard navigation support
- ARIA labels for all interactive elements
- Focus management for dropdown menu
- Escape key to close menu

---

### BottomNav

Mobile-optimized bottom navigation with floating action button.

**File**: `src/components/Layout/BottomNav.tsx`

#### Props

No props - uses React Router for navigation.

#### Navigation Items

| Route | Icon | Label | Description |
|-------|------|-------|-------------|
| `/` | Home | Home | Dashboard overview |
| `/tx` | Activity | Activity | Transaction history |
| `/budgets` | PieChart | Budgets | Budget management |
| `/accounts` | CreditCard | Accounts | Account overview |
| `/insights` | TrendingUp | Insights | Analytics and reports |
| `/settings` | Settings | Settings | App configuration |

#### Features

- **Floating Add Button**: Central quick-add functionality
- **Active state indicators**: Visual feedback for current route
- **Touch-optimized**: Proper touch targets for mobile devices
- **Safe area support**: Respects device bottom safe areas

#### Usage

```tsx
// Navigation items automatically integrate with React Router
const navigate = useNavigate()
const location = useLocation()

// Active state determined by current pathname
const isActive = location.pathname === item.path
```

#### Accessibility

- Tab navigation support
- ARIA labels for screen readers
- Active state announcements
- Focus indicators

---

## Modal Components

### ConfirmDialog

Reusable confirmation dialog with customizable variants and actions.

**File**: `src/components/ConfirmDialog.tsx`

#### Props

```typescript
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}
```

#### Prop Details

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | - | Controls dialog visibility |
| `onClose` | function | - | Called when dialog is dismissed |
| `onConfirm` | function | - | Called when user confirms action |
| `title` | string | - | Dialog title text |
| `message` | string | - | Dialog body message |
| `confirmText` | string | 'Confirm' | Confirm button text |
| `cancelText` | string | 'Cancel' | Cancel button text |
| `variant` | string | 'danger' | Visual style variant |

#### Variants

```typescript
// Danger (red) - for destructive actions
<ConfirmDialog variant="danger" title="Delete Account" />

// Warning (orange) - for caution actions  
<ConfirmDialog variant="warning" title="Archive Transaction" />

// Info (blue) - for informational confirmations
<ConfirmDialog variant="info" title="Export Data" />
```

#### Usage Example

```tsx
const [showDelete, setShowDelete] = useState(false)

const handleDelete = () => {
  deleteAccount(accountId)
  toast.success('Account deleted')
}

<ConfirmDialog
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  onConfirm={handleDelete}
  title="Delete Account"
  message="This will permanently delete the account and all associated transactions. This action cannot be undone."
  confirmText="Delete Account"
  variant="danger"
/>
```

#### Features

- **Backdrop click to close**: Click outside modal to dismiss
- **Keyboard support**: ESC key to close, Enter to confirm
- **Focus management**: Auto-focus confirm button, trap focus in modal
- **Body scroll lock**: Prevents background scrolling
- **Smooth animations**: Fade and scale transitions

#### Accessibility

- `role="dialog"` and `aria-modal="true"`
- `aria-labelledby` pointing to title
- `aria-describedby` pointing to message
- Focus trap within modal
- Screen reader announcements

---

### QuickAddModal

Multi-purpose modal for quickly creating transactions, accounts, budgets, subscriptions, and rules.

**File**: `src/components/QuickAddModal.tsx`

#### Props

```typescript
interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}
```

#### Quick Add Types

```typescript
type QuickAddType = 'transaction' | 'account' | 'budget' | 'subscription' | 'rule'
```

#### Features

- **Multi-step interface**: Selection screen then form
- **Dynamic form rendering**: Forms adapt based on selected type
- **Real-time validation**: Client-side validation with error feedback
- **Store integration**: Direct integration with Zustand stores
- **Success feedback**: Toast notifications on successful creation

#### Form Configurations

##### Transaction Form
```typescript
interface TransactionFormData {
  description: string
  amount: number
  currency: string
  accountId: string
  categoryId?: string
  merchant?: string
  date: Date
  isSubscription?: boolean
}
```

##### Account Form
```typescript
interface AccountFormData {
  name: string
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'loan' | 'other'
  currency: string
  balance: number
}
```

##### Budget Form
```typescript
interface BudgetFormData {
  categoryId: string
  amount: number
  month: string // YYYY-MM format
  carryStrategy: 'carryNone' | 'carryUnspent' | 'carryOverspend'
}
```

##### Rule Form
```typescript
interface RuleFormData {
  name: string
  categoryId: string
  conditions: RuleCondition[]
  priority: 'high' | 'normal' | 'low'
  enabled: boolean
}
```

#### Usage Example

```tsx
const [showQuickAdd, setShowQuickAdd] = useState(false)

<QuickAddModal
  isOpen={showQuickAdd}
  onClose={() => setShowQuickAdd(false)}
/>
```

#### Accessibility

- Full keyboard navigation
- Form labels and error associations
- ARIA attributes for form validation
- Screen reader friendly error messages

---

### PinEntryModal

Secure PIN entry modal for authentication and sensitive operations.

**File**: `src/components/PinEntryModal.tsx`

#### Props

```typescript
interface PinEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (pin: string) => void
  title?: string
  description?: string
  maxAttempts?: number
}
```

#### Features

- **Secure input**: Masked PIN entry
- **Attempt limiting**: Configurable maximum attempts
- **Auto-focus**: Automatic input focus on open
- **Visual feedback**: Clear success/error states
- **Biometric support**: Integration with browser biometric APIs (when available)

---

### InputModal

Generic text input modal for simple data entry.

**File**: `src/components/InputModal.tsx`

#### Props

```typescript
interface InputModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (value: string) => void
  title: string
  placeholder?: string
  initialValue?: string
  validation?: (value: string) => string | undefined
}
```

#### Features

- **Custom validation**: Optional validation function
- **Auto-select**: Select existing text on open
- **Real-time feedback**: Immediate validation feedback
- **Keyboard shortcuts**: Enter to submit, ESC to cancel

---

## Data Display Components

### LoadingSpinner

Animated loading indicator with size variants.

**File**: `src/components/LoadingSpinner.tsx`

#### Props

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

#### Usage

```tsx
// Small spinner for buttons
<LoadingSpinner size="sm" />

// Medium spinner for content areas
<LoadingSpinner size="md" />

// Large spinner for page loading
<LoadingSpinner size="lg" />

// Custom styling
<LoadingSpinner className="text-blue-500" />
```

#### Accessibility

- `role="status"` for screen readers
- `aria-label="Loading"` description
- Hidden text for screen readers

---

### ErrorBoundary

React error boundary for graceful error handling.

**File**: `src/components/ErrorBoundary.tsx`

#### Props

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}
```

#### Features

- **Custom fallback UI**: Optional custom error display
- **Development mode**: Shows error details in dev environment
- **Recovery actions**: Retry and refresh options
- **Error logging**: Console logging for debugging

#### Usage

```tsx
// Basic usage
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

#### Error Recovery

```tsx
// Built-in recovery options
<button onClick={this.handleReset}>Try again</button>
<button onClick={() => window.location.reload()}>Refresh page</button>
```

---

### ToastContainer

Global notification system for user feedback.

**File**: `src/components/ToastContainer.tsx`

#### Features

- **Multiple variants**: Success, error, warning, info
- **Auto-dismiss**: Configurable timeout
- **Manual dismiss**: Close button on each toast
- **Animation**: Smooth enter/exit transitions
- **Stacking**: Multiple toasts stack vertically

#### Integration

```typescript
import { toast } from '@/stores'

// Success notification
toast.success('Transaction saved', 'Your transaction has been recorded successfully')

// Error notification
toast.error('Save failed', 'Please check your connection and try again')

// Warning notification
toast.warning('Unsaved changes', 'You have unsaved changes that will be lost')

// Info notification
toast.info('Data imported', '25 transactions were imported from your file')
```

---

## Chart Components

### SpendingByCategory

Pie chart visualization for category spending breakdown.

**File**: `src/components/Charts/SpendingByCategory.tsx`

#### Props

```typescript
interface SpendingByCategoryProps {
  data: SpendingData[]
  height?: number
  currency?: string
}

interface SpendingData {
  name: string
  value: number
  color: string
}
```

#### Features

- **Interactive tooltips**: Hover for detailed information
- **Custom legend**: Category names with spending amounts
- **Responsive design**: Adapts to container size
- **Empty state**: Friendly message when no data available
- **Currency formatting**: Localized currency display

#### Usage

```tsx
const spendingData = [
  { name: 'Food & Dining', value: 450.00, color: '#ef4444' },
  { name: 'Transportation', value: 120.00, color: '#3b82f6' },
  { name: 'Entertainment', value: 80.00, color: '#10b981' }
]

<SpendingByCategory 
  data={spendingData}
  height={300}
  currency="GBP"
/>
```

---

### CashflowChart

Line chart showing income vs expenses over time.

**File**: `src/components/Charts/CashflowChart.tsx`

#### Props

```typescript
interface CashflowChartProps {
  data: CashflowData[]
  height?: number
  currency?: string
}

interface CashflowData {
  date: string
  income: number
  expenses: number
  net: number
}
```

#### Features

- **Multi-line display**: Income, expenses, and net flow
- **Interactive tooltips**: Date and amount details
- **Color coding**: Green for income, red for expenses
- **Time-based X-axis**: Automatic date formatting
- **Zoom support**: Mouse wheel zoom on desktop

---

### SafeResponsive

Responsive wrapper for chart components with error boundaries.

**File**: `src/components/Charts/SafeResponsive.tsx`

#### Features

- **Error handling**: Graceful fallback for chart errors
- **Responsive sizing**: Automatic size calculation
- **Loading states**: Shows spinner while calculating size
- **Accessibility**: Proper chart labeling and descriptions

---

## Settings Components

### SettingsItem

Standardized settings row component for consistent layout.

**File**: `src/components/settings/SettingsItem.tsx`

#### Props

```typescript
interface SettingsItemProps {
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  disabled?: boolean
  badge?: string
}
```

#### Usage

```tsx
<SettingsItem
  title="Privacy Mode"
  description="Hide sensitive financial information"
  icon={<Eye className="w-5 h-5" />}
  badge="Beta"
>
  <ToggleSwitch checked={privacyMode} onChange={setPrivacyMode} />
</SettingsItem>
```

---

### ToggleSwitch

Animated toggle switch for boolean settings.

**File**: `src/components/settings/ToggleSwitch.tsx`

#### Props

```typescript
interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}
```

#### Features

- **Smooth animations**: CSS transitions for state changes
- **Keyboard support**: Space bar to toggle
- **Focus indicators**: Clear focus ring
- **Disabled state**: Visual feedback for disabled toggles

#### Usage

```tsx
const [enabled, setEnabled] = useState(false)

<ToggleSwitch 
  checked={enabled}
  onChange={setEnabled}
  disabled={isLoading}
/>
```

---

### ColorPicker

Color selection component with preset palette.

**File**: `src/components/settings/ColorPicker.tsx`

#### Props

```typescript
interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  colors?: string[]
  disabled?: boolean
}
```

#### Features

- **Preset colors**: Common color palette
- **Custom input**: Hex color input field
- **Visual feedback**: Selected color indication
- **Accessibility**: Keyboard navigation between colors

---

### SelectDropdown

Custom dropdown component with search and keyboard navigation.

**File**: `src/components/settings/SelectDropdown.tsx`

#### Props

```typescript
interface SelectDropdownProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
}
```

#### Features

- **Search functionality**: Filter options by typing
- **Keyboard navigation**: Arrow keys to navigate options
- **Multi-select support**: Optional multiple selection
- **Custom rendering**: Custom option and value renderers

---

### Slider

Range slider component for numeric settings.

**File**: `src/components/settings/Slider.tsx`

#### Props

```typescript
interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  disabled?: boolean
  formatValue?: (value: number) => string
}
```

#### Features

- **Touch support**: Mobile-friendly touch interactions
- **Value formatting**: Custom value display formatting
- **Snap to steps**: Configurable step increments
- **Visual feedback**: Active thumb styling

---

## Form Components

### Input Validation Pattern

All form components follow a consistent validation pattern:

```typescript
interface ValidationResult {
  isValid: boolean
  error?: string
}

const validateEmail = (email: string): ValidationResult => {
  if (!email) return { isValid: false, error: 'Email is required' }
  if (!/\S+@\S+\.\S+/.test(email)) return { isValid: false, error: 'Invalid email format' }
  return { isValid: true }
}
```

### Error Display Pattern

```tsx
<div className="relative">
  <input
    className={cn(
      'input',
      hasError && 'border-red-500 focus:ring-red-500'
    )}
    aria-invalid={hasError}
    aria-describedby={hasError ? 'error-message' : undefined}
  />
  {hasError && (
    <p id="error-message" className="mt-1 text-sm text-red-600">
      {errorMessage}
    </p>
  )}
</div>
```

---

## Testing Guidelines

### Component Testing Patterns

```typescript
// Basic rendering test
test('renders without crashing', () => {
  render(<LoadingSpinner />)
})

// Props testing
test('applies correct size class', () => {
  render(<LoadingSpinner size="lg" />)
  expect(screen.getByRole('status')).toHaveClass('w-8 h-8')
})

// User interaction testing
test('calls onChange when toggled', async () => {
  const handleChange = jest.fn()
  render(<ToggleSwitch checked={false} onChange={handleChange} />)
  
  await user.click(screen.getByRole('button'))
  expect(handleChange).toHaveBeenCalledWith(true)
})

// Accessibility testing
test('has proper ARIA attributes', () => {
  render(<ConfirmDialog isOpen={true} title="Test" message="Test message" />)
  
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveAttribute('aria-modal', 'true')
  expect(dialog).toHaveAttribute('aria-labelledby')
})
```

### Visual Regression Testing

```typescript
// Storybook stories for visual testing
export default {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
}

export const Small = () => <LoadingSpinner size="sm" />
export const Medium = () => <LoadingSpinner size="md" />
export const Large = () => <LoadingSpinner size="lg" />
export const DarkMode = () => <div className="dark"><LoadingSpinner /></div>
```

---

## Performance Considerations

### Component Optimization

1. **Use React.memo for pure components**:
```typescript
export default React.memo(LoadingSpinner)
```

2. **Optimize expensive calculations**:
```typescript
const expensiveValue = useMemo(() => {
  return complexCalculation(data)
}, [data])
```

3. **Stable callback references**:
```typescript
const handleClick = useCallback(() => {
  onClick(id)
}, [onClick, id])
```

### Bundle Size Optimization

- Tree-shake unused chart components
- Lazy load heavy dependencies
- Use dynamic imports for conditional features
- Optimize icon imports (only import used icons)

---

## Migration and Updates

### Breaking Changes

When updating core components, follow these guidelines:

1. **Deprecation warnings**: Add console warnings before removing props
2. **Backwards compatibility**: Support old and new APIs during transition
3. **Migration guides**: Provide clear upgrade instructions
4. **Automated migrations**: Use codemods when possible

### Version Compatibility

- Maintain TypeScript interface compatibility
- Document breaking changes in CHANGELOG
- Use semantic versioning for component library
- Provide fallbacks for removed features

This documentation covers all core reusable components in the Kite application. Each component is designed with accessibility, performance, and maintainability in mind. For implementation details and advanced usage patterns, refer to the individual component source files.