import React from 'react'
import { Coins, User, Clock, FileText } from 'lucide-react'
import { formatCurrency, formatDateTime } from '../../lib/utils'

const TodayFD = ({ todayFD, loading, storeName }) => {
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
        background: 'linear-gradient(90deg, var(--accent-success), #34D399)' 
      }}></div>
      
      {/* Header Section */}
      <div className="p-4" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-secondary)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-success), #34D399)' }}>
            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Today's FD</h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Font de Caisse for {storeName}</p>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--accent-success)' }}></div>
              <span style={{ color: 'var(--text-secondary)' }}>Loading FD...</span>
            </div>
          </div>
        ) : todayFD ? (
          <div className="space-y-4">
            {/* FD Amount Display */}
            <div className="rounded-xl p-4 text-center relative overflow-hidden" style={{ backgroundColor: 'var(--bg-success)', border: '1px solid var(--accent-success)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-success)' }}></div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'var(--accent-success)' }}>
                {formatCurrency(todayFD.amount)}
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--accent-success)' }}>Available Cash Fund</p>
            </div>

            {/* FD Details */}
            <div className="rounded-xl p-4 space-y-3 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-warning), #FBBF24)' }}></div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
                  <User className="h-4 w-4" />
                  <span>Set by:</span>
                </div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{todayFD.user_name}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
                  <Clock className="h-4 w-4" />
                  <span>Shift:</span>
                </div>
                <span 
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: todayFD.shift_number === 1 ? 'rgba(0, 212, 255, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                    color: todayFD.shift_number === 1 ? 'var(--accent-vapor)' : 'var(--accent-purple)'
                  }}
                >
                  Shift {todayFD.shift_number}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
                  <Clock className="h-4 w-4" />
                  <span>Set on:</span>
                </div>
                <span style={{ color: 'var(--text-primary)' }}>{formatDateTime(todayFD.created_at)}</span>
              </div>

              {todayFD.notes && (
                <div className="pt-2" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                  <div className="flex items-start space-x-2 text-sm">
                    <FileText className="h-4 w-4 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Notes:</span>
                      <p className="mt-1" style={{ color: 'var(--text-primary)' }}>{todayFD.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Coins className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>No FD Set for Today</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              The 2nd shift worker from yesterday didn't set an FD amount for today.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TodayFD
