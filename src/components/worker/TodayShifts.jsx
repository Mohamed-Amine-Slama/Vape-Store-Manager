import React from 'react'
import { Badge } from '../ui'
import { Users } from 'lucide-react'
import { formatDateTime } from '../../lib/utils'

const TodayShifts = ({ storeInfo, todayShifts }) => {
  if (!storeInfo) return null

  return (
    <div className="worker-card">
      {/* Header Section */}
      <div className="worker-card-header">
        <div className="flex items-center space-x-3">
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%)',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
          }} className="p-2 rounded-xl">
            <Users style={{ color: 'var(--accent-neon)' }} className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-primary)' }} className="text-base sm:text-lg font-bold">Today's Shifts</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="text-xs sm:text-sm">{storeInfo.name}</p>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="worker-card-content">
        <div className="shifts-grid">
          <div style={{
            borderColor: todayShifts.shift1 
              ? (todayShifts.shift1.end_time 
                  ? 'var(--accent-neon)' 
                  : 'var(--accent-vapor)')
              : 'var(--border-primary)',
            background: todayShifts.shift1 
              ? (todayShifts.shift1.end_time 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' 
                  : 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)')
              : 'var(--bg-elevated)'
          }} className="shift-card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
              <h3 style={{ color: 'var(--text-primary)' }} className="text-base sm:text-lg font-bold">Shift 1</h3>
              {todayShifts.shift1 && (
                <Badge variant={todayShifts.shift1.end_time ? 'success' : 'info'} className="worker-badge">
                  {todayShifts.shift1.end_time ? 'Completed' : 'Active'}
                </Badge>
              )}
            </div>
            {todayShifts.shift1 ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Worker:</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">{todayShifts.shift1.store_users.name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Start:</span>
                  <span className="text-xs sm:text-sm text-gray-900">{formatDateTime(todayShifts.shift1.start_time)}</span>
                </div>
                {todayShifts.shift1.end_time && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">End:</span>
                    <span className="text-xs sm:text-sm text-gray-900">{formatDateTime(todayShifts.shift1.end_time)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 italic">No worker assigned</p>
            )}
          </div>

          <div className={`shift-card ${
            todayShifts.shift2 
              ? (todayShifts.shift2.end_time 
                  ? 'border-green-300 bg-gradient-to-br from-green-50 to-green-100' 
                  : 'border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100')
              : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Shift 2</h3>
              {todayShifts.shift2 && (
                <Badge variant={todayShifts.shift2.end_time ? 'success' : 'info'} className="worker-badge">
                  {todayShifts.shift2.end_time ? 'Completed' : 'Active'}
                </Badge>
              )}
            </div>
            {todayShifts.shift2 ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Worker:</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">{todayShifts.shift2.store_users.name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Start:</span>
                  <span className="text-xs sm:text-sm text-gray-900">{formatDateTime(todayShifts.shift2.start_time)}</span>
                </div>
                {todayShifts.shift2.end_time && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">End:</span>
                    <span className="text-xs sm:text-sm text-gray-900">{formatDateTime(todayShifts.shift2.end_time)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 italic">No worker assigned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TodayShifts
