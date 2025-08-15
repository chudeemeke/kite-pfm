import { useUIStore } from '@/stores'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContainer = () => {
  const { toasts, removeToast } = useUIStore()
  
  if (toasts.length === 0) return null
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastProps {
  toast: {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    description?: string
  }
  onDismiss: () => void
}

const Toast = ({ toast, onDismiss }: ToastProps) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }
  
  const styles = {
    success: 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-800 dark:text-success-200',
    error: 'bg-danger-50 border-danger-200 text-danger-800 dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-200',
    warning: 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-200',
    info: 'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-200'
  }
  
  const iconStyles = {
    success: 'text-success-600 dark:text-success-400',
    error: 'text-danger-600 dark:text-danger-400',
    warning: 'text-warning-600 dark:text-warning-400',
    info: 'text-primary-600 dark:text-primary-400'
  }
  
  const Icon = icons[toast.type]
  
  return (
    <div
      className={cn(
        'max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 animate-slide-down',
        styles[toast.type]
      )}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={cn('w-5 h-5', iconStyles[toast.type])} />
        </div>
        
        <div className="ml-3 flex-1">
          <p className="font-medium">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-sm opacity-80">
              {toast.description}
            </p>
          )}
        </div>
        
        <button
          onClick={onDismiss}
          className="ml-4 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default ToastContainer