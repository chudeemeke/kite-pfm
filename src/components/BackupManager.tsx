import { useState, useEffect } from 'react'
import { toast } from '@/stores'
import { 
  Cloud,
  Download,
  Upload,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Archive,
  Clock
} from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { formatRelativeDate, formatFileSize } from '@/services'

interface BackupManagerProps {
  onClose?: () => void
}

interface Backup {
  id: string
  name: string
  createdAt: Date
  size: number
  type: 'manual' | 'automatic'
  data: {
    accounts: number
    transactions: number
    categories: number
    budgets: number
  }
}

const BackupManager = ({ onClose }: BackupManagerProps) => {
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    setIsLoading(true)
    try {
      // Load backups from localStorage
      const savedBackups = localStorage.getItem('kite-backups')
      if (savedBackups) {
        const parsed = JSON.parse(savedBackups)
        setBackups(parsed.map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt)
        })))
      }
    } catch (error) {
      console.error('Failed to load backups:', error)
      toast.error('Failed to load backups', 'Please try again')
    } finally {
      setIsLoading(false)
    }
  }

  const saveBackups = (updatedBackups: Backup[]) => {
    try {
      localStorage.setItem('kite-backups', JSON.stringify(updatedBackups))
      setBackups(updatedBackups)
    } catch (error) {
      console.error('Failed to save backups:', error)
      toast.error('Failed to save backup list', 'Please try again')
    }
  }

  const createBackup = async () => {
    setIsCreating(true)
    try {
      // Gather data from all stores
      const allData = await gatherAppData()
      
      const backup: Backup = {
        id: generateBackupId(),
        name: `Backup ${new Date().toLocaleDateString()}`,
        createdAt: new Date(),
        size: JSON.stringify(allData).length,
        type: 'manual',
        data: {
          accounts: allData.accounts?.length || 0,
          transactions: allData.transactions?.length || 0,
          categories: allData.categories?.length || 0,
          budgets: allData.budgets?.length || 0
        }
      }
      
      // Store backup data
      localStorage.setItem(`kite-backup-${backup.id}`, JSON.stringify(allData))
      
      // Update backup list
      const updatedBackups = [backup, ...backups]
      saveBackups(updatedBackups)
      
      toast.success('Backup created', `Successfully created backup with ${backup.data.transactions} transactions`)
    } catch (error) {
      console.error('Failed to create backup:', error)
      toast.error('Failed to create backup', 'Please try again')
    } finally {
      setIsCreating(false)
    }
  }

  const restoreBackup = async (backupId: string) => {
    setIsRestoring(true)
    try {
      // Get backup data
      const backupData = localStorage.getItem(`kite-backup-${backupId}`)
      if (!backupData) {
        throw new Error('Backup data not found')
      }
      
      const data = JSON.parse(backupData)
      
      // Restore data to IndexedDB
      await restoreAppData(data)
      
      toast.success('Backup restored', 'Your data has been restored successfully')
      setRestoreConfirm(null)
      
      // Refresh the page to reload all data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Failed to restore backup:', error)
      toast.error('Failed to restore backup', 'Please try again')
      setRestoreConfirm(null)
    } finally {
      setIsRestoring(false)
    }
  }

  const deleteBackup = async (backupId: string) => {
    try {
      // Remove backup data
      localStorage.removeItem(`kite-backup-${backupId}`)
      
      // Update backup list
      const updatedBackups = backups.filter(b => b.id !== backupId)
      saveBackups(updatedBackups)
      
      toast.success('Backup deleted', 'Backup has been permanently removed')
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete backup:', error)
      toast.error('Failed to delete backup', 'Please try again')
      setDeleteConfirm(null)
    }
  }

  const exportBackup = async (backupId: string) => {
    try {
      const backupData = localStorage.getItem(`kite-backup-${backupId}`)
      if (!backupData) {
        throw new Error('Backup data not found')
      }
      
      const backup = backups.find(b => b.id === backupId)
      const filename = `kite-backup-${backup?.name.replace(/\s+/g, '-').toLowerCase()}-${backupId.slice(0, 8)}.json`
      
      // Download backup file
      const blob = new Blob([backupData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Backup exported', `Downloaded ${filename}`)
    } catch (error) {
      console.error('Failed to export backup:', error)
      toast.error('Failed to export backup', 'Please try again')
    }
  }

  const importBackup = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const content = await file.text()
        const data = JSON.parse(content)
        
        // Validate backup data structure
        if (!data.accounts || !data.transactions) {
          throw new Error('Invalid backup file format')
        }
        
        const backup: Backup = {
          id: generateBackupId(),
          name: `Imported ${file.name}`,
          createdAt: new Date(),
          size: content.length,
          type: 'manual',
          data: {
            accounts: data.accounts?.length || 0,
            transactions: data.transactions?.length || 0,
            categories: data.categories?.length || 0,
            budgets: data.budgets?.length || 0
          }
        }
        
        // Store backup data
        localStorage.setItem(`kite-backup-${backup.id}`, content)
        
        // Update backup list
        const updatedBackups = [backup, ...backups]
        saveBackups(updatedBackups)
        
        toast.success('Backup imported', `Successfully imported backup with ${backup.data.transactions} transactions`)
      } catch (error) {
        console.error('Failed to import backup:', error)
        toast.error('Failed to import backup', 'Please check the file format and try again')
      }
    }
    input.click()
  }

  const clearOldBackups = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const oldBackups = backups.filter(b => b.createdAt < thirtyDaysAgo)
    if (oldBackups.length === 0) {
      toast.info('No old backups', 'No backups older than 30 days found')
      return
    }
    
    // Remove old backup data
    oldBackups.forEach(backup => {
      localStorage.removeItem(`kite-backup-${backup.id}`)
    })
    
    // Update backup list
    const updatedBackups = backups.filter(b => b.createdAt >= thirtyDaysAgo)
    saveBackups(updatedBackups)
    
    toast.success('Old backups cleared', `Removed ${oldBackups.length} backups older than 30 days`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Backup Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage backups of your financial data
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={importBackup}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          
          <button
            onClick={createBackup}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isCreating ? <LoadingSpinner size="sm" /> : <Cloud className="w-4 h-4" />}
            Create Backup
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Storage Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Archive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">Total Backups</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {backups.length}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-900 dark:text-green-100">Storage Used</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatFileSize(backups.reduce((total, backup) => total + backup.size, 0))}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-900 dark:text-purple-100">Latest Backup</span>
          </div>
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
            {backups.length > 0 ? formatRelativeDate(backups[0].createdAt) : 'None'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={clearOldBackups}
          className="flex items-center gap-2 px-3 py-2 text-sm text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear Old Backups (30+ days)
        </button>
        
        <button
          onClick={loadBackups}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Backups List */}
      {backups.length > 0 ? (
        <div className="space-y-3">
          {backups.map((backup) => (
            <div key={backup.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {backup.name}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      backup.type === 'automatic'
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    }`}>
                      {backup.type}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <div>
                      <span className="block font-medium">Accounts</span>
                      <span>{backup.data.accounts}</span>
                    </div>
                    <div>
                      <span className="block font-medium">Transactions</span>
                      <span>{backup.data.transactions}</span>
                    </div>
                    <div>
                      <span className="block font-medium">Categories</span>
                      <span>{backup.data.categories}</span>
                    </div>
                    <div>
                      <span className="block font-medium">Budgets</span>
                      <span>{backup.data.budgets}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatRelativeDate(backup.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-4 h-4" />
                      {formatFileSize(backup.size)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportBackup(backup.id)}
                    className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                    title="Export backup"
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                  </button>
                  
                  <button
                    onClick={() => setRestoreConfirm(backup.id)}
                    className="p-2 rounded hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                    title="Restore backup"
                  >
                    <RefreshCw className="w-4 h-4 text-green-500" />
                  </button>
                  
                  <button
                    onClick={() => setDeleteConfirm(backup.id)}
                    className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete backup"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No backups yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first backup to protect your financial data
          </p>
          <button
            onClick={createBackup}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mx-auto disabled:opacity-50"
          >
            {isCreating ? <LoadingSpinner size="sm" /> : <Cloud className="w-4 h-4" />}
            Create Backup
          </button>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Restore Backup
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This will replace all current data
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to restore this backup? Your current data will be completely replaced and cannot be recovered.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setRestoreConfirm(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => restoreBackup(restoreConfirm)}
                disabled={isRestoring}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {isRestoring ? <LoadingSpinner size="sm" /> : 'Restore Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Delete Backup
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to permanently delete this backup? You will not be able to restore your data from this backup.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteBackup(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
const generateBackupId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

const gatherAppData = async () => {
  // In a real implementation, this would gather data from all stores/IndexedDB
  // For now, return mock data structure
  return {
    accounts: JSON.parse(localStorage.getItem('kite-accounts') || '[]'),
    transactions: JSON.parse(localStorage.getItem('kite-transactions') || '[]'),
    categories: JSON.parse(localStorage.getItem('kite-categories') || '[]'),
    budgets: JSON.parse(localStorage.getItem('kite-budgets') || '[]'),
    settings: JSON.parse(localStorage.getItem('kite-settings-store') || '{}'),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }
}

const restoreAppData = async (data: any) => {
  // In a real implementation, this would restore data to IndexedDB
  // For now, just restore to localStorage
  if (data.accounts) localStorage.setItem('kite-accounts', JSON.stringify(data.accounts))
  if (data.transactions) localStorage.setItem('kite-transactions', JSON.stringify(data.transactions))
  if (data.categories) localStorage.setItem('kite-categories', JSON.stringify(data.categories))
  if (data.budgets) localStorage.setItem('kite-budgets', JSON.stringify(data.budgets))
  if (data.settings) localStorage.setItem('kite-settings-store', JSON.stringify(data.settings))
}

export default BackupManager