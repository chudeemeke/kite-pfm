import { useState, useEffect } from 'react'
import { db } from '@/db/schema'
import { Database, RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface TableInfo {
  name: string
  count: number
  status: 'loading' | 'ready' | 'error'
}

export const DatabaseStatus = () => {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dbVersion, setDbVersion] = useState<number>(0)
  const [totalSize, setTotalSize] = useState<string>('calculating...')

  const loadTableInfo = async () => {
    setIsLoading(true)
    try {
      const tableInfo: TableInfo[] = []
      
      for (const table of db.tables) {
        try {
          const count = await table.count()
          tableInfo.push({
            name: table.name,
            count,
            status: 'ready'
          })
        } catch (error) {
          tableInfo.push({
            name: table.name,
            count: 0,
            status: 'error'
          })
        }
      }
      
      setTables(tableInfo)
      setDbVersion(db.verno)
      
      // Estimate database size
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        if (estimate.usage) {
          const sizeInMB = (estimate.usage / (1024 * 1024)).toFixed(2)
          setTotalSize(`${sizeInMB} MB`)
        }
      }
    } catch (error) {
      console.error('Failed to load table info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTableInfo()
  }, [])

  const handleClearTable = async (tableName: string) => {
    try {
      const table = db.table(tableName)
      await table.clear()
      await loadTableInfo()
    } catch (error) {
      console.error(`Failed to clear table ${tableName}:`, error)
    }
  }

  const getTotalRecords = () => {
    return tables.reduce((sum, table) => sum + table.count, 0)
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Database Status
        </h3>
        <button
          onClick={loadTableInfo}
          disabled={isLoading}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Version:</span>
          <span className="font-mono text-gray-900 dark:text-gray-100">v{dbVersion}</span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Total Size:</span>
          <span className="font-mono text-gray-900 dark:text-gray-100">{totalSize}</span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Total Records:</span>
          <span className="font-mono text-gray-900 dark:text-gray-100">{getTotalRecords().toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-3 max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-1 text-gray-600 dark:text-gray-400">Table</th>
              <th className="text-center py-1 text-gray-600 dark:text-gray-400">Records</th>
              <th className="text-center py-1 text-gray-600 dark:text-gray-400">Status</th>
              <th className="text-center py-1 text-gray-600 dark:text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr key={table.name} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-1 text-gray-900 dark:text-gray-100 font-mono text-xs">
                  {table.name}
                </td>
                <td className="text-center py-1 text-gray-700 dark:text-gray-300">
                  {table.count.toLocaleString()}
                </td>
                <td className="text-center py-1">
                  {table.status === 'ready' ? (
                    <CheckCircle className="w-3 h-3 text-green-500 inline" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500 inline" />
                  )}
                </td>
                <td className="text-center py-1">
                  <button
                    onClick={() => handleClearTable(table.name)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors"
                    title={`Clear ${table.name} table`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={async () => {
            const { testDatabaseOperations } = await import('@/utils/testDatabaseOperations')
            await testDatabaseOperations.runAllTests()
            await loadTableInfo()
          }}
          className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          Run Tests
        </button>
        <button
          onClick={async () => {
            const { demoDataGenerator } = await import('@/services/demoDataGenerator')
            await demoDataGenerator.generateComprehensiveDemoData()
            await loadTableInfo()
          }}
          className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
        >
          Load Demo
        </button>
      </div>
    </div>
  )
}

export default DatabaseStatus