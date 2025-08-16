/**
 * Spending Trends Page
 * Comprehensive visualization of spending patterns and analytics
 * Full implementation with interactive charts and real-time data
 */

import { useState, useEffect } from 'react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { 
  Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  AlertTriangle, ChevronRight, Download, Filter, Info,
  ArrowUp, ArrowDown, Minus, Clock, Target, Activity
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/services/format'
import { 
  spendingTrendsService,
  type TimeRange,
  type Granularity,
  type TrendDataPoint,
  type CategoryTrend,
  type MerchantAnalysis,
  type PeriodComparison,
  type SpendingPattern,
  type SpendingForecast,
  type AnomalyDetection
} from '@/services/spendingTrends'
import { useSettingsStore } from '@/stores/settings'
import LoadingSpinner from '@/components/LoadingSpinner'

const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
]

export default function SpendingTrends() {
  const { privacy } = useSettingsStore()
  const privacyMode = privacy?.privacyMode || false

  // State for data
  const [loading, setLoading] = useState(true)
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([])
  const [merchantAnalysis, setMerchantAnalysis] = useState<MerchantAnalysis[]>([])
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison | null>(null)
  const [spendingPattern, setSpendingPattern] = useState<SpendingPattern | null>(null)
  const [forecast, setForecast] = useState<SpendingForecast | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyDetection | null>(null)

  // State for filters
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [granularity, setGranularity] = useState<Granularity>('daily')
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'merchants' | 'patterns' | 'forecast' | 'anomalies'>('overview')

  // Load data on mount and when filters change
  useEffect(() => {
    loadData()
  }, [timeRange, granularity, comparisonPeriod])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load all data in parallel
      const [
        trends,
        categories,
        merchants,
        comparison,
        patterns,
        forecastData,
        anomalyData
      ] = await Promise.all([
        spendingTrendsService.getSpendingTrends(timeRange, granularity),
        spendingTrendsService.getCategoryTrends(3),
        spendingTrendsService.getMerchantAnalysis(6),
        spendingTrendsService.comparePeriods(comparisonPeriod),
        spendingTrendsService.analyzeSpendingPatterns(6),
        spendingTrendsService.generateForecast(6),
        spendingTrendsService.detectAnomalies(3)
      ])

      setTrendData(trends)
      setCategoryTrends(categories)
      setMerchantAnalysis(merchants)
      setPeriodComparison(comparison)
      setSpendingPattern(patterns)
      setForecast(forecastData)
      setAnomalies(anomalyData)
    } catch (error) {
      console.error('Failed to load spending trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      trendData,
      categoryTrends,
      merchantAnalysis,
      periodComparison,
      spendingPattern,
      forecast,
      anomalies
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spending-trends-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Prepare chart data
  const lineChartData = trendData.map(point => ({
    date: format(point.date, 'MMM dd'),
    amount: point.amount,
    average: point.average,
    count: point.count
  }))

  const categoryPieData = categoryTrends.slice(0, 8).map(trend => ({
    name: trend.categoryName,
    value: trend.currentMonth
  }))

  const dayOfWeekData = spendingPattern ? Object.entries(spendingPattern.dayOfWeek).map(([day, data]) => ({
    day,
    amount: data.total,
    average: data.average,
    count: data.count
  })) : []

  const forecastChartData = forecast ? [
    { month: 'Last Month', amount: periodComparison?.previous.total || 0 },
    { month: 'This Month', amount: periodComparison?.current.total || 0 },
    { month: 'Next Month (Predicted)', amount: forecast.nextMonth.predicted }
  ] : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Spending Trends
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Analyze your spending patterns and get insights
              </p>
            </div>
            <button
              onClick={exportData}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Time Range Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {(['week', 'month', 'quarter', 'year'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'categories', label: 'Categories', icon: DollarSign },
              { id: 'merchants', label: 'Merchants', icon: ShoppingCart },
              { id: 'patterns', label: 'Patterns', icon: Clock },
              { id: 'forecast', label: 'Forecast', icon: Target },
              { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Period Comparison Cards */}
            {periodComparison && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Spending</span>
                    {periodComparison.change.percent > 0 ? (
                      <ArrowUp className="w-4 h-4 text-red-500" />
                    ) : periodComparison.change.percent < 0 ? (
                      <ArrowDown className="w-4 h-4 text-green-500" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {privacyMode ? '••••' : formatCurrency(periodComparison.current.total)}
                  </div>
                  <div className={cn(
                    'text-sm mt-2',
                    periodComparison.change.percent > 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    {periodComparison.change.percent > 0 ? '+' : ''}{periodComparison.change.percent.toFixed(1)}%
                    <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Daily Average</span>
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {privacyMode ? '••••' : formatCurrency(periodComparison.current.daily)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {periodComparison.current.transactions} transactions
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Forecast</span>
                    <Target className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {privacyMode ? '••••' : formatCurrency(forecast?.nextMonth.predicted || 0)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {forecast?.nextMonth.confidence.toFixed(0)}% confidence
                  </div>
                </div>
              </div>
            )}

            {/* Spending Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Spending Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={lineChartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    style={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: 12 }}
                    tickFormatter={(value) => privacyMode ? '••' : `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => privacyMode ? '••••' : formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {anomalies && anomalies.outliers.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900 dark:text-orange-300">
                      Outliers
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                    {anomalies.outliers.length}
                  </div>
                  <div className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                    Unusual transactions
                  </div>
                </div>
              )}

              {categoryTrends.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Top Category
                    </span>
                  </div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-300 truncate">
                    {categoryTrends[0].categoryName}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    {privacyMode ? '••••' : formatCurrency(categoryTrends[0].currentMonth)}
                  </div>
                </div>
              )}

              {merchantAnalysis.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-300">
                      Top Merchant
                    </span>
                  </div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-300 truncate">
                    {merchantAnalysis[0].merchant}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                    {merchantAnalysis[0].frequency} visits
                  </div>
                </div>
              )}

              {forecast && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
                      Next Week
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {privacyMode ? '••••' : formatCurrency(forecast.nextWeek.predicted)}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                    Predicted spending
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Category Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Category Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => privacyMode ? '••••' : formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Category Trends
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {categoryTrends.map(trend => (
                  <div key={trend.categoryId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {trend.categoryName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {trend.count} transactions • Avg: {privacyMode ? '••••' : formatCurrency(trend.average)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {privacyMode ? '••••' : formatCurrency(trend.currentMonth)}
                        </div>
                        <div className={cn(
                          'text-sm flex items-center justify-end gap-1 mt-1',
                          trend.change > 0 ? 'text-red-600' : 'text-green-600'
                        )}>
                          {trend.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {Math.abs(trend.changePercent).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    {/* Mini sparkline */}
                    <div className="mt-3">
                      <ResponsiveContainer width="100%" height={40}>
                        <LineChart data={trend.sparkline.map((value, i) => ({ week: i, value }))}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3B82F6" 
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Merchants Tab */}
        {activeTab === 'merchants' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Top Merchants
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {merchantAnalysis.slice(0, 20).map((merchant, index) => (
                  <div key={merchant.merchant} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {merchant.merchant}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {merchant.category} • {merchant.frequency}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {privacyMode ? '••••' : formatCurrency(merchant.totalSpent)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {merchant.transactionCount} transactions
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>First: {format(merchant.firstTransaction, 'MMM dd, yyyy')}</span>
                      <span>Last: {format(merchant.lastTransaction, 'MMM dd, yyyy')}</span>
                      <span className={cn(
                        'px-2 py-1 rounded-full',
                        merchant.trend === 'increasing' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                        merchant.trend === 'decreasing' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      )}>
                        {merchant.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && spendingPattern && (
          <div className="space-y-6">
            {/* Day of Week Pattern */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Spending by Day of Week
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#9CA3AF" style={{ fontSize: 12 }} />
                  <YAxis 
                    stroke="#9CA3AF" 
                    style={{ fontSize: 12 }}
                    tickFormatter={(value) => privacyMode ? '••' : `$${value}`}
                  />
                  <Tooltip formatter={(value: number) => privacyMode ? '••••' : formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Time of Month Pattern */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Spending by Time of Month
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Beginning (1-10)</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {privacyMode ? '••••' : formatCurrency(spendingPattern.timeOfMonth.beginning)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {((spendingPattern.timeOfMonth.beginning / (spendingPattern.timeOfMonth.beginning + spendingPattern.timeOfMonth.middle + spendingPattern.timeOfMonth.end)) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Middle (11-20)</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {privacyMode ? '••••' : formatCurrency(spendingPattern.timeOfMonth.middle)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {((spendingPattern.timeOfMonth.middle / (spendingPattern.timeOfMonth.beginning + spendingPattern.timeOfMonth.middle + spendingPattern.timeOfMonth.end)) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">End (21-31)</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {privacyMode ? '••••' : formatCurrency(spendingPattern.timeOfMonth.end)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {((spendingPattern.timeOfMonth.end / (spendingPattern.timeOfMonth.beginning + spendingPattern.timeOfMonth.middle + spendingPattern.timeOfMonth.end)) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Seasonal Pattern */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Seasonal Spending
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(spendingPattern.seasonal).map(([season, amount]) => (
                  <div key={season} className="text-center">
                    <div className="text-3xl mb-2">
                      {season === 'spring' ? '🌸' : season === 'summer' ? '☀️' : season === 'fall' ? '🍂' : '❄️'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{season}</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {privacyMode ? '••••' : formatCurrency(amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && forecast && (
          <div className="space-y-6">
            {/* Forecast Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Spending Forecast
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: 12 }} />
                  <YAxis 
                    stroke="#9CA3AF" 
                    style={{ fontSize: 12 }}
                    tickFormatter={(value) => privacyMode ? '••' : `$${value}`}
                  />
                  <Tooltip formatter={(value: number) => privacyMode ? '••••' : formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Forecast Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Next Month Forecast */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Next Month Prediction
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Predicted Total</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {privacyMode ? '••••' : formatCurrency(forecast.nextMonth.predicted)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Confidence: {forecast.nextMonth.confidence.toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Range</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{privacyMode ? '••••' : formatCurrency(forecast.nextMonth.range.min)}</span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                        <div 
                          className="absolute h-full bg-primary-600 rounded-full"
                          style={{ 
                            left: '30%',
                            right: '30%'
                          }}
                        />
                      </div>
                      <span className="text-sm">{privacyMode ? '••••' : formatCurrency(forecast.nextMonth.range.max)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Predicted by Category
                </h3>
                <div className="space-y-3">
                  {Object.entries(forecast.nextMonth.byCategory).slice(0, 5).map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{category}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {privacyMode ? '••••' : formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {forecast.recommendations.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {forecast.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span className="text-sm text-blue-800 dark:text-blue-200">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && anomalies && (
          <div className="space-y-6">
            {/* Alerts */}
            {anomalies.alerts.length > 0 && (
              <div className="space-y-3">
                {anomalies.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-xl p-4 flex items-start gap-3',
                      alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                      alert.type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20' :
                      'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    <AlertTriangle className={cn(
                      'w-5 h-5 mt-0.5',
                      alert.type === 'error' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-orange-600' :
                      'text-blue-600'
                    )} />
                    <div className="flex-1">
                      <div className={cn(
                        'font-medium',
                        alert.type === 'error' ? 'text-red-900 dark:text-red-300' :
                        alert.type === 'warning' ? 'text-orange-900 dark:text-orange-300' :
                        'text-blue-900 dark:text-blue-300'
                      )}>
                        {alert.message}
                      </div>
                      {alert.action && (
                        <div className={cn(
                          'text-sm mt-1',
                          alert.type === 'error' ? 'text-red-700 dark:text-red-400' :
                          alert.type === 'warning' ? 'text-orange-700 dark:text-orange-400' :
                          'text-blue-700 dark:text-blue-400'
                        )}>
                          {alert.action}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Outliers */}
            {anomalies.outliers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Outlier Transactions
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {anomalies.outliers.slice(0, 10).map(transaction => (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {format(transaction.date, 'MMM dd, yyyy')} • {transaction.merchant}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            {privacyMode ? '••••' : formatCurrency(Math.abs(transaction.amount))}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Unusually high
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unusual Patterns */}
            {anomalies.unusualPatterns.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Unusual Patterns Detected
                </h3>
                <div className="space-y-4">
                  {anomalies.unusualPatterns.map((pattern, index) => (
                    <div key={index} className="border-l-4 border-orange-500 pl-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {pattern.description}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Type: {pattern.type.replace('_', ' ')} • Severity: {pattern.severity}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {pattern.transactions.length} transactions affected
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}