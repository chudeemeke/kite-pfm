# Contributing to Kite Personal Finance Manager

Thank you for considering contributing to Kite! This document provides guidelines and information for contributors to help maintain code quality and project consistency.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Conventions](#commit-message-conventions)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Documentation Requirements](#documentation-requirements)
- [Security Guidelines](#security-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

## How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** provided
3. **Provide clear reproduction steps** for bugs
4. **Include relevant system information** (OS, browser, Node.js version)

#### Bug Reports Should Include:

- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots/videos if applicable
- Browser/environment details
- Console errors if any

#### Feature Requests Should Include:

- Clear, descriptive title
- Problem statement (what need does this address?)
- Proposed solution
- Alternative solutions considered
- Additional context or mockups

### Contributing Code

1. **Fork the repository**
2. **Create a feature branch** from `main`
3. **Make your changes** following our guidelines
4. **Add tests** for new functionality
5. **Ensure all tests pass**
6. **Update documentation** if needed
7. **Submit a pull request**

#### Types of Contributions Welcome:

- Bug fixes
- New features
- Performance improvements
- Documentation improvements
- Test coverage improvements
- Accessibility enhancements
- UI/UX improvements

## Development Setup

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm** or **pnpm** (npm preferred for consistency)
- **Git** for version control

### Initial Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/kite-pfm.git
cd kite-pfm

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run preview          # Preview production build

# Building
npm run build            # Build for production
npm run typecheck        # Type checking only

# Testing
npm test                 # Run unit tests
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run E2E tests
npm run test:ui          # Run tests with UI

# Code Quality
npm run lint             # Lint code
```

### Development Environment

- **IDE**: VS Code recommended with TypeScript and ESLint extensions
- **Browser**: Chrome/Firefox with React Developer Tools
- **Database**: IndexedDB (via Dexie) - no external database needed

## Code Style Guidelines

### TypeScript Best Practices

#### Strict Mode Configuration
- Follow TypeScript strict mode (already configured)
- Use explicit types for function parameters and returns
- Avoid `any` type - use `unknown` or proper typing instead
- Prefer interfaces over type aliases for object shapes

```typescript
// Good
interface TransactionData {
  id: string;
  amount: number;
  description: string;
  date: Date;
}

function createTransaction(data: TransactionData): Promise<Transaction> {
  // implementation
}

// Avoid
function createTransaction(data: any): any {
  // implementation
}
```

#### Naming Conventions

- **Files**: kebab-case (`transaction-list.tsx`)
- **Components**: PascalCase (`TransactionList`)
- **Variables/Functions**: camelCase (`getUserData`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_TRANSACTION_LIMIT`)
- **Types/Interfaces**: PascalCase (`Transaction`, `UserSettings`)

### React Best Practices

#### Component Structure

```typescript
// Component file structure
import React from 'react';
import { ComponentProps } from './types';
import './component.css'; // if needed

// Types first
interface Props {
  // prop definitions
}

// Main component
export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // hooks
  // event handlers
  // render logic
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// Default export
export default Component;
```

#### Hooks Guidelines

- Use custom hooks for complex logic
- Keep components focused on rendering
- Follow the Rules of Hooks
- Use `useCallback` and `useMemo` judiciously (only when needed)

```typescript
// Custom hook example
export const useTransactions = (accountId: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // implementation
  
  return { transactions, loading, refetch };
};
```

#### State Management (Zustand)

- Keep stores focused and modular
- Use immer for complex state updates
- Implement proper TypeScript typing
- Follow the established store patterns

```typescript
// Store pattern
interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>()(
  immer((set, get) => ({
    transactions: [],
    loading: false,
    
    addTransaction: async (transaction) => {
      // implementation with proper error handling
    },
  }))
);
```

### CSS and Styling

#### Tailwind CSS Guidelines

- Use Tailwind utility classes primarily
- Create custom components for repeated patterns
- Follow mobile-first responsive design
- Maintain consistency with the design system

```tsx
// Good - utility classes with responsive design
<div className="flex flex-col space-y-4 p-4 md:flex-row md:space-y-0 md:space-x-6">
  <div className="flex-1 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
    {/* content */}
  </div>
</div>

// Better - extracted component for reuse
<Card className="flex-1">
  {/* content */}
</Card>
```

#### Design System Adherence

- Use established color palette (Emma/Snoop-inspired)
- Follow spacing scale (4px grid system)
- Maintain consistent typography scale
- Ensure dark mode compatibility

### Accessibility Guidelines

- Use semantic HTML elements
- Provide proper ARIA labels and descriptions
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast ratios

```tsx
// Good accessibility practices
<button
  aria-label="Delete transaction"
  onClick={handleDelete}
  className="p-2 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
>
  <TrashIcon className="h-4 w-4" />
</button>
```

## Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to build process or auxiliary tools

### Examples

```bash
feat(transactions): add bulk transaction import functionality

fix(budgets): resolve incorrect carryover calculation

docs(contributing): update development setup instructions

style(components): fix linting issues in TransactionList

refactor(stores): simplify transaction state management

perf(charts): optimize rendering for large datasets

test(services): add unit tests for budget calculations

chore(deps): update React to v18.3.1
```

### Scope Guidelines

- Use component/feature names: `transactions`, `budgets`, `auth`
- Use technical areas: `db`, `api`, `ui`, `tests`
- Keep scopes concise and consistent

## Testing Requirements

### Test Coverage Standards

- **Minimum coverage**: 80% for new code
- **Critical paths**: 100% coverage required
- **Services and utilities**: Comprehensive unit tests
- **Components**: Focus on behavior, not implementation
- **E2E tests**: Critical user flows

### Unit Testing Guidelines

#### Testing Services and Utilities

```typescript
// services/__tests__/budgeting.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { calculateBudgetProgress, BudgetCalculationInput } from '../budgeting';

describe('budgeting service', () => {
  describe('calculateBudgetProgress', () => {
    it('should calculate correct progress percentage', () => {
      const input: BudgetCalculationInput = {
        budgetAmount: 1000,
        spentAmount: 300,
      };
      
      const result = calculateBudgetProgress(input);
      
      expect(result.percentage).toBe(30);
      expect(result.remaining).toBe(700);
    });
  });
});
```

#### Testing React Components

```typescript
// components/__tests__/TransactionList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionList } from '../TransactionList';
import { mockTransactions } from '../../test/fixtures';

describe('TransactionList', () => {
  it('should render transaction items', () => {
    render(<TransactionList transactions={mockTransactions} />);
    
    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    expect(screen.getByText('£25.50')).toBeInTheDocument();
  });
  
  it('should handle transaction selection', () => {
    const onSelect = vi.fn();
    render(
      <TransactionList 
        transactions={mockTransactions} 
        onSelect={onSelect} 
      />
    );
    
    fireEvent.click(screen.getByText('Grocery Store'));
    
    expect(onSelect).toHaveBeenCalledWith(mockTransactions[0]);
  });
});
```

### E2E Testing Guidelines

```typescript
// e2e/transactions.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Transaction Management', () => {
  test('should create a new transaction', async ({ page }) => {
    await page.goto('/transactions');
    
    // Click add transaction button
    await page.click('[data-testid="add-transaction"]');
    
    // Fill form
    await page.fill('[data-testid="amount-input"]', '25.50');
    await page.fill('[data-testid="description-input"]', 'Coffee Shop');
    await page.selectOption('[data-testid="category-select"]', 'dining');
    
    // Submit
    await page.click('[data-testid="submit-button"]');
    
    // Verify
    await expect(page.locator('text=Coffee Shop')).toBeVisible();
  });
});
```

### Test Organization

- **Unit tests**: Co-located with source files in `__tests__` directories
- **Integration tests**: Test multiple components working together
- **E2E tests**: Located in `/e2e` directory
- **Test utilities**: Shared fixtures and helpers in `/src/test`

## Pull Request Process

### Before Submitting

1. **Run the full test suite**
   ```bash
   npm test && npm run test:e2e
   ```

2. **Check code quality**
   ```bash
   npm run lint
   npm run typecheck
   ```

3. **Update documentation** if needed

4. **Test your changes** in different browsers and screen sizes

### PR Requirements

#### Title and Description

- Use clear, descriptive titles
- Reference related issues (`Fixes #123`, `Closes #456`)
- Explain the why, not just the what
- Include screenshots for UI changes

#### PR Template

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed
- [ ] Cross-browser testing completed

## Screenshots (if applicable)
<!-- Add screenshots here -->

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console errors/warnings
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **At least one approval** from maintainers
3. **Address feedback** promptly and professionally
4. **Squash commits** before merging (if requested)

## Code Review Guidelines

### For Reviewers

#### What to Look For

- **Functionality**: Does it work as intended?
- **Code quality**: Is it readable and maintainable?
- **Performance**: Any potential performance issues?
- **Security**: Are there security considerations?
- **Accessibility**: Is it accessible to all users?
- **Testing**: Adequate test coverage?
- **Documentation**: Is documentation updated?

#### Review Etiquette

- Be constructive and specific in feedback
- Suggest solutions, not just problems
- Ask questions to understand the approach
- Acknowledge good practices and improvements
- Use "we" instead of "you" in feedback

### For Contributors

#### Responding to Reviews

- Address all feedback points
- Ask for clarification if needed
- Make changes in separate commits for easier review
- Update the PR description if scope changes
- Thank reviewers for their time and input

## Documentation Requirements

### Code Documentation

#### Inline Comments

```typescript
/**
 * Calculates the remaining budget amount and percentage spent
 * @param budget - The budget configuration
 * @param transactions - Transactions to calculate against
 * @returns Budget progress information
 */
export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[]
): BudgetProgress {
  // Complex logic should have explanatory comments
  const relevantTransactions = transactions.filter(
    tx => tx.categoryId === budget.categoryId && isInBudgetPeriod(tx.date, budget)
  );
  
  // ... implementation
}
```

#### README Updates

When adding new features:
- Update feature list
- Add configuration examples
- Update architecture documentation if needed

#### API Documentation

For service functions:
- Document parameters and return types
- Provide usage examples
- Document error conditions

### User Documentation

- Update user-facing documentation for new features
- Include screenshots for UI changes
- Provide migration guides for breaking changes

## Security Guidelines

### Data Privacy

- **Local storage only**: All data must remain on the user's device
- **No external APIs**: Avoid third-party service integrations that transmit data
- **Encryption ready**: Design with future encryption implementation in mind

### Input Validation

```typescript
// Always validate and sanitize inputs
export function createTransaction(input: TransactionInput): Promise<Transaction> {
  // Validate required fields
  if (!input.amount || !input.description) {
    throw new Error('Amount and description are required');
  }
  
  // Sanitize string inputs
  const sanitizedDescription = input.description.trim();
  
  // Validate amount format
  if (typeof input.amount !== 'number' || input.amount === 0) {
    throw new Error('Amount must be a non-zero number');
  }
  
  // ... rest of implementation
}
```

### Security Best Practices

- Sanitize all user inputs
- Use TypeScript for type safety
- Validate data at service boundaries
- Handle errors gracefully without exposing sensitive information
- Keep dependencies updated

### Reporting Security Issues

Please report security vulnerabilities to the maintainers privately. See [SECURITY.md](SECURITY.md) for details.

## Getting Help

### Resources

- **Documentation**: Check existing docs first
- **Issues**: Search closed issues for solutions
- **Discussions**: Use GitHub Discussions for questions
- **Code examples**: Look at existing implementations

### Contact

- **General questions**: GitHub Discussions
- **Bug reports**: GitHub Issues
- **Security concerns**: See SECURITY.md
- **Direct contact**: Project maintainers

Thank you for contributing to Kite! Your efforts help make personal finance management better for everyone.