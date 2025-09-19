import React from 'react'
import { Button, Badge } from '../ui'
import { Clock, Users } from 'lucide-react'
import { formatDateTime, formatCurrency } from '../../lib/utils'

const ShiftControl = ({ 
  currentShift, 
  shiftTime, 
  shiftTargets, 
  shiftTotal, 
  sales,
  workerCompletedToday,
  shiftNumber,
  loading,
  onStartShift,
  onEndShift,
  onRefreshData
}) => {
  return (
    <div className="worker-card">
      {/* Header Section */}
      <div className="worker-card-header">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Shift Control</h2>
            <p className="text-xs sm:text-sm text-gray-600">Manage your work shifts</p>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="worker-card-content">
        {currentShift ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <Badge variant="success" className="worker-badge mb-2 sm:mb-3">
                On Shift {currentShift.shift_number}
              </Badge>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4">
                <div className="text-xl sm:text-2xl lg:text-3xl font-mono font-bold text-green-600">
                  {shiftTime}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Started: {formatDateTime(currentShift.start_time)}
                </p>
              </div>
            </div>

            {/* Shift Progress */}
            {shiftTargets && (
              <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Shift Progress</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-600">
                      {formatCurrency(shiftTotal)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Revenue</div>
                    <div className="text-xs text-gray-400">
                      Target: {formatCurrency(shiftTargets.revenue_target)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{
                          width: `${Math.min(100, (shiftTotal / shiftTargets.revenue_target) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-purple-600">
                      {sales.length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Sales</div>
                    <div className="text-xs text-gray-400">
                      Target: {shiftTargets.sales_target}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                        style={{
                          width: `${Math.min(100, (sales.length / shiftTargets.sales_target) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={onEndShift}
              disabled={loading}
              variant="danger"
              className="worker-button w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner"></div>
                  <span>Ending Shift...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>End Shift {currentShift.shift_number}</span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-3 sm:space-y-4">
            <Badge variant="default" className="worker-badge">Off Shift</Badge>
            {workerCompletedToday ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4">
                <div className="text-green-800 font-medium mb-2 text-sm sm:text-base">
                  ✅ Shift Completed Today
                </div>
                <p className="text-green-700 text-xs sm:text-sm mb-3">
                  You have successfully completed your shift for today. 
                  You cannot start another shift until tomorrow.
                </p>
                <div className="text-xs text-green-600">
                  Thank you for your hard work! 🙏
                </div>
              </div>
            ) : shiftNumber !== null ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                  <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mx-auto mb-2" />
                  <p className="text-blue-700 text-sm sm:text-base font-medium">
                    Ready to start Shift {shiftNumber}
                  </p>
                  <p className="text-blue-600 text-xs sm:text-sm mt-1">
                    Begin recording sales and managing your shift
                  </p>
                </div>
                <Button
                  onClick={onStartShift}
                  disabled={loading}
                  className="worker-button w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="loading-spinner"></div>
                      <span>Starting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Start Shift {shiftNumber}</span>
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 text-sm sm:text-base font-medium mb-2">
                    All Shifts Occupied
                  </p>
                  <p className="text-red-600 text-xs sm:text-sm">
                    Both shifts are already taken by other workers today
                  </p>
                </div>
                <Button
                  onClick={onRefreshData}
                  disabled={loading}
                  variant="outline"
                  className="worker-button w-full border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 font-semibold transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="loading-spinner"></div>
                      <span>Refreshing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Refresh Status</span>
                    </div>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShiftControl
