/**
 * Financial Reports Page
 * Comprehensive financial reporting with monthly, quarterly, and yearly analysis
 * Professional enterprise-grade reporting interface
 */

import { useState, useEffect, useRef } from 'react'
import { 
  Calendar, Download, FileText, TrendingUp, TrendingDown, 
  DollarSign, PieChart, BarChart3, Activity, Target,
  Printer, Mail, Share2, Filter, ChevronDown, ChevronRight,
  Clock, AlertCircle, CheckCircle, Info, Settings,
  Eye, EyeOff, Maximize2, Grid, List, BookOpen
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  subMonths,
  subYears,
  eachMonthOfInterval,
  getQuarter
} from 'date-fns'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercentage } from '@/services/format'
import { 
  financialReportsService,
  type MonthlyReport,
  type YearlyReport,
  type QuarterlyReport,
  type CustomReport,
  type ReportExportOptions
} from '@/services/financialReports'
import { useSettingsStore } from '@/stores/settings'
import LoadingSpinner from '@/components/LoadingSpinner'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
]

interface ReportFilters {
  dateRange: 'month' | 'quarter' | 'year' | 'custom'
  selectedMonth?: Date
  selectedQuarter?: { year: number; quarter: number }
  selectedYear?: number
  customStartDate?: Date
  customEndDate?: Date
  includeComparison: boolean
  showDetails: boolean
  groupBy: 'category' | 'merchant' | 'account'
}

export default function FinancialReports() {
  const { privacy } = useSettingsStore()
  const privacyMode = privacy?.privacyMode || false
  const reportRef = useRef<HTMLDivElement>(null)

  // State management
  const [loading, setLoading] = useState(false)
  const [activeReportType, setActiveReportType] = useState<'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly')
  const [currentReport, setCurrentReport] = useState<MonthlyReport | YearlyReport | QuarterlyReport | CustomReport | null>(null)
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month',
    selectedMonth: new Date(),
    selectedYear: new Date().getFullYear(),
    selectedQuarter: { year: new Date().getFullYear(), quarter: getQuarter(new Date()) },
    includeComparison: true,
    showDetails: true,
    groupBy: 'category'
  })
  
  // UI State
  const [viewMode, setViewMode] = useState<'dashboard' | 'detailed' | 'print'>('dashboard')
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [exportFormat, setExportFormat] = useState<ReportExportOptions['format']>('pdf')
  const [selectedSection, setSelectedSection] = useState<string>('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'income', 'expenses']))
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [emailRecipients, setEmailRecipients] = useState<string[]>([])

  // Load report on mount and filter changes
  useEffect(() => {
    loadReport()
  }, [activeReportType, filters.selectedMonth, filters.selectedQuarter, filters.selectedYear])

  const loadReport = async () => {
    setLoading(true)
    try {
      let report
      
      switch (activeReportType) {
        case 'monthly':
          report = await financialReportsService.generateMonthlyReport(
            filters.selectedMonth || new Date()
          )
          break
        case 'quarterly':
          report = await financialReportsService.generateQuarterlyReport(
            filters.selectedQuarter?.year || new Date().getFullYear(),
            filters.selectedQuarter?.quarter || 1
          )
          break
        case 'yearly':
          report = await financialReportsService.generateYearlyReport(
            filters.selectedYear || new Date().getFullYear()
          )
          break
        case 'custom':
          if (filters.customStartDate && filters.customEndDate) {
            report = await financialReportsService.generateCustomReport(
              'Custom Report',
              filters.customStartDate,
              filters.customEndDate
            )
          }
          break
      }
      
      setCurrentReport(report || null)
    } catch (error) {
      console.error('Failed to load report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!currentReport) return

    const options: ReportExportOptions = {
      format: exportFormat,
      includeTransactions: true,
      includeCharts: exportFormat === 'pdf',
      includeSummary: true,
      dateFormat: 'yyyy-MM-dd',
      currencyFormat: 'USD',
      language: 'en'
    }

    try {
      const blob = await financialReportsService.exportReport(currentReport, options)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handlePrint = () => {
    setViewMode('print')
    setTimeout(() => {
      window.print()
      setViewMode('dashboard')
    }, 100)
  }

  const handleShare = async () => {
    if (navigator.share && currentReport) {
      try {
        await navigator.share({
          title: `Financial Report - ${format(new Date(), 'MMMM yyyy')}`,
          text: `Check out my financial report for ${format(new Date(), 'MMMM yyyy')}`,
          url: window.location.href
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Generating comprehensive report...
          </p>
        </div>
      </div>
    )
  }

  // Prepare chart data for monthly report
  const getMonthlyChartData = () => {
    if (!currentReport || !('income' in currentReport)) return []
    
    const report = currentReport as MonthlyReport
    return Object.entries(report.expenses.byCategory).map(([categoryId, amount]) => ({
      name: categoryId,
      value: amount
    }))
  }

  // Render report sections based on type
  const renderReportContent = () => {
    if (!currentReport) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No Report Generated
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Select a date range and generate a report to view insights
          </p>
        </div>
      )
    }

    if ('monthString' in currentReport) {
      // Monthly Report
      const report = currentReport as MonthlyReport
      
      return (
        <div className="space-y-6">
          {/* Executive Summary */}
          {expandedSections.has('overview') && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Executive Summary - {report.monthString}
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {privacyMode ? '••••' : formatCurrency(report.income.total)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Income</div>
                    <div className={cn(
                      'text-xs mt-2 flex items-center justify-center gap-1',
                      report.income.trend > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {report.income.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(report.income.trend).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {privacyMode ? '••••' : formatCurrency(report.expenses.total)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Expenses</div>
                    <div className={cn(
                      'text-xs mt-2 flex items-center justify-center gap-1',
                      report.expenses.trend > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {report.expenses.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(report.expenses.trend).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={cn(
                      'text-3xl font-bold',
                      report.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {privacyMode ? '••••' : formatCurrency(report.netIncome)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Net Income</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {report.netIncome >= 0 ? 'Surplus' : 'Deficit'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {report.savingsRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Savings Rate</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {report.savingsRate >= 20 ? 'Excellent' : report.savingsRate >= 10 ? 'Good' : 'Needs Improvement'}
                    </div>
                  </div>
                </div>

                {/* Key Insights */}
                {report.insights.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                          Key Insights
                        </h4>
                        <ul className="space-y-1">
                          {report.insights.map((insight, index) => (
                            <li key={index} className="text-sm text-blue-800 dark:text-blue-200">
                              • {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {report.recommendations.length > 0 && (
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-900 dark:text-amber-300 mb-2">
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {report.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-amber-800 dark:text-amber-200">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Budget Performance */}
          {expandedSections.has('budget') && report.budgetPerformance && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Budget Performance
                </h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Overall Budget Utilization</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {((report.budgetPerformance.totalSpent / report.budgetPerformance.totalBudgeted) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={cn(
                        'h-3 rounded-full transition-all duration-500',
                        report.budgetPerformance.totalSpent > report.budgetPerformance.totalBudgeted
                          ? 'bg-red-500'
                          : report.budgetPerformance.totalSpent > report.budgetPerformance.totalBudgeted * 0.9
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      )}
                      style={{ 
                        width: `${Math.min(100, (report.budgetPerformance.totalSpent / report.budgetPerformance.totalBudgeted) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {report.budgetPerformance.categoryPerformance.map((category, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {category.categoryName}
                          </span>
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            category.percentUsed > 100
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : category.percentUsed > 90
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          )}>
                            {category.percentUsed.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{privacyMode ? '••••' : formatCurrency(category.spent)}</span>
                          <span>/</span>
                          <span>{privacyMode ? '••••' : formatCurrency(category.budgeted)}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div 
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-500',
                              category.percentUsed > 100
                                ? 'bg-red-500'
                                : category.percentUsed > 90
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                            )}
                            style={{ 
                              width: `${Math.min(100, category.percentUsed)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category Breakdown Chart */}
          {expandedSections.has('categories') && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Expense Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getMonthlyChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getMonthlyChartData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => privacyMode ? '••••' : formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Expenses */}
          {expandedSections.has('expenses') && report.topExpenses.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Top Expenses
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {report.topExpenses.slice(0, 10).map((expense, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {expense.description}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {format(expense.date, 'MMM dd, yyyy')} • {expense.merchant || 'Unknown'} • {expense.category || 'Uncategorized'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {privacyMode ? '••••' : formatCurrency(expense.amount)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {((expense.amount / report.expenses.total) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    // Add similar rendering for yearly and quarterly reports
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Report type not yet implemented
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      'min-h-screen bg-gray-50 dark:bg-gray-900',
      viewMode === 'print' && 'print:bg-white'
    )}>
      {/* Professional Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Financial Reports
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Comprehensive financial analysis and reporting
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* View Mode Selector */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded transition-colors',
                    viewMode === 'dashboard'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  <Grid className="w-3 h-3 inline mr-1" />
                  Dashboard
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded transition-colors',
                    viewMode === 'detailed'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  <List className="w-3 h-3 inline mr-1" />
                  Detailed
                </button>
              </div>

              {/* Schedule Reports */}
              <button
                onClick={() => setShowScheduler(!showScheduler)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Schedule automatic reports"
              >
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Print */}
              <button
                onClick={handlePrint}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Printer className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Export */}
              <div className="relative">
                <button
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {showExportOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                    {(['pdf', 'excel', 'csv', 'json'] as const).map(format => (
                      <button
                        key={format}
                        onClick={() => {
                          setExportFormat(format)
                          handleExport()
                          setShowExportOptions(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Export as {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Report Type Selector */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex gap-2">
              {(['monthly', 'quarterly', 'yearly', 'custom'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setActiveReportType(type)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    activeReportType === type
                      ? 'bg-primary-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} Report
                </button>
              ))}
            </div>

            {/* Date Selector based on report type */}
            <div className="ml-auto flex items-center gap-2">
              {activeReportType === 'monthly' && (
                <input
                  type="month"
                  value={format(filters.selectedMonth || new Date(), 'yyyy-MM')}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-')
                    setFilters({
                      ...filters,
                      selectedMonth: new Date(parseInt(year), parseInt(month) - 1, 1)
                    })
                  }}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              )}
              
              {activeReportType === 'yearly' && (
                <select
                  value={filters.selectedYear}
                  onChange={(e) => setFilters({ ...filters, selectedYear: parseInt(e.target.value) })}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
              
              {activeReportType === 'quarterly' && (
                <div className="flex gap-2">
                  <select
                    value={filters.selectedQuarter?.year}
                    onChange={(e) => setFilters({
                      ...filters,
                      selectedQuarter: {
                        year: parseInt(e.target.value),
                        quarter: filters.selectedQuarter?.quarter || 1
                      }
                    })}
                    className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    value={filters.selectedQuarter?.quarter}
                    onChange={(e) => setFilters({
                      ...filters,
                      selectedQuarter: {
                        year: filters.selectedQuarter?.year || new Date().getFullYear(),
                        quarter: parseInt(e.target.value)
                      }
                    })}
                    className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <option value={1}>Q1</option>
                    <option value={2}>Q2</option>
                    <option value={3}>Q3</option>
                    <option value={4}>Q4</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section Toggles */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {['overview', 'budget', 'categories', 'expenses', 'trends', 'comparison'].map(section => (
              <button
                key={section}
                onClick={() => toggleSection(section)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                  expandedSections.has(section)
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}
              >
                {expandedSections.has(section) ? <Eye className="w-3 h-3 inline mr-1" /> : <EyeOff className="w-3 h-3 inline mr-1" />}
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-7xl mx-auto px-4 py-6" ref={reportRef}>
        {renderReportContent()}
      </div>

      {/* Schedule Modal */}
      {showScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Schedule Automatic Reports
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Frequency
                </label>
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Email Recipients
                </label>
                <input
                  type="email"
                  placeholder="Enter email addresses"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowScheduler(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Would implement scheduling logic here
                    setShowScheduler(false)
                  }}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}