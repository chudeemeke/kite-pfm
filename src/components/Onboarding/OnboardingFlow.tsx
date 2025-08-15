import { useState } from 'react'
import { useUIStore } from '@/stores'
import { ChevronRight, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const { completeTour } = useUIStore()
  
  const steps = [
    {
      title: 'Welcome to Kite',
      description: 'Your personal finance manager that helps you track spending, manage budgets, and take control of your money.',
      icon: '🪁',
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🪁</div>
          <p className="text-gray-600 dark:text-gray-400">
            Kite makes managing your finances simple and intuitive. Let's get you started!
          </p>
        </div>
      )
    },
    {
      title: 'Track Your Spending',
      description: 'Monitor all your transactions across multiple accounts and categories.',
      icon: '📊',
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 dark:text-gray-400">
            View all your transactions in one place, with powerful filtering and categorization.
          </p>
        </div>
      )
    },
    {
      title: 'Smart Budgeting',
      description: 'Create budgets that automatically carry over unspent amounts or overspend.',
      icon: '🎯',
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-600 dark:text-gray-400">
            Set monthly budgets with intelligent carryover strategies to stay on track.
          </p>
        </div>
      )
    },
    {
      title: 'Automatic Rules',
      description: 'Set up rules to automatically categorize transactions as they come in.',
      icon: '⚡',
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-gray-600 dark:text-gray-400">
            Save time with smart rules that automatically organize your transactions.
          </p>
        </div>
      )
    },
    {
      title: 'Demo Data Loaded',
      description: 'We\'ve added some sample data to help you explore Kite\'s features.',
      icon: '✨',
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-gray-600 dark:text-gray-400">
            Explore the demo data to see how Kite works, then add your own accounts and transactions.
          </p>
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              💡 You can reset all data and start fresh in Settings
            </p>
          </div>
        </div>
      )
    }
  ]
  
  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  
  const handleNext = () => {
    if (isLastStep) {
      completeTour()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleSkip = () => {
    completeTour()
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index <= currentStep 
                    ? 'bg-primary-600' 
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
            ))}
          </div>
        </div>
        
        {/* Step content */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            {currentStepData.description}
          </p>
          
          {currentStepData.content}
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Skip tour
          </button>
          
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="btn-secondary"
              >
                Previous
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="btn-primary flex items-center gap-2"
            >
              {isLastStep ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow