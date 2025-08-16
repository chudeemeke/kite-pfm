import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactionsStore, useCategoriesStore, useBudgetsStore, useSettingsStore } from '@/stores'
import { formatCurrency, formatPercentage } from '@/services'
import { subDays, startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns'
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar
} from 'recharts'
import SafeResponsive from '@/components/Charts/SafeResponsive'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TrendingUp, TrendingDown, Minus, Calendar, PieChart as PieChartIcon, BarChart3, ChevronRight } from 'lucide-react'

interface SpendingTrendData {
  date: string
  amount: number
  income: number
  net: number
}

interface CategorySpendingData {
  name: string
  amount: number
  color: string
  percentage: number
}

interface MerchantData {
  name: string
  amount: number
  transactions: number
}

interface MonthlyComparisonData {
  month: string
  spending: number
  income: number
  net: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="card p-3 shadow-lg border">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="card p-3 shadow-lg border">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {data.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatCurrency(data.amount)} ({formatPercentage(data.percentage)})
        </p>
      </div>
    )
  }
  return null
}

const InsightsPage = () => {
  const navigate = useNavigate()
  const { transactions, isLoading: transactionsLoading, fetchTransactions } = useTransactionsStore()
  const { categories, fetchCategories } = useCategoriesStore()
  const { fetchBudgets } = useBudgetsStore()
  const { privacy } = useSettingsStore()
  
  const [dateRange, setDateRange] = useState(30) // Last 30 days
  const [isCalculating, setIsCalculating] = useState(false)
  
  useEffect(() => {
    fetchTransactions()
    fetchCategories()
    fetchBudgets()
  }, [])
  
  const { 
    spendingTrendData, 
    categorySpendingData, 
    topMerchants, 
    monthlyComparison,
    averageDailySpending,
    totalSpending,
    totalIncome,
    netAmount
  } = useMemo(() => {
    setIsCalculating(true)
    
    const endDate = new Date()
    const startDate = subDays(endDate, dateRange)
    
    // Filter transactions for the selected period
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= startDate && transactionDate <= endDate
    })
    
    // Calculate spending trend data
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const spendingTrend: SpendingTrendData[] = days.map(day => {
      const dayTransactions = periodTransactions.filter(t => {
        const transactionDate = new Date(t.date)
        return format(transactionDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      })
      
      const expenses = dayTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        
      const income = dayTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
      
      return {
        date: format(day, 'MMM dd'),
        amount: expenses,
        income,
        net: income - expenses
      }
    })
    
    // Calculate category spending
    const categorySpending = new Map<string, number>()
    periodTransactions
      .filter(t => t.amount < 0 && t.categoryId)
      .forEach(t => {
        const current = categorySpending.get(t.categoryId!) || 0
        categorySpending.set(t.categoryId!, current + Math.abs(t.amount))
      })
    
    const totalCategorySpending = Array.from(categorySpending.values()).reduce((sum, amount) => sum + amount, 0)
    
    const categoryData: CategorySpendingData[] = Array.from(categorySpending.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId)
        return {
          name: category?.name || 'Unknown',
          amount,
          color: category?.color || '#94a3b8',
          percentage: (amount / totalCategorySpending) * 100
        }
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8) // Top 8 categories
    
    // Calculate top merchants
    const merchantSpending = new Map<string, { amount: number; transactions: number }>()
    periodTransactions
      .filter(t => t.amount < 0 && t.merchant)
      .forEach(t => {
        const current = merchantSpending.get(t.merchant!) || { amount: 0, transactions: 0 }
        merchantSpending.set(t.merchant!, {
          amount: current.amount + Math.abs(t.amount),
          transactions: current.transactions + 1
        })
      })
    
    const topMerchantsData: MerchantData[] = Array.from(merchantSpending.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
    
    // Calculate monthly comparison (last 6 months)
    const monthlyData: MonthlyComparisonData[] = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= monthStart && transactionDate <= monthEnd
      })
      
      const spending = monthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        
      const income = monthTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
      
      monthlyData.push({
        month: format(monthDate, 'MMM yy'),
        spending,
        income,
        net: income - spending
      })
    }
    
    // Calculate summary stats
    const expenses = periodTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
    const income = periodTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const avgDaily = expenses / dateRange
    
    setIsCalculating(false)
    
    return {
      spendingTrendData: spendingTrend,
      categorySpendingData: categoryData,
      topMerchants: topMerchantsData,
      monthlyComparison: monthlyData,
      averageDailySpending: avgDaily,
      totalSpending: expenses,
      totalIncome: income,
      netAmount: income - expenses
    }
  }, [transactions, categories, dateRange])
  
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-success-500" />
    if (value < 0) return <TrendingDown className="w-4 h-4 text-danger-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }
  
  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-success-600 dark:text-success-400'
    if (value < 0) return 'text-danger-600 dark:text-danger-400'
    return 'text-gray-600 dark:text-gray-400'
  }
  
  if (transactionsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (transactions.length === 0) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover spending patterns and trends
          </p>
        </div>
        
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No transaction data
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add some transactions to see insights and spending patterns
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover spending patterns and trends
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 3 months</option>
            <option value={180}>Last 6 months</option>
          </select>
          <button
            onClick={() => navigate('/trends')}
            className="flex items-center gap-1 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Advanced Analytics
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Financial Reports
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spending</p>
              <p className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                {formatCurrency(totalSpending)}
              </p>
            </div>
            <div className="p-2 bg-danger-100 dark:bg-danger-900/20 rounded-lg">
              <TrendingDown className="w-4 h-4 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
              <p className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="p-2 bg-success-100 dark:bg-success-900/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Net Amount</p>
              <p className={`text-lg font-semibold ${getTrendColor(netAmount)} ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                {formatCurrency(netAmount)}
              </p>
            </div>
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              {getTrendIcon(netAmount)}
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Daily Average</p>
              <p className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                {formatCurrency(averageDailySpending)}
              </p>
            </div>
            <div className="p-2 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
              <BarChart3 className="w-4 h-4 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </div>
      </div>
      
      {isCalculating && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <LoadingSpinner size="md" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Calculating insights...
            </p>
          </div>
        </div>
      )}
      
      {/* Spending Trend Chart */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Spending Trends
          </h2>
        </div>
        
        <SafeResponsive height={300}>
          <AreaChart data={spendingTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stackId="1"
              stroke="#ef4444"
              fill="#fecaca"
              name="Spending"
            />
            <Area
              type="monotone"
              dataKey="income"
              stackId="2"
              stroke="#22c55e"
              fill="#bbf7d0"
              name="Income"
            />
          </AreaChart>
        </SafeResponsive>
      </div>
      
      {/* Category Breakdown and Top Merchants */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Spending by Category
            </h2>
          </div>
          
          {categorySpendingData.length > 0 ? (
            <>
              <SafeResponsive height={250}>
                <PieChart>
                  <Pie
                    data={categorySpendingData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categorySpendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </SafeResponsive>
              
              <div className="space-y-2 mt-4">
                {categorySpendingData.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                        {formatCurrency(category.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatPercentage(category.percentage)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No categorized spending data
              </p>
            </div>
          )}
        </div>
        
        {/* Top Merchants */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Top Merchants
          </h2>
          
          {topMerchants.length > 0 ? (
            <div className="space-y-3">
              {topMerchants.map((merchant, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {merchant.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {merchant.transactions} transaction{merchant.transactions !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className={`font-semibold text-gray-900 dark:text-gray-100 ${privacy?.privacyMode ? 'sensitive-amount' : ''}`}>
                    {formatCurrency(merchant.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No merchant data available
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Monthly Comparison */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Monthly Comparison
        </h2>
        
        <SafeResponsive height={300}>
          <BarChart data={monthlyComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="spending" 
              fill="#ef4444" 
              name="Spending"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="income" 
              fill="#22c55e" 
              name="Income"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </SafeResponsive>
      </div>
    </div>
  )
}

export default InsightsPage