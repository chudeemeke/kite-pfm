import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import SafeResponsive from './SafeResponsive'
import { formatCurrency } from '@/services'

interface SpendingData {
  name: string
  value: number
  color: string
}

interface SpendingByCategoryProps {
  data: SpendingData[]
  height?: number
  currency?: string
}

const SpendingByCategory = ({ 
  data, 
  height = 300, 
  currency = 'GBP' 
}: SpendingByCategoryProps) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500 dark:text-gray-400">No spending data available</p>
        </div>
      </div>
    )
  }
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(data.value, currency)}
          </p>
        </div>
      )
    }
    return null
  }
  
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <SafeResponsive height={height} minHeight={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </SafeResponsive>
  )
}

export default SpendingByCategory