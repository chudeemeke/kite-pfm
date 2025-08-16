import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UIState, Toast } from '@/types'
import { createIndexedDBStorage } from './indexedDBStorageTyped'

interface UIStore extends UIState {
  // Theme actions
  setTheme: (theme: UIState['theme']) => void
  toggleTheme: () => void
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // Tour actions
  startTour: () => void
  completeTour: () => void
  setTourStep: (step: number) => void
  
  // General UI state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const generateToastId = () => `toast-${Date.now()}-${Math.random()}`

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      tourProgress: {
        completed: false
      },
      toasts: [],
      isLoading: false,

      // Theme actions
      setTheme: (theme) => {
        set({ theme })
        // Apply theme to document
        applyTheme(theme)
      },
      
      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },
      
      // Toast actions
      addToast: (toast) => {
        const id = generateToastId()
        const newToast: Toast = {
          ...toast,
          id,
          duration: toast.duration ?? 5000
        }
        
        set((state) => ({
          toasts: [...state.toasts, newToast]
        }))
        
        // Auto remove toast after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, newToast.duration)
        }
      },
      
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }))
      },
      
      clearToasts: () => {
        set({ toasts: [] })
      },
      
      // Tour actions
      startTour: () => {
        set({
          tourProgress: {
            completed: false,
            currentStep: 0
          }
        })
      },
      
      completeTour: () => {
        set({
          tourProgress: {
            completed: true,
            currentStep: undefined
          }
        })
      },
      
      setTourStep: (step) => {
        set((state) => ({
          tourProgress: {
            ...state.tourProgress,
            currentStep: step
          }
        }))
      },
      
      // General UI actions
      setIsLoading: (loading) => {
        set({ isLoading: loading })
      }
    }),
    {
      name: 'kite-ui-store',
      storage: createIndexedDBStorage<Pick<UIStore, 'theme' | 'tourProgress'>>(),
      partialize: (state) => ({
        theme: state.theme,
        tourProgress: state.tourProgress
      })
    }
  )
)

// Theme application helper
function applyTheme(theme: UIState['theme']) {
  const root = document.documentElement
  
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    root.classList.toggle('dark', systemTheme === 'dark')
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const store = useUIStore.getState()
  applyTheme(store.theme)
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.theme === 'system') {
      applyTheme('system')
    }
  })
}

// Export toast helper functions for easy usage
export const toast = {
  success: (title: string, description?: string) => {
    useUIStore.getState().addToast({ type: 'success', title, description })
  },
  error: (title: string, description?: string) => {
    useUIStore.getState().addToast({ type: 'error', title, description })
  },
  warning: (title: string, description?: string) => {
    useUIStore.getState().addToast({ type: 'warning', title, description })
  },
  info: (title: string, description?: string) => {
    useUIStore.getState().addToast({ type: 'info', title, description })
  }
}