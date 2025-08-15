import { ReactNode } from 'react'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

/**
 * Props for the Layout component
 */
interface LayoutProps {
  /** The content to be rendered within the layout */
  children: ReactNode
}

/**
 * Main layout component that provides the overall structure for the Kite application.
 * 
 * This component creates a mobile-first layout with a fixed top bar, scrollable main content area,
 * and a fixed bottom navigation. It handles the spacing and positioning for mobile devices with
 * safe area considerations.
 * 
 * @param props - The component props
 * @param props.children - React nodes to be rendered in the main content area
 * @returns JSX element representing the complete application layout
 * 
 * @example
 * ```tsx
 * import Layout from '@/components/Layout/Layout'
 * 
 * function App() {
 *   return (
 *     <Layout>
 *       <div>Your page content here</div>
 *     </Layout>
 *   )
 * }
 * ```
 * 
 * @remarks
 * - Uses a fixed top bar (64px height) and bottom navigation (80px height)
 * - Main content has responsive max-width and is centered
 * - Supports dark mode through Tailwind CSS classes
 * - Optimized for mobile-first responsive design
 */
const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar />
      
      <main className="pb-20 pt-16">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>
      
      <BottomNav />
    </div>
  )
}

export default Layout