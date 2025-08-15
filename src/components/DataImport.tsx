import { useState, useRef } from 'react'
import { useTransactionsStore, toast } from '@/stores'
import { csvService } from '@/services/csv'
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Download,
  ArrowRight,
  FileText,
  AlertTriangle
} from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { formatCurrency, formatRelativeDate } from '@/services'
import type { CSVMapping, ImportPreview } from '@/types'

interface DataImportProps {
  onClose?: () => void
}

const DataImport = ({ onClose }: DataImportProps) => {
  const { fetchTransactions } = useTransactionsStore()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'import'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<CSVMapping>({
    date: '',
    amount: '',
    description: '',
    merchant: '',
    category: '',
    account: ''
  })
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setIsLoading(true)
    
    try {
      const content = await selectedFile.text()
      const data = csvService.parseCSV(content)
      
      if (data.length === 0) {
        toast.error('Invalid CSV file', 'The file appears to be empty or invalid')
        return
      }
      
      // Get headers from the first row that was parsed
      const fileHeaders = Object.keys(data[0])
      setHeaders(fileHeaders)
      setCsvData(data)
      
      // Auto-infer mapping
      const inferredMapping = csvService.inferColumnMapping(fileHeaders)
      setMapping({
        date: inferredMapping.date || '',
        amount: inferredMapping.amount || '',
        description: inferredMapping.description || '',
        merchant: inferredMapping.merchant || '',
        category: inferredMapping.category || '',
        account: inferredMapping.account || ''
      })
      
      setStep('mapping')
      toast.success('File uploaded', `Loaded ${data.length} rows from ${selectedFile.name}`)
    } catch (error) {
      toast.error('Failed to read file', 'Please check the file format and try again')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find(f => f.type === 'text/csv' || f.name.endsWith('.csv'))
    
    if (csvFile) {
      handleFileSelect(csvFile)
    } else {
      toast.error('Invalid file type', 'Please select a CSV file')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const generatePreview = async () => {
    if (!csvData.length || !mapping.date || !mapping.amount || !mapping.description) {
      toast.error('Missing required fields', 'Please map at least Date, Amount, and Description')
      return
    }
    
    setIsLoading(true)
    try {
      const previewData = await csvService.previewImport(csvData, mapping as CSVMapping)
      setPreview(previewData)
      setStep('preview')
      toast.success('Preview generated', `${previewData.validRows} valid transactions found`)
    } catch (error) {
      toast.error('Failed to generate preview', 'Please check your mapping and try again')
    } finally {
      setIsLoading(false)
    }
  }

  const performImport = async () => {
    if (!csvData.length || !preview) return
    
    setIsLoading(true)
    try {
      const result = await csvService.importTransactions(csvData, mapping as CSVMapping, {
        deduplication: true,
        dryRun: false
      })
      
      setImportResult(result)
      setStep('import')
      
      // Refresh transactions
      await fetchTransactions()
      
      toast.success(
        'Import completed', 
        `Imported ${result.imported} transactions, skipped ${result.skipped} duplicates`
      )
    } catch (error) {
      toast.error('Import failed', 'Please try again')
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setFile(null)
    setCsvData([])
    setHeaders([])
    setMapping({
      date: '',
      amount: '',
      description: '',
      merchant: '',
      category: '',
      account: ''
    })
    setPreview(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Date', 'Amount', 'Description', 'Merchant', 'Category', 'Account'],
      ['01/12/2024', '-25.99', 'Grocery shopping', 'Tesco', 'Groceries', 'Main Account'],
      ['02/12/2024', '-4.50', 'Coffee', 'Starbucks', 'Food & Drink', 'Main Account'],
      ['03/12/2024', '2500.00', 'Salary payment', 'Company Ltd', 'Income', 'Main Account']
    ]
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n')
    csvService.downloadCSV(csvContent, 'kite-sample-transactions.csv')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Import Data
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Import transactions from CSV files
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Sample CSV
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

      {/* Steps Indicator */}
      <div className="flex items-center gap-4">
        {['upload', 'mapping', 'preview', 'import'].map((stepName, index) => (
          <div key={stepName} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === stepName 
                ? 'bg-primary-600 text-white' 
                : index < ['upload', 'mapping', 'preview', 'import'].indexOf(step)
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {index < ['upload', 'mapping', 'preview', 'import'].indexOf(step) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`text-sm font-medium capitalize ${
              step === stepName 
                ? 'text-gray-900 dark:text-gray-100' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {stepName}
            </span>
            {index < 3 && <ArrowRight className="w-4 h-4 text-gray-400" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="card p-6">
        {step === 'upload' && (
          <div className="space-y-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Upload CSV File
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Choose File'}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                CSV Format Requirements
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• File must have headers in the first row</li>
                <li>• Required columns: Date, Amount, Description</li>
                <li>• Optional columns: Merchant, Category, Account</li>
                <li>• Date format: DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD</li>
                <li>• Amount can include currency symbols and commas</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <File className="w-5 h-5 text-green-500" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {file?.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {csvData.length} rows • {headers.length} columns
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Map CSV Columns
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'date', label: 'Date *', required: true },
                  { key: 'amount', label: 'Amount *', required: true },
                  { key: 'description', label: 'Description *', required: true },
                  { key: 'merchant', label: 'Merchant', required: false },
                  { key: 'category', label: 'Category', required: false },
                  { key: 'account', label: 'Account', required: false }
                ].map(({ key, label, required }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {label}
                    </label>
                    <select
                      value={mapping[key as keyof CSVMapping] || ''}
                      onChange={(e) => setMapping(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required={required}
                    >
                      <option value="">Select column...</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            
            {csvData.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Data Preview (First 3 rows)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {headers.map(header => (
                          <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {csvData.slice(0, 3).map((row, index) => (
                        <tr key={index}>
                          {headers.map(header => (
                            <td key={header} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={generatePreview}
                disabled={!mapping.date || !mapping.amount || !mapping.description || isLoading}
                className="flex-1 btn-primary"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Generate Preview'}
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Total Rows</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {preview.totalRows}
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-100">Valid</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {preview.validRows}
                </p>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-red-900 dark:text-red-100">Errors</span>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {preview.errors.length}
                </p>
              </div>
            </div>
            
            {preview.sample.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Sample Valid Transactions
                </h4>
                <div className="space-y-2">
                  {preview.sample.map((transaction, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">
                            {transaction.description}
                          </h5>
                          {transaction.merchant && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.merchant}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatRelativeDate(transaction.date)}
                          </p>
                        </div>
                        <p className={`font-semibold ${
                          transaction.amount >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.amount >= 0 ? '+' : ''}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {preview.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Import Errors (First 10)
                </h4>
                <div className="space-y-2">
                  {preview.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        Row {error.row}: {error.message}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Field: {error.field}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Mapping
              </button>
              <button
                onClick={performImport}
                disabled={preview.validRows === 0 || isLoading}
                className="flex-1 btn-primary"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : `Import ${preview.validRows} Transactions`}
              </button>
            </div>
          </div>
        )}

        {step === 'import' && importResult && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Import Completed!
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your transactions have been successfully imported
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  Imported
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {importResult.imported}
                </p>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Skipped
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {importResult.skipped}
                </p>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  Errors
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {importResult.errors.length}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Import Another File
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="btn-primary"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataImport