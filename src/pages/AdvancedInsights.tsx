import { useState, useEffect } from 'react'
import { useTransactionsStore, useCategoriesStore, useAccountsStore, useGoalsStore, useSettingsStore } from '@/stores'
import { insightsService } from '@/services/insights'
import { formatCurrency, formatPercentage, formatRelativeDate } from '@/services'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Brain,
  Target,
  BarChart3,
  Activity,
  PieChart,
  Calendar,
  ChevronRight,
  Info,
  X,
  Download,
  Sparkles
} from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { 
  LineChart, 
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import type { InsightSummary, SpendingTrend, AnomalyInsight, PredictiveInsight } from '@/types'
import { cn } from '@/lib/utils'

// Chart colors
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6', '#f97316']

const AdvancedInsightsPage = () => {
  const { transactions, fetchTransactions } = useTransactionsStore()
  const { categories, fetchCategories } = useCategoriesStore()
  const { accounts, fetchAccounts } = useAccountsStore()
  const { goals, fetchGoals } = useGoalsStore()
  const { privacy } = useSettingsStore()
  
  const [insights, setInsights] = useState<InsightSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyInsight | null>(null)
  const [selectedPrediction, setSelectedPrediction] = useState<PredictiveInsight | null>(null)
  
  useEffect(() => {
    loadData()
  }, [])
  
  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      generateInsights()
    }
  }, [selectedPeriod, transactions, categories, goals])
  
  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchTransactions(),
        fetchCategories(),
        fetchAccounts(),
        fetchGoals()
      ])
    } finally {
      setIsLoading(false)
    }
  }
  
  const generateInsights = async () => {
    try {
      const insightData = await insightsService.generateInsights(selectedPeriod)
      setInsights(insightData)
    } catch (error) {
      console.error('Failed to generate insights:', error)
    }
  }
  
  const handleDismissAnomaly = async (anomalyId: string) => {
    await insightsService.dismissAnomaly(anomalyId)
    generateInsights()
  }
  
  const handleExportInsights = async () => {
    if (!insights) return
    
    const csv = await insightsService.exportInsights(insights, 'csv')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kite-insights-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (!insights) {
    return (
      <div className="p-4">
        <div className="card p-8 text-center">
          <Sparkles className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Generating Insights
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing your financial data...
          </p>
        </div>
      </div>
    )
  }
  
  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20'
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-amber-600'
    return 'text-red-600'
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Advanced Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered financial analysis and predictions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <button
            onClick={handleExportInsights}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            title="Export insights"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
              <p className={cn(
                "text-2xl font-bold text-gray-900 dark:text-gray-100",
                privacy?.privacyMode && "sensitive-amount"
              )}>
                {formatCurrency(insights.cashFlow.totalIncome)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {insights.cashFlow.incomeTransactions} transactions
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className={cn(
                "text-2xl font-bold text-gray-900 dark:text-gray-100",
                privacy?.privacyMode && "sensitive-amount"
              )}>
                {formatCurrency(insights.cashFlow.totalExpenses)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {insights.cashFlow.expenseTransactions} transactions
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Net Cash Flow</p>
              <p className={cn(
                "text-2xl font-bold",
                insights.cashFlow.netCashFlow >= 0 ? "text-green-600" : "text-red-600",
                privacy?.privacyMode && "sensitive-amount"
              )}>
                {formatCurrency(insights.cashFlow.netCashFlow)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Savings rate: {formatPercentage(insights.cashFlow.savingsRate)}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>
      
      {/* Anomaly Detection */}
      {insights.anomalies.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Unusual Activity Detected
              </h2>
            </div>
            <span className="text-sm text-gray-500">
              {insights.anomalies.length} anomalies
            </span>
          </div>
          
          <div className="space-y-3">
            {insights.anomalies.slice(0, 5).map((anomaly) => (
              <div 
                key={anomaly.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setSelectedAnomaly(anomaly)}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2",
                  anomaly.severity === 'high' && "bg-red-500",
                  anomaly.severity === 'medium' && "bg-amber-500",
                  anomaly.severity === 'low' && "bg-blue-500"
                )} />
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {anomaly.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatRelativeDate(anomaly.detectedAt)} • {anomaly.category}
                  </p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDismissAnomaly(anomaly.id)
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Spending Trends */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Spending Trends Analysis
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Daily Average</p>
            <p className={cn(
              "text-lg font-semibold text-gray-900 dark:text-gray-100",
              privacy?.privacyMode && "sensitive-amount"
            )}>
              {formatCurrency(insights.trends.averageDailySpending)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Weekly Average</p>
            <p className={cn(
              "text-lg font-semibold text-gray-900 dark:text-gray-100",
              privacy?.privacyMode && "sensitive-amount"
            )}>
              {formatCurrency(insights.trends.averageWeeklySpending)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Average</p>
            <p className={cn(
              "text-lg font-semibold text-gray-900 dark:text-gray-100",
              privacy?.privacyMode && "sensitive-amount"
            )}>
              {formatCurrency(insights.trends.averageMonthlySpending)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Trend</p>
            <p className={cn(
              "text-lg font-semibold",
              insights.trends.trend === 'increasing' ? "text-red-600" : 
              insights.trends.trend === 'decreasing' ? "text-green-600" : "text-gray-600"
            )}>
              {insights.trends.trendPercentage > 0 ? '+' : ''}{formatPercentage(insights.trends.trendPercentage)}
            </p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={insights.trends.dataPoints}>
            <defs>
              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              formatter={(value: any) => formatCurrency(value)}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorSpending)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Category Analysis */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Category Analysis
            </h2>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie
                data={insights.categoryBreakdown.slice(0, 8)}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalSpent"
              >
                {insights.categoryBreakdown.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </RechartsPie>
          </ResponsiveContainer>
          
          <div className="space-y-2 mt-4">
            {insights.categoryBreakdown.slice(0, 5).map((category, index) => (
              <div key={category.categoryId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category.categoryName}
                  </span>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-medium text-gray-900 dark:text-gray-100",
                    privacy?.privacyMode && "sensitive-amount"
                  )}>
                    {formatCurrency(category.totalSpent)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category.transactionCount} transactions
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Predictions */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Predictions
            </h2>
          </div>
          
          <div className="space-y-4">
            {insights.predictions.slice(0, 4).map((prediction) => (
              <div 
                key={prediction.id}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setSelectedPrediction(prediction)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {prediction.type === 'spending' ? 'Spending Forecast' :
                       prediction.type === 'saving' ? 'Savings Projection' :
                       prediction.type === 'budget' ? 'Budget Forecast' : 'Goal Progress'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {prediction.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-semibold",
                      getConfidenceColor(prediction.confidence)
                    )}>
                      {(prediction.confidence * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">confidence</p>
                  </div>
                </div>
                
                {prediction.suggestedActions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💡 {prediction.suggestedActions[0]}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Goal Progress Integration */}
      {insights.goalProgress.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Goal Progress
            </h2>
          </div>
          
          <div className="space-y-4">
            {insights.goalProgress.map((goal) => (
              <div key={goal.goalId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {goal.goalName}
                  </p>
                  <span className="text-sm text-gray-500">
                    {formatPercentage(goal.progressPercentage)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {goal.projectedCompletion ? 
                      `Expected: ${new Date(goal.projectedCompletion).toLocaleDateString()}` : 
                      'On track'}
                  </span>
                  <span className={cn(
                    "font-medium",
                    privacy?.privacyMode && "sensitive-amount"
                  )}>
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Anomaly Details Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Anomaly Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedAnomaly.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Severity</p>
                  <span className={cn(
                    "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                    getSeverityColor(selectedAnomaly.severity)
                  )}>
                    {selectedAnomaly.severity}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedAnomaly.category}
                  </p>
                </div>
              </div>
              
              {selectedAnomaly.affectedTransactions && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Affected Transactions
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedAnomaly.affectedTransactions.length} transactions
                  </p>
                </div>
              )}
              
              {selectedAnomaly.suggestedAction && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {selectedAnomaly.suggestedAction}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleDismissAnomaly(selectedAnomaly.id)
                    setSelectedAnomaly(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Prediction Details Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Prediction Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedPrediction(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Prediction</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedPrediction.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Confidence</p>
                  <p className={cn(
                    "text-lg font-semibold",
                    getConfidenceColor(selectedPrediction.confidence)
                  )}>
                    {(selectedPrediction.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Time Frame</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedPrediction.timeFrame}
                  </p>
                </div>
              </div>
              
              {selectedPrediction.predictedAmount !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Predicted Amount</p>
                  <p className={cn(
                    "text-xl font-bold text-gray-900 dark:text-gray-100",
                    privacy?.privacyMode && "sensitive-amount"
                  )}>
                    {formatCurrency(selectedPrediction.predictedAmount)}
                  </p>
                </div>
              )}
              
              {selectedPrediction.suggestedActions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Suggested Actions
                  </p>
                  <div className="space-y-2">
                    {selectedPrediction.suggestedActions.map((action, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <ChevronRight className="w-4 h-4 text-primary-600 mt-0.5" />
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setSelectedPrediction(null)}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedInsightsPage