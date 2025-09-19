import React from 'react'
import { Coins, User, Clock, FileText } from 'lucide-react'
import { formatCurrency, formatDateTime } from '../../lib/utils'

const TodayFD = ({ todayFD, loading, storeName }) => {
  return (
    <div className="worker-card">
      {/* Header Section */}
      <div className="worker-card-header">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-xl">
            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Today's FD</h2>
            <p className="text-xs sm:text-sm text-gray-600">Font de Caisse for {storeName}</p>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="worker-card-content">
        {loading ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-500">Loading FD...</span>
            </div>
          </div>
        ) : todayFD ? (
          <div className="space-y-4">
            {/* FD Amount Display */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-2">
                {formatCurrency(todayFD.amount)}
              </div>
              <p className="text-sm text-green-700 font-medium">Available Cash Fund</p>
            </div>

            {/* FD Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Set by:</span>
                </div>
                <span className="font-medium text-gray-900">{todayFD.user_name}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Shift:</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  todayFD.shift_number === 1 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  Shift {todayFD.shift_number}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Set on:</span>
                </div>
                <span className="text-gray-900">{formatDateTime(todayFD.created_at)}</span>
              </div>

              {todayFD.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-start space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-gray-900 mt-1">{todayFD.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Coins className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium mb-2">No FD Set for Today</p>
            <p className="text-sm text-gray-400">
              The 2nd shift worker from yesterday didn't set an FD amount for today.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TodayFD
