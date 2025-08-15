import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import SafeResponsive from './SafeResponsive'
import { formatCurrency, formatDate } from '@/services'

interface CashflowData {
  date: string
  income: number
  expenses: number
  net: number
}

interface CashflowChartProps {
  data: CashflowData[]
  height?: number
  currency?: string
}

const CashflowChart = ({ 
  data, 
  height = 300, 
  currency = 'GBP' 
}: CashflowChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-gray-500 dark:text-gray-400">No cashflow data available</p>
        </div>
      </div>
    )
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            {formatDate(new Date(label), 'MMM dd')}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {entry.dataKey}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }
  
  return (
    <SafeResponsive height={height} minHeight={250}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatDate(new Date(value), 'MMM dd')}
          className="text-gray-600 dark:text-gray-400"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatCurrency(value, currency).replace(/\.00$/, '')}
          className="text-gray-600 dark:text-gray-400"
        />
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <Tooltip content={<CustomTooltip />} />
        
        <Area
          type="monotone"
          dataKey="income"
          stackId="1"
          stroke="#10b981"
          fill="url(#incomeGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stackId="2"
          stroke="#ef4444"
          fill="url(#expensesGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="net"
          stackId="3"
          stroke="#6366f1"
          fill="url(#netGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </SafeResponsive>
  )
}

export default CashflowChart