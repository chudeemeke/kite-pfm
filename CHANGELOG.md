# Changelog

All notable changes to the Kite Personal Finance Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-08-13

### 🎉 Initial Release

#### Added
- **Core Financial Tracking**
  - Multi-account support (checking, savings, credit, investment, cash, loan)
  - Transaction management with categorization
  - Real-time balance calculations
  - Currency support with GBP default

- **Smart Budgeting System**
  - Monthly budgets with three carryover strategies:
    - `carryNone`: No carryover between months
    - `carryUnspent`: Carry forward unspent amounts
    - `carryOverspend`: Carry forward overspend as debt
  - Budget progress tracking with visual indicators
  - Month-to-month budget ledger with detailed calculations

- **Rule-Based Automation**
  - Automatic transaction categorization
  - Flexible rule conditions (merchant, description, amount)
  - Support for equals, contains, regex, and range operators
  - Priority-based rule processing with stop conditions
  - Bulk transaction processing and preview

- **Subscription Management**
  - Track recurring payments (monthly, yearly, custom)
  - ICS calendar export for individual or all subscriptions
  - Next due date predictions
  - Subscription cost analytics

- **Data Import/Export**
  - CSV import with intelligent column mapping
  - Automatic duplicate detection during import
  - Dry-run preview before importing
  - CSV export for accounts, transactions, budgets, categories
  - Schema versioning with automatic migrations

- **Progressive Web App (PWA)**
  - Installable on mobile and desktop
  - Offline functionality with service worker
  - Responsive design optimized for mobile-first usage
  - iOS-like bottom navigation

- **UI/UX Features**
  - Emma/Snoop-inspired calm pastel design
  - Complete light/dark theme support with system preference detection
  - UK flag badge in top bar
  - Onboarding walkthrough with demo data
  - Toast notifications for user feedback
  - Error boundaries for graceful error handling

- **Developer Experience**
  - TypeScript throughout with strict type checking
  - Comprehensive test suite (unit, component, e2e)
  - GitHub Actions CI/CD pipeline
  - Automated deployment to GitHub Pages
  - Code coverage reporting
  - ESLint and Prettier configuration

- **Privacy & Security**
  - Local-only data storage (IndexedDB)
  - No external servers or data transmission
  - Privacy-by-design architecture
  - Future-ready for end-to-end encryption

#### Technical Implementation
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand with immer middleware
- **Database**: Dexie.js (IndexedDB wrapper) with migration system
- **Charts**: Recharts with SafeResponsive wrapper using ResizeObserver
- **Build Tool**: Vite with PWA plugin
- **Testing**: Vitest, Testing Library, Playwright
- **Routing**: React Router with proper subpath support

#### Demo Data
- Pre-populated demo accounts, transactions, categories, budgets, rules, and subscriptions
- Realistic financial data spanning 3 months
- Demonstrates all major features and use cases
- Easy reset functionality in settings

### 🔧 Configuration
- Environment variable support for base URL routing
- Configurable currency and locale settings
- Theme persistence across sessions
- PWA manifest with proper icon configuration

### 📱 Mobile Optimization
- Touch-friendly interface with proper tap targets
- iOS safe area support
- Android adaptive icon compatibility
- Optimized for various screen sizes and orientations

### 🧪 Testing Coverage
- Unit tests for all service layer functions
- Component tests for critical UI elements
- E2E tests covering complete user workflows
- PWA functionality testing
- Accessibility testing with automated tools

---

## [Unreleased]

### Planned for v1.1
- [ ] Advanced insights and analytics dashboard
- [ ] Custom categories with subcategory support
- [ ] Goal tracking and savings targets
- [ ] Enhanced subscription management
- [ ] Improved data visualization

### Planned for v2.0
- [ ] End-to-end encryption for sensitive data
- [ ] Multi-device synchronization
- [ ] Bank API integrations (Open Banking)
- [ ] Investment portfolio tracking
- [ ] Receipt scanning with OCR

---

### Legend
- 🎉 Major release
- ✨ New feature
- 🐛 Bug fix
- 🔧 Configuration change
- 📱 Mobile improvement
- 🔒 Security enhancement
- 📊 Performance improvement
- 📚 Documentation update