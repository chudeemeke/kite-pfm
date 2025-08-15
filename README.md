# 🪁 Kite - Personal Finance Manager

<div align="center">

A modern, mobile-first Progressive Web App (PWA) for managing your personal finances. Built with React, TypeScript, and designed with privacy in mind - all data stays on your device.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/kite-pfm/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-orange.svg)](https://web.dev/progressive-web-apps/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/yourusername/kite-pfm/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/kite-pfm/actions/workflows/ci.yml)
[![Deploy](https://github.com/yourusername/kite-pfm/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/kite-pfm/actions/workflows/deploy.yml)

</div>

## 📸 Screenshots

<!-- Replace with actual screenshots when available -->
<div align="center">
  <img src="docs/screenshots/dashboard.png" alt="Dashboard Overview" width="300" style="margin: 10px;" />
  <img src="docs/screenshots/transactions.png" alt="Transaction Management" width="300" style="margin: 10px;" />
  <img src="docs/screenshots/budgets.png" alt="Budget Tracking" width="300" style="margin: 10px;" />
</div>

*Dashboard overview showing account balances, recent transactions, and budget progress*

## 🌟 Why Kite?

**Privacy-First Financial Management** - Unlike other finance apps, Kite keeps all your data on your device. No servers, no tracking, no data mining.

- **🔒 Complete Privacy**: Your financial data never leaves your device
- **📱 Mobile-First**: Designed for modern mobile devices with PWA capabilities
- **🎯 Smart Automation**: Intelligent rules engine for automatic categorization
- **📊 Rich Insights**: Beautiful charts and analytics to understand your spending
- **🚀 Fast & Offline**: Works without internet connection after initial load
- **🎨 Beautiful Design**: Calm, intuitive interface inspired by Emma and Snoop

## ✨ Features

### 📊 **Financial Tracking**
- Multi-account support (current, savings, credit cards, investments)
- Transaction categorization and tagging
- Real-time balance calculations
- Currency support (GBP default, configurable)
- Quick transaction entry with smart categorization
- Advanced filtering and search capabilities

### 🎯 **Smart Budgeting**
- Monthly budgets with carryover strategies
- Automatic budget calculations
- Progress tracking with visual indicators
- Overspend alerts and warnings
- Budget templates and quick setup
- Historical budget performance analysis

### ⚡ **Rule-Based Automation**
- Automatic transaction categorization
- Merchant-based rules with regex support
- Priority-based rule processing
- Bulk transaction updates
- Custom rule conditions and actions
- Rule performance analytics

### 📅 **Subscription Management**
- Track recurring payments
- Calendar integration (ICS export)
- Due date notifications (UI ready)
- Cost analysis and insights
- Subscription cost optimization suggestions
- Upcoming payments dashboard

### 📈 **Data Import/Export**
- CSV import with column mapping
- Automatic duplicate detection
- Data export in multiple formats
- Schema versioning for data integrity
- Backup and restore functionality
- Cross-device data transfer

### 🔒 **Privacy & Security**
- Local-only data storage (IndexedDB)
- No external servers or tracking
- End-to-end encryption ready (future)
- Data stays on your device
- Optional PIN protection
- Secure data validation and sanitization

### 🎨 **User Experience**
- Dark/light theme support
- Responsive mobile-first design
- Offline-first architecture
- Progressive Web App capabilities
- Intuitive onboarding flow
- Accessibility features (WCAG compliant)

## 💻 System Requirements

### For Users (PWA)
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 14.5+, Android 8.0+
- **Storage**: ~5MB for app, additional space for your data
- **Network**: Initial download only, then works offline

### For Developers
- **Node.js**: 18.0+ (recommended: 20.x LTS)
- **Package Manager**: npm 9+ or pnpm 8+
- **Browser**: Modern browser with DevTools
- **OS**: Windows 10+, macOS 12+, or Linux

## 🚀 Quick Start

### 🌐 Try it Now (Recommended)
Visit the live demo: **[Try Kite](https://yourusername.github.io/kite-pfm)** (replace with actual URL)

1. Open in your browser
2. Add to home screen (PWA)
3. Start with demo data or import your own
4. Enjoy privacy-first finance management!

### 🛠️ Local Development

#### Prerequisites
- Node.js 18+ (recommended: 20.x LTS)
- npm or pnpm
- Git

#### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/kite-pfm.git
cd kite-pfm

# Install dependencies (choose one)
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

🌟 **Open `http://localhost:5173`** to see the app in development mode.

#### Development Features
- ⚡ Hot module replacement for instant feedback
- 🔧 TypeScript checking and IntelliSense
- 🧪 Built-in testing tools
- 📱 Mobile device simulation

### Building for Production
```bash
# Type check
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

### GitHub Pages Deployment
```bash
# Build with GitHub Pages base URL
VITE_BASE="/kite-pfm/" npm run build

# Create SPA fallback for routing
cp dist/index.html dist/404.html

# Deploy to GitHub Pages (via Actions or manually)
```

### Cloudflare Pages Deployment
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: `20`

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test && npm run test:e2e
```

## 📱 PWA Features

- **Offline support**: Works without internet connection
- **Installable**: Add to home screen on mobile devices
- **Responsive**: Optimized for all screen sizes
- **Performance**: Fast loading with efficient caching

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand with persistence
- **Database**: Dexie (IndexedDB wrapper)
- **Charts**: Recharts with responsive wrappers
- **Build Tool**: Vite
- **Testing**: Vitest, Testing Library, Playwright

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── Charts/         # Chart components with SafeResponsive
│   ├── Layout/         # Layout components (TopBar, BottomNav)
│   └── Onboarding/     # Onboarding flow
├── db/                 # Database schema and repositories
├── pages/              # Route pages
├── services/           # Business logic and utilities
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
└── test/               # Test setup and utilities
```

### Data Flow
1. **UI Components** → Interact with **Zustand Stores**
2. **Stores** → Call **Service Layer** methods
3. **Services** → Use **Database Repositories**
4. **Repositories** → Interact with **Dexie/IndexedDB**

## 📊 Database Schema

```typescript
// Core entities
accounts: Account[]        // Financial accounts
transactions: Transaction[] // All transactions
categories: Category[]     // Spending categories
budgets: Budget[]         // Monthly budgets
rules: Rule[]             // Automation rules
subscriptions: Subscription[] // Recurring payments
appMeta: AppMeta          // App metadata and migrations
```

See [Database Documentation](./docs/database.md) for detailed schema information.

## 📚 Documentation

### 📖 User Guides
- **[User Guide](./docs/user-guide.md)** - Complete guide for end users
- **[Developer Setup](./docs/developer-setup.md)** - Setting up development environment
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions

### 🔧 Technical Documentation
- **[Architecture Decisions](./docs/architecture-decisions.md)** - Key architectural choices and rationale
- **[Database Schema](./docs/database.md)** - Complete database structure and relationships
- **[Performance Guide](./docs/performance.md)** - Optimization tips and best practices
- **[Testing Guide](./docs/testing.md)** - Testing strategies and tools
- **[Troubleshooting](./docs/troubleshooting.md)** - Common issues and solutions

### 🏗️ API Documentation
- **[API Overview](./docs/api/README.md)** - API structure and conventions
- **[Database API](./docs/api/database.md)** - Database operations and repositories
- **[Services API](./docs/api/services.md)** - Business logic and utilities
- **[Store API](./docs/api/stores.md)** - State management documentation

### 🧩 Component Documentation
- **[Component Overview](./docs/components/README.md)** - Component architecture
- **[Core Components](./docs/components/core-components.md)** - Reusable UI components
- **[Feature Components](./docs/components/feature-components.md)** - Feature-specific components
- **[Page Components](./docs/components/page-components.md)** - Route page components

## 🎨 Design System

- **Colors**: Emma/Snoop-inspired calm pastels
- **Typography**: Inter font family
- **Layout**: Mobile-first responsive design
- **Components**: Modular, composable components
- **Dark Mode**: Full light/dark theme support

## 🔧 Configuration

### Environment Variables
```bash
# Base URL for routing (important for GitHub Pages)
VITE_BASE="/"

# Development mode
VITE_DEV=true
```

### Customization
- **Currency**: Change default in `src/services/format.ts`
- **Theme**: Modify colors in `tailwind.config.js`
- **Demo Data**: Edit `src/services/demo.ts`

## 📋 Roadmap

### v1.1 (Planned)
- [ ] Advanced insights and analytics
- [ ] Custom categories and subcategories
- [ ] Receipt scanning (OCR)
- [ ] Goal tracking and savings targets

### v2.0 (Future)
- [ ] End-to-end encryption
- [ ] Multi-device sync
- [ ] Bank API integrations
- [ ] Investment tracking

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### Quick Contributing Guide
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to your branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Detailed Guidelines
For detailed contributing guidelines, development setup, coding standards, and more, please see:
**[CONTRIBUTING.md](./CONTRIBUTING.md)**

This includes:
- 🏗️ Development environment setup
- 📝 Coding standards and conventions
- 🧪 Testing requirements and strategies
- 📋 Issue templates and PR process
- 🎯 Feature request guidelines
- 🐛 Bug report templates

## 🔒 Security

We take security seriously. For information about:
- 🛡️ Security policies and procedures
- 🐛 Reporting security vulnerabilities
- 🔐 Security best practices
- 📧 Contact information for security issues

Please see: **[SECURITY.md](./SECURITY.md)**

**⚠️ Never report security vulnerabilities in public issues or discussions.**

## 📞 Support & Community

### 💬 Getting Help
- **📖 Documentation**: Start with our [User Guide](./docs/user-guide.md)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/yourusername/kite-pfm/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/yourusername/kite-pfm/discussions)
- **❓ Questions**: [GitHub Discussions - Q&A](https://github.com/yourusername/kite-pfm/discussions/categories/q-a)

### 🌟 Community
- **💭 General Discussion**: [GitHub Discussions](https://github.com/yourusername/kite-pfm/discussions)
- **🚀 Show and Tell**: Share your Kite setup and tips
- **🤝 Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md) to get involved

### 🔒 Security Issues
For security-related issues, please see [SECURITY.md](./SECURITY.md) - **do not** use public issues.

### 📈 Project Stats
- **⭐ Stars**: Help us grow by starring the project!
- **🍴 Forks**: Contributions welcome
- **📊 Activity**: Regular updates and community involvement

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ **Free to use** for personal and commercial projects
- ✅ **Free to modify** and distribute
- ✅ **Free to contribute** improvements back to the community
- ❗ **Attribution required** (keep the license notice)

## 🙏 Acknowledgments & Credits

### 🎨 Design Inspiration
- **[Emma](https://emma-app.com/)** - Mobile-first financial design patterns
- **[Snoop](https://snoop.app/)** - Clean, intuitive user interface design
- **Material Design** and **Apple Human Interface Guidelines** - Accessibility principles

### 🛠️ Technology Stack
- **[React](https://reactjs.org/)** - UI framework that makes development enjoyable
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool and dev server
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling framework
- **[Dexie](https://dexie.org/)** - Elegant IndexedDB wrapper
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management

### 🏗️ Infrastructure & Tools
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipeline
- **[Playwright](https://playwright.dev/)** - End-to-end testing
- **[Vitest](https://vitest.dev/)** - Fast unit testing framework
- **[ESLint](https://eslint.org/)** & **[Prettier](https://prettier.io/)** - Code quality and formatting

### 👥 Special Thanks
- All **contributors** who have helped improve Kite
- The **open-source community** for amazing tools and libraries
- **Privacy advocates** who inspire better data practices
- **Beta testers** and early adopters providing valuable feedback

### 🌟 Inspiration
This project was born from the need for a **privacy-first** financial management tool that puts users in control of their data. We believe financial privacy is a fundamental right, and Kite represents our contribution to that vision.

---

<div align="center">

**Made with ❤️ for better personal finance management**

*Your data, your device, your privacy*

[![Star on GitHub](https://img.shields.io/github/stars/yourusername/kite-pfm?style=social)](https://github.com/yourusername/kite-pfm)

</div>