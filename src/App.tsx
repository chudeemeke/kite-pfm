import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/schema'
import { useInitializeStores, useUIStore, useSettingsStore } from './stores'
import { demoService } from './services'
import { settingsService } from './services/settingsApplication'
import { notificationService } from './services/notifications'
import { securityService } from './services/security'

// Layout components
import Layout from './components/Layout/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import ToastContainer from './components/ToastContainer'

// Pages
import HomePage from './pages/Home'
import ActivityPage from './pages/Activity'
import BudgetsPage from './pages/Budgets'
import AccountsPage from './pages/Accounts'
import AccountDetail from './pages/AccountDetail'
import InsightsPage from './pages/Insights'
import SettingsPage from './pages/Settings'

// Onboarding
import OnboardingFlow from './components/Onboarding/OnboardingFlow'

function App() {
  const { initializeStores } = useInitializeStores()
  const tourProgress = useUIStore(state => state.tourProgress)
  const { privacy } = useSettingsStore()
  
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
      // Check if we need to seed demo data
      db.accounts.count().then(count => {
        if (count === 0) {
          demoService.seedDemoData().catch(console.error)
        }
      })
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
  
  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL || '/'}>
        <Layout>
          <Routes>
            {/* Main pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/tx" element={<ActivityPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/:id" element={<AccountDetail />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App