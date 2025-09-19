import React from 'react'
import { Button } from '../ui'
import { formatCurrency } from '../../lib/utils'
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Package,
  Activity,
  Target
} from 'lucide-react'

const MonthlyReportCard = ({
  monthlyData,
  onShowMonthlyBreakdown,
  loadingBreakdown,
  isMobile
}) => {
  if (!monthlyData) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No monthly data available</p>
        </div>
      </div>
    )
  }

  const getPerformanceLevel = (revenue) => {
    if (revenue >= 15000) return { level: 'Excellent', color: 'green', icon: TrendingUp }
    if (revenue >= 10000) return { level: 'Good', color: 'blue', icon: BarChart3 }
    if (revenue >= 5000) return { level: 'Average', color: 'yellow', icon: Activity }
    return { level: 'Below Target', color: 'red', icon: Target }
  }

  const performance = getPerformanceLevel(monthlyData.total_revenue)
  const PerformanceIcon = performance.icon

  const averageDaily = monthlyData.total_revenue / Math.max(1, monthlyData.total_days_with_sales || 1)
  const averageTransaction = monthlyData.total_revenue / Math.max(1, monthlyData.total_transactions || 1)

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {monthlyData.month_name}
            </h3>
            <p className="text-gray-600">
              Monthly Performance Summary
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full border-2 bg-${performance.color}-50 border-${performance.color}-200`}>
            <div className="flex items-center space-x-2">
              <PerformanceIcon className={`h-5 w-5 text-${performance.color}-600`} />
              <span className={`text-sm font-bold text-${performance.color}-700`}>
                {performance.level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="p-6">
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 lg:grid-cols-4 gap-6'} mb-6`}>
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(monthlyData.total_revenue)}
                </p>
              </div>
            </div>
            <div className="text-xs text-green-600">
              Target: {formatCurrency(15000)} • {Math.round((monthlyData.total_revenue / 15000) * 100)}%
            </div>
          </div>

          {/* Total Transactions */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-700">
                  {monthlyData.total_transactions || 0}
                </p>
              </div>
            </div>
            <div className="text-xs text-blue-600">
              Avg: {formatCurrency(averageTransaction)} per transaction
            </div>
          </div>

          {/* Active Days */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">Active Days</p>
                <p className="text-2xl font-bold text-purple-700">
                  {monthlyData.total_days_with_sales || 0}
                </p>
              </div>
            </div>
            <div className="text-xs text-purple-600">
              Avg: {formatCurrency(averageDaily)} per day
            </div>
          </div>

          {/* Performance Score */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600">Score</p>
                <p className="text-2xl font-bold text-orange-700">
                  {Math.round((monthlyData.total_revenue / 150) + (monthlyData.total_transactions / 10))}
                </p>
              </div>
            </div>
            <div className="text-xs text-orange-600">
              Based on revenue & transactions
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        {!isMobile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Daily Average</span>
              </h4>
              <div className="text-lg font-bold text-gray-700">
                {formatCurrency(averageDaily)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Revenue per active day
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Transaction Value</span>
              </h4>
              <div className="text-lg font-bold text-gray-700">
                {formatCurrency(averageTransaction)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Average per transaction
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Activity Rate</span>
              </h4>
              <div className="text-lg font-bold text-gray-700">
                {Math.round((monthlyData.total_days_with_sales / 30) * 100)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Days with sales activity
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => onShowMonthlyBreakdown(
              new Date(monthlyData.start_date).getFullYear(),
              new Date(monthlyData.start_date).getMonth() + 1
            )}
            disabled={loadingBreakdown}
            className="flex items-center space-x-2 px-8 py-3"
            variant="primary"
          >
            {loadingBreakdown ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                <span>Show Monthly Product Breakdown</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MonthlyReportCard
