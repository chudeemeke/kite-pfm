# Testing Guide

This guide covers the comprehensive testing strategy for the Kite Personal Finance Manager PWA, including unit testing, component testing, and end-to-end testing.

## Testing Strategy and Philosophy

### Testing Pyramid

```
    /\
   /E2E\     ← Few, high-value integration tests
  /______\
 /Component\ ← More tests for user interactions
/___________\
/   Unit    \ ← Many tests for business logic
\___________/
```

### Core Principles

1. **Test user behavior, not implementation details**
2. **Write tests that give confidence in refactoring**
3. **Maintain fast feedback loops**
4. **Focus on critical user paths**
5. **Achieve 80% minimum code coverage**

## Test Structure and Organization

### Directory Structure

```
src/
├── components/
│   ├── __tests__/
│   │   └── LoadingSpinner.test.tsx
│   └── LoadingSpinner.tsx
├── services/
│   ├── __tests__/
│   │   ├── budgeting.test.ts
│   │   └── format.test.ts
│   └── budgeting.ts
├── test/
│   └── setup.ts              # Global test configuration
└── ...
e2e/
└── app.spec.ts               # End-to-end tests
```

### Naming Conventions

- **Unit/Component tests**: `*.test.tsx` or `*.test.ts`
- **E2E tests**: `*.spec.ts`
- **Test utilities**: `test-utils.tsx`
- **Mocks**: `__mocks__/`

## Unit Testing with Vitest

### Configuration

Vitest is configured in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    }
  }
})
```

### Writing Unit Tests

#### Service Layer Example

```typescript
// src/services/__tests__/budgeting.test.ts
import { describe, it, expect } from 'vitest'
import { budgetingService } from '../budgeting'

describe('BudgetingService', () => {
  describe('calculateBudgetProgress', () => {
    it('should calculate progress correctly for normal spending', () => {
      expect(budgetingService.calculateBudgetProgress(50, 100)).toBe(50)
      expect(budgetingService.calculateBudgetProgress(100, 100)).toBe(100)
    })
    
    it('should cap progress at 100% for overspending', () => {
      expect(budgetingService.calculateBudgetProgress(150, 100)).toBe(100)
    })
    
    it('should handle edge cases', () => {
      expect(budgetingService.calculateBudgetProgress(0, 100)).toBe(0)
      expect(budgetingService.calculateBudgetProgress(50, 0)).toBe(0)
    })
  })
  
  describe('getBudgetStatus', () => {
    it('should return correct status levels', () => {
      expect(budgetingService.getBudgetStatus(50, 100)).toBe('good')
      expect(budgetingService.getBudgetStatus(85, 100)).toBe('warning')
      expect(budgetingService.getBudgetStatus(150, 100)).toBe('danger')
    })
  })
})
```

#### Format Service Testing

```typescript
// src/services/__tests__/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatService } from '../format'

describe('FormatService', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts with GBP by default', () => {
      expect(formatService.formatCurrency(1234.56)).toBe('£1,234.56')
      expect(formatService.formatCurrency(0)).toBe('£0.00')
    })
    
    it('should format negative amounts correctly', () => {
      expect(formatService.formatCurrency(-1234.56)).toBe('-£1,234.56')
    })
    
    it('should support different currencies', () => {
      expect(formatService.formatCurrency(1234.56, 'USD')).toBe('US$1,234.56')
      expect(formatService.formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
    })
  })
  
  describe('formatTransactionAmount', () => {
    it('should correctly identify positive and negative amounts', () => {
      const positive = formatService.formatTransactionAmount(100)
      expect(positive.isPositive).toBe(true)
      expect(positive.formatted).toBe('£100.00')
      
      const negative = formatService.formatTransactionAmount(-100)
      expect(negative.isNegative).toBe(true)
      expect(negative.formatted).toBe('-£100.00')
    })
  })
})
```

### Running Unit Tests

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test -- --watch

# Run specific test file
npm run test budgeting.test.ts

# Run tests matching pattern
npm run test -- --grep "formatCurrency"
```

## Component Testing with React Testing Library

### Setup

Test setup is configured in `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock ResizeObserver for chart components
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver for lazy loading
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

### Component Testing Examples

#### Simple Component Test

```typescript
// src/components/__tests__/LoadingSpinner.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('div')
    
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('w-6', 'h-6')
  })
  
  it('should render with custom size', () => {
    const { container } = render(<LoadingSpinner size="lg" />)
    const spinner = container.querySelector('div')
    
    expect(spinner).toHaveClass('w-8', 'h-8')
  })
  
  it('should have proper accessibility attributes', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('div')
    
    expect(spinner).toHaveAttribute('role', 'status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })
})
```

#### Interactive Component Test

```typescript
// src/components/__tests__/ConfirmDialog.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('should render when open', () => {
    render(<ConfirmDialog {...defaultProps} />)
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConfirmDialog {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /confirm/i }))
    
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConfirmDialog {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })
})
```

#### Testing with Zustand Store

```typescript
// src/components/__tests__/AccountCard.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAccountsStore } from '@/stores/accounts'
import AccountCard from '../AccountCard'

// Mock the store
vi.mock('@/stores/accounts')

describe('AccountCard', () => {
  beforeEach(() => {
    // Reset store mock before each test
    vi.mocked(useAccountsStore).mockReturnValue({
      accounts: [
        {
          id: '1',
          name: 'Test Account',
          type: 'checking',
          balance: 1500.50,
          currency: 'GBP'
        }
      ],
      getAccountById: vi.fn(),
      updateAccount: vi.fn(),
    })
  })

  it('should display account information correctly', () => {
    render(<AccountCard accountId="1" />)
    
    expect(screen.getByText('Test Account')).toBeInTheDocument()
    expect(screen.getByText('£1,500.50')).toBeInTheDocument()
    expect(screen.getByText('Current Account')).toBeInTheDocument()
  })
})
```

### Component Testing Best Practices

1. **Test user interactions, not implementation**
2. **Use semantic queries (getByRole, getByLabelText)**
3. **Test accessibility attributes**
4. **Mock external dependencies**
5. **Test error states and loading states**

### Running Component Tests

```bash
# Run component tests
npm run test components/

# Test specific component
npm run test LoadingSpinner

# Watch mode with UI
npm run test:ui
```

## E2E Testing with Playwright

### Configuration

Playwright is configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Examples

#### User Journey Tests

```typescript
// e2e/app.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Kite PWA', () => {
  test('should complete onboarding flow', async ({ page }) => {
    await page.goto('/')
    
    // Check if we're on onboarding
    await expect(page.locator('text=Welcome to Kite')).toBeVisible()
    
    // Navigate through onboarding steps
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Track Your Spending')).toBeVisible()
    
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Smart Budgeting')).toBeVisible()
    
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Automatic Rules')).toBeVisible()
    
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Demo Data Loaded')).toBeVisible()
    
    // Complete onboarding
    await page.click('button:has-text("Get Started")')
    
    // Verify we're on the home page
    await expect(page.locator('text=Good morning!')).toBeVisible()
    await expect(page.locator('text=Net Worth')).toBeVisible()
  })

  test('should navigate between main pages', async ({ page }) => {
    await page.goto('/')
    
    // Skip onboarding for navigation test
    await page.click('text=Skip tour')
    
    // Test bottom navigation
    await page.click('[aria-label="Activity"]')
    await expect(page).toHaveURL('/tx')
    await expect(page.locator('h1:has-text("Activity")')).toBeVisible()
    
    await page.click('[aria-label="Budgets"]')
    await expect(page).toHaveURL('/budgets')
    await expect(page.locator('h1:has-text("Budgets")')).toBeVisible()
    
    await page.click('[aria-label="Home"]')
    await expect(page).toHaveURL('/')
  })
})
```

#### PWA-Specific Tests

```typescript
// e2e/pwa.spec.ts
import { test, expect } from '@playwright/test'

test.describe('PWA Features', () => {
  test('should be installable as PWA', async ({ page, context }) => {
    await page.goto('/')
    
    // Check for PWA manifest
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest')
    
    // Check for service worker registration
    await page.waitForFunction(() => 'serviceWorker' in navigator)
  })

  test('should work offline after first load', async ({ page, context }) => {
    await page.goto('/')
    
    // Wait for service worker to install
    await page.waitForFunction(() => 
      navigator.serviceWorker.ready.then(() => true)
    )
    
    // Go offline
    await context.setOffline(true)
    
    // Navigate to a cached page
    await page.goto('/')
    await expect(page.locator('text=Kite')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
  })
})
```

#### Mobile-Specific Tests

```typescript
// e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['iPhone 12'] })

test.describe('Mobile Experience', () => {
  test('should handle touch interactions', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Skip tour')
    
    // Test swipe navigation (if implemented)
    await page.touchscreen.tap(100, 100)
    
    // Test mobile menu
    await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible()
  })

  test('should display mobile-optimized layouts', async ({ page }) => {
    await page.goto('/')
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveAttribute('content', 
      'width=device-width, initial-scale=1.0')
  })
})
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test app.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific project
npx playwright test --project="Mobile Chrome"

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## Coverage Requirements

### Minimum Coverage Targets

- **Overall coverage**: 80% minimum
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 85%
- **Lines**: 80%

### Coverage Exclusions

```typescript
// vitest.config.ts coverage configuration
coverage: {
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/coverage/**',
    'src/main.tsx',          // App entry point
    'src/vite-env.d.ts',     // Type definitions
  ]
}
```

### Generating Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

## Writing Effective Tests

### Test Structure (AAA Pattern)

```typescript
test('should calculate budget progress correctly', () => {
  // Arrange
  const spent = 75
  const budget = 100
  
  // Act
  const progress = budgetingService.calculateBudgetProgress(spent, budget)
  
  // Assert
  expect(progress).toBe(75)
})
```

### Testing Async Operations

```typescript
test('should load account data', async () => {
  const { result } = renderHook(() => useAccountsStore())
  
  await act(async () => {
    await result.current.loadAccounts()
  })
  
  expect(result.current.accounts).toHaveLength(3)
})
```

### Testing Error States

```typescript
test('should handle API errors gracefully', async () => {
  // Mock API to throw error
  vi.mocked(api.getAccounts).mockRejectedValue(new Error('Network error'))
  
  render(<AccountsList />)
  
  await expect(screen.findByText(/error loading accounts/i)).resolves.toBeInTheDocument()
})
```

## Mocking Strategies

### Service Layer Mocks

```typescript
// __mocks__/services/api.ts
export const mockApiService = {
  getAccounts: vi.fn(),
  getTransactions: vi.fn(),
  createTransaction: vi.fn(),
}
```

### Store Mocks

```typescript
// Mock Zustand store
vi.mock('@/stores/accounts', () => ({
  useAccountsStore: vi.fn(),
}))

// In test
vi.mocked(useAccountsStore).mockReturnValue({
  accounts: mockAccounts,
  addAccount: vi.fn(),
})
```

### Date Mocking

```typescript
import { vi } from 'vitest'

test('should format current date correctly', () => {
  const mockDate = new Date('2024-01-15T10:00:00Z')
  vi.setSystemTime(mockDate)
  
  const formatted = formatService.formatCurrentDate()
  
  expect(formatted).toBe('January 15, 2024')
  
  vi.useRealTimers()
})
```

### IndexedDB Mocking

```typescript
// For tests that don't need real database
vi.mock('dexie', () => ({
  Dexie: vi.fn().mockImplementation(() => ({
    open: vi.fn().mockResolvedValue(true),
    accounts: {
      toArray: vi.fn().mockResolvedValue(mockAccounts),
      add: vi.fn().mockResolvedValue('mock-id'),
    }
  }))
}))
```

## CI/CD Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type checking
      run: npm run typecheck
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run typecheck && npm run test -- --run"
    }
  }
}
```

## Performance Testing Guidelines

### Core Web Vitals Testing

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test('should meet Core Web Vitals thresholds', async ({ page }) => {
  await page.goto('/')
  
  // Measure Largest Contentful Paint (LCP)
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        resolve(lastEntry.startTime)
      }).observe({ entryTypes: ['largest-contentful-paint'] })
    })
  })
  
  expect(lcp).toBeLessThan(2500) // LCP should be under 2.5s
})
```

### Bundle Size Testing

```typescript
test('should maintain reasonable bundle size', async ({ page }) => {
  const response = await page.goto('/')
  const size = response?.headers()['content-length']
  
  // Main bundle should be under 500KB
  expect(parseInt(size || '0')).toBeLessThan(500 * 1024)
})
```

## Test Utilities and Helpers

### Custom Render Helper

```typescript
// src/test/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ReactElement } from 'react'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Mock Data Factories

```typescript
// src/test/factories.ts
import { Account, Transaction } from '@/types'

export const createMockAccount = (overrides?: Partial<Account>): Account => ({
  id: 'account-1',
  name: 'Test Account',
  type: 'checking',
  balance: 1000,
  currency: 'GBP',
  ...overrides,
})

export const createMockTransaction = (overrides?: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  amount: -50,
  description: 'Test Transaction',
  date: new Date().toISOString(),
  accountId: 'account-1',
  categoryId: 'cat-1',
  ...overrides,
})
```

## Debugging Tests

### Debugging Unit Tests

```bash
# Run single test in debug mode
npm run test -- --no-coverage LoadingSpinner.test.tsx

# Use debugger statements
debugger; // Add to test code
```

### Debugging E2E Tests

```bash
# Run in headed mode
npx playwright test --headed

# Debug specific test
npx playwright test --debug app.spec.ts

# Take screenshots on failure
npx playwright test --screenshot=only-on-failure
```

### Test Debugging Tips

1. Use `screen.debug()` to see rendered DOM
2. Add `data-testid` attributes for reliable selection
3. Use `.only()` to run single tests during development
4. Check browser console for errors during E2E tests

## Best Practices Summary

1. **Follow the testing pyramid**: More unit tests, fewer E2E tests
2. **Test user behavior**: Focus on what users do, not implementation
3. **Maintain fast feedback loops**: Unit tests should run quickly
4. **Use semantic queries**: getByRole, getByLabelText over getByTestId
5. **Mock external dependencies**: Keep tests isolated and predictable
6. **Test error states**: Ensure graceful error handling
7. **Maintain coverage**: Aim for 80% minimum coverage
8. **Write descriptive test names**: Make test intent clear
9. **Keep tests simple**: One assertion per test when possible
10. **Use proper cleanup**: Reset mocks and state between tests