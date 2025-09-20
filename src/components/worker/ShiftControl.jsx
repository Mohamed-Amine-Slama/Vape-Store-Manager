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
    <div 
      className="rounded-xl overflow-hidden relative transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-primary)'
      }}
    >
      {/* Top accent border */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: '4px', 
        background: 'linear-gradient(90deg, var(--accent-vapor), var(--accent-purple))' 
      }}></div>
      
      {/* Header Section */}
      <div className="p-4" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-secondary)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-vapor), var(--accent-purple))' }}>
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Shift Control</h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your work shifts</p>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4">
        {currentShift ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <Badge variant="success" className="worker-badge mb-2 sm:mb-3">
                On Shift {currentShift.shift_number}
              </Badge>
              <div className="rounded-xl p-3 sm:p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-success)', border: '1px solid var(--accent-success)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-success)' }}></div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-mono font-bold" style={{ color: 'var(--accent-success)' }}>
                  {shiftTime}
                </div>
                <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Started: {formatDateTime(currentShift.start_time)}
                </p>
              </div>
            </div>

            {/* Shift Progress */}
            {shiftTargets && (
              <div className="rounded-xl p-3 sm:p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-warning), #FBBF24)' }}></div>
                <h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3" style={{ color: 'var(--text-primary)' }}>Shift Progress</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold" style={{ color: 'var(--accent-vapor)' }}>
                      {formatCurrency(shiftTotal)}
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Revenue</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Target: {formatCurrency(shiftTargets.revenue_target)}
                    </div>
                    <div className="w-full rounded-full h-2 mt-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <div 
                        className="h-2 rounded-full transition-all duration-300" 
                        style={{
                          backgroundColor: 'var(--accent-vapor)',
                          width: `${Math.min(100, (shiftTotal / shiftTargets.revenue_target) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold" style={{ color: 'var(--accent-purple)' }}>
                      {sales.length}
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Sales</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Target: {shiftTargets.sales_target}
                    </div>
                    <div className="w-full rounded-full h-2 mt-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <div 
                        className="h-2 rounded-full transition-all duration-300" 
                        style={{
                          backgroundColor: 'var(--accent-purple)',
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
              <div className="rounded-xl p-3 sm:p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-success)', border: '1px solid var(--accent-success)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-success)' }}></div>
                <div className="font-medium mb-2 text-sm sm:text-base" style={{ color: 'var(--accent-success)' }}>
                  ✅ Shift Completed Today
                </div>
                <p className="text-xs sm:text-sm mb-3" style={{ color: 'var(--accent-success)' }}>
                  You have successfully completed your shift for today. 
                  You cannot start another shift until tomorrow.
                </p>
                <div className="text-xs" style={{ color: 'var(--accent-success)' }}>
                  Thank you for your hard work! 🙏
                </div>
              </div>
            ) : shiftNumber !== null ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="rounded-xl p-3 sm:p-4 relative overflow-hidden" style={{ backgroundColor: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--accent-vapor)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-vapor)' }}></div>
                  <Clock className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2" style={{ color: 'var(--accent-vapor)' }} />
                  <p className="text-sm sm:text-base font-medium" style={{ color: 'var(--accent-vapor)' }}>
                    Ready to start Shift {shiftNumber}
                  </p>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--accent-vapor)' }}>
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
                <div className="rounded-xl p-3 sm:p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-error)', border: '1px solid var(--accent-cherry)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-cherry)' }}></div>
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2" style={{ color: 'var(--accent-cherry)' }} />
                  <p className="text-sm sm:text-base font-medium mb-2" style={{ color: 'var(--accent-cherry)' }}>
                    All Shifts Occupied
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--accent-cherry)' }}>
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
