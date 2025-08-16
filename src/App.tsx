import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/schema'
import { useInitializeStores, useUIStore, useSettingsStore } from './stores'
import { settingsService } from './services/settingsApplication'
import { notificationService } from './services/notifications'
import { securityService, useSecurity } from './services/security'

// Layout components
import Layout from './components/Layout/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import ToastContainer from './components/ToastContainer'
import LockScreen from './components/LockScreen'

// Pages
import HomePage from './pages/Home'
import ActivityPage from './pages/Activity'
import BudgetsPage from './pages/Budgets'
import GoalsPage from './pages/Goals'
import AccountsPage from './pages/Accounts'
import AccountDetail from './pages/AccountDetail'
import InsightsPage from './pages/Insights'
import SpendingTrendsPage from './pages/SpendingTrends'
import FinancialReportsPage from './pages/FinancialReports'
import SettingsPage from './pages/Settings'

// Onboarding
import OnboardingFlow from './components/Onboarding/OnboardingFlow'

// Dev tools (lazy loaded)
const DatabaseStatus = lazy(() => import('./components/DevTools/DatabaseStatus'))

function App() {
  const { initializeStores } = useInitializeStores()
  const tourProgress = useUIStore(state => state.tourProgress)
  const { privacy } = useSettingsStore()
  const { isLocked, unlockApp, isPinEnabled, isBiometricEnabled } = useSecurity()
  
  // Check if database is initialized
  const appMeta = useLiveQuery(() => db.appMeta.get('singleton'))
  const isDbInitialized = appMeta !== undefined
  
  // Initialize stores when database is ready
  useEffect(() => {
    if (isDbInitialized) {
      // Initialize stores and services sequentially to avoid race conditions
      const initialize = async () => {
        try {
          await initializeStores()
          
          // Wait a moment for stores to fully hydrate
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Initialize services
          settingsService.init()
          notificationService.init()
          securityService.init()
        } catch (error) {
          console.error('Failed to initialize app:', error)
        }
      }
      
      initialize()
    }
  }, [isDbInitialized, initializeStores])
  
  // Apply privacy mode class to body
  useEffect(() => {
    if (privacy?.privacyMode) {
      document.body.classList.add('privacy-mode')
    } else {
      document.body.classList.remove('privacy-mode')
    }
  }, [privacy?.privacyMode])

  // Cleanup services on unmount
  useEffect(() => {
    return () => {
      settingsService.cleanup()
      notificationService.cleanup()
      securityService.cleanup()
    }
  }, [])
  
  // Initialize demo data on first run
  useEffect(() => {
    if (isDbInitialized && appMeta && appMeta.migrations.includes('v3-initial-setup')) {
      // Check if we need to load comprehensive demo data
      const loadInitialData = async () => {
        try {
          const accountCount = await db.accounts.count()
          const transactionCount = await db.transactions.count()
          
          // If no data exists, automatically load the rich demo data
          if (accountCount === 0 && transactionCount === 0) {
            console.log('First launch detected - loading comprehensive demo data...')
            
            // Dynamically import to avoid circular dependencies
            const { demoDataGenerator } = await import('./services/demoDataGenerator')
            await demoDataGenerator.generateComprehensiveDemoData()
            
            console.log('Demo data loaded successfully!')
          }
        } catch (error) {
          console.error('Failed to load initial demo data:', error)
        }
      }
      
      loadInitialData()
    }
  }, [isDbInitialized, appMeta])
  
  if (!isDbInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Initializing Kite...
          </p>
        </div>
      </div>
    )
  }
  
  // Show onboarding if tour not completed
  if (!tourProgress.completed) {
    return (
      <ErrorBoundary>
        <OnboardingFlow />
        <ToastContainer />
      </ErrorBoundary>
    )
  }
  
  // Show lock screen only if security is enabled AND app is locked
  // This prevents lock screen from appearing on first launch before PIN is set
  const securityEnabled = isPinEnabled() || isBiometricEnabled()
  if (isLocked && securityEnabled) {
    return (
      <ErrorBoundary>
        <LockScreen onUnlock={() => unlockApp()} />
        <ToastContainer />
      </ErrorBoundary>
    )
  }
  
  const isDevelopment = import.meta.env.DEV
  const { advanced } = useSettingsStore()
  const showDevTools = isDevelopment && advanced?.developerMode

  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL || '/'}>
        <Layout>
          <Routes>
            {/* Main pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/tx" element={<ActivityPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/:id" element={<AccountDetail />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/trends" element={<SpendingTrendsPage />} />
            <Route path="/reports" element={<FinancialReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <ToastContainer />
        
        {/* Developer Tools */}
        {showDevTools && (
          <Suspense fallback={null}>
            <DatabaseStatus />
          </Suspense>
        )}
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App