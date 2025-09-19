import React from 'react'
import { Button } from '../ui'
import { formatCurrency } from '../../lib/utils'
import { 
  DollarSign, 
  Users, 
  Clock, 
  TrendingUp, 
  ShoppingCart,
  Package,
  Eye,
  EyeOff
} from 'lucide-react'

const DailyReportCard = ({
  report,
  onShowDetails,
  loadingDetails,
  isMobile
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPerformanceColor = (total) => {
    if (total >= 1000) return 'text-green-600 bg-green-50 border-green-200'
    if (total >= 500) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getPerformanceIcon = (total) => {
    if (total >= 1000) return <TrendingUp className="h-4 w-4" />
    if (total >= 500) return <DollarSign className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${isMobile ? 'mb-4' : 'mb-6'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {formatDate(report.report_date)}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {report.store_name} • {report.store_location}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full border ${getPerformanceColor(report.daily_total)}`}>
            <div className="flex items-center space-x-1">
              {getPerformanceIcon(report.daily_total)}
              <span className="text-xs font-semibold">
                {report.daily_total >= 1000 ? 'Excellent' : 
                 report.daily_total >= 500 ? 'Good' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Summary Stats */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-4'} mb-4`}>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">Daily Total</span>
            </div>
            <div className="text-lg font-bold text-green-700">
              {formatCurrency(report.daily_total)}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center space-x-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Transactions</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {(report.shift1_transaction_count || 0) + (report.shift2_transaction_count || 0)}
            </div>
          </div>

          {!isMobile && (
            <>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600">Avg per Transaction</span>
                </div>
                <div className="text-lg font-bold text-purple-700">
                  {formatCurrency(
                    report.daily_total / 
                    Math.max(1, (report.shift1_transaction_count || 0) + (report.shift2_transaction_count || 0))
                  )}
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Package className="h-4 w-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-600">Performance</span>
                </div>
                <div className="text-lg font-bold text-orange-700">
                  {Math.round((report.daily_total / 1000) * 100)}%
                </div>
              </div>
            </>
          )}
        </div>

        {/* Shift Details */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'} mb-4`}>
          {/* Shift 1 */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800 flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Shift 1</span>
              </h4>
              <span className="text-xs text-gray-500">Morning</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Worker:</span>
                <span className="font-medium">{report.shift1_worker?.name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sales:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(report.shift1_total_sales)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transactions:</span>
                <span className="font-medium">{report.shift1_transaction_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Shift 2 */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800 flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Shift 2</span>
              </h4>
              <span className="text-xs text-gray-500">Evening</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Worker:</span>
                <span className="font-medium">{report.shift2_worker?.name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sales:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(report.shift2_total_sales)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transactions:</span>
                <span className="font-medium">{report.shift2_transaction_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => onShowDetails(report.report_date)}
            disabled={loadingDetails}
            className="flex items-center space-x-2 w-full justify-center"
            variant="outline"
          >
            {loadingDetails ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading Details...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span>Show Today's Sales</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DailyReportCard
