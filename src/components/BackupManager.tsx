import { useState, useEffect } from 'react'
import { toast } from '@/stores'
import { 
  Cloud,
  Upload,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Archive,
  Clock,
  FileDown,
  FileUp,
  Shield
} from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { formatRelativeDate, formatFileSize } from '@/services'
import { backupService } from '@/services/backup'
import type { Backup } from '@/types'

interface BackupManagerProps {
  onClose?: () => void
}

const BackupManager = ({ onClose }: BackupManagerProps) => {
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null)
  const [backupName, setBackupName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    setIsLoading(true)
    try {
      const allBackups = await backupService.getAllBackups()
      setBackups(allBackups)
    } catch (error) {
      console.error('Failed to load backups:', error)
      toast.error('Failed to load backups', 'Please try again')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    if (!backupName.trim() && showNameInput) {
      toast.error('Invalid name', 'Please enter a backup name')
      return
    }

    setIsCreating(true)
    try {
      const backup = await backupService.createBackup(
        backupName.trim() || undefined,
        'manual'
      )
      
      toast.success('Backup created', `${backup.name} has been created successfully`)
      
      // Reload backups list
      await loadBackups()
      
      // Reset form
      setBackupName('')
      setShowNameInput(false)
    } catch (error) {
      console.error('Failed to create backup:', error)
      toast.error('Backup failed', 'Failed to create backup. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    setIsRestoring(true)
    try {
      await backupService.restoreBackup(backupId)
      
      toast.success('Restore complete', 'Your data has been restored successfully')
      
      // Reload the app to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Failed to restore backup:', error)
      toast.error('Restore failed', 'Failed to restore backup. Please try again.')
    } finally {
      setIsRestoring(false)
      setRestoreConfirm(null)
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await backupService.deleteBackup(backupId)
      
      toast.success('Backup deleted', 'The backup has been removed')
      
      // Reload backups list
      await loadBackups()
    } catch (error) {
      console.error('Failed to delete backup:', error)
      toast.error('Delete failed', 'Failed to delete backup. Please try again.')
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleExportBackup = async (backup: Backup) => {
    try {
      const blob = await backupService.exportBackup(backup.id)
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `kite-backup-${backup.name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Export complete', 'Backup has been exported to file')
    } catch (error) {
      console.error('Failed to export backup:', error)
      toast.error('Export failed', 'Failed to export backup. Please try again.')
    }
  }

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsCreating(true)
    try {
      const backup = await backupService.importBackup(file)
      
      toast.success('Import complete', `${backup.name} has been imported successfully`)
      
      // Reload backups list
      await loadBackups()
    } catch (error) {
      console.error('Failed to import backup:', error)
      toast.error('Import failed', 'Failed to import backup. Please check the file and try again.')
    } finally {
      setIsCreating(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const getBackupIcon = (type: 'manual' | 'automatic') => {
    return type === 'automatic' ? 
      <RefreshCw className="w-4 h-4" /> : 
      <Archive className="w-4 h-4" />
  }

  const getBackupTypeLabel = (type: 'manual' | 'automatic') => {
    return type === 'automatic' ? 'Automatic' : 'Manual'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-xl">
                <Cloud className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Backup Manager
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create and manage your data backups
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            {showNameInput ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="Enter backup name (optional)"
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500"
                  disabled={isCreating}
                />
                <button
                  onClick={handleCreateBackup}
                  disabled={isCreating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNameInput(false)
                    setBackupName('')
                  }}
                  disabled={isCreating}
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowNameInput(true)}
                  disabled={isCreating}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Create Backup
                    </>
                  )}
                </button>
                
                <label className="flex-1 sm:flex-initial px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <FileUp className="w-4 h-4" />
                  Import Backup
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                    disabled={isCreating}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Backups List */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 220px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <HardDrive className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                No backups yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create your first backup to protect your data
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getBackupIcon(backup.type)}
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {backup.name}
                        </h4>
                        <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          {getBackupTypeLabel(backup.type)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatRelativeDate(backup.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatFileSize(backup.size)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {backup.metadata.accounts} accounts, {backup.metadata.transactions} transactions
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {restoreConfirm === backup.id ? (
                        <>
                          <button
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={isRestoring}
                            className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isRestoring ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              'Confirm'
                            )}
                          </button>
                          <button
                            onClick={() => setRestoreConfirm(null)}
                            disabled={isRestoring}
                            className="px-3 py-1.5 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : deleteConfirm === backup.id ? (
                        <>
                          <button
                            onClick={() => handleDeleteBackup(backup.id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setRestoreConfirm(backup.id)}
                            disabled={isRestoring}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Restore backup"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExportBackup(backup)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Export backup"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(backup.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete backup"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {restoreConfirm === backup.id && (
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                        <div className="text-sm text-orange-800 dark:text-orange-200">
                          <p className="font-medium mb-1">Restore this backup?</p>
                          <p className="text-xs">
                            This will replace all your current data with the backup data.
                            This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Backups are stored securely in your browser's database</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackupManager