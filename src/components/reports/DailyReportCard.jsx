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

  const getPerformanceStyle = (total) => {
    if (total >= 1000) return {
      color: 'var(--accent-success)',
      backgroundColor: 'var(--bg-success)',
      borderColor: 'var(--accent-success)'
    }
    if (total >= 500) return {
      color: 'var(--accent-warning)',
      backgroundColor: 'var(--bg-warning)',
      borderColor: 'var(--accent-warning)'
    }
    return {
      color: 'var(--accent-cherry)',
      backgroundColor: 'var(--bg-error)',
      borderColor: 'var(--accent-cherry)'
    }
  }

  const getPerformanceIcon = (total) => {
    if (total >= 1000) return <TrendingUp className="h-4 w-4" />
    if (total >= 500) return <DollarSign className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  const performanceStyle = getPerformanceStyle(report.daily_total)

  return (
    <div 
      className={`rounded-xl overflow-hidden relative transition-all duration-300 ${isMobile ? 'mb-4' : 'mb-6'}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-primary)'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)'
        e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = 'var(--shadow-lg)'
      }}
    >
      {/* Top accent border */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: '4px', 
        background: 'linear-gradient(90deg, var(--accent-warning), #FBBF24)' 
      }}></div>
      {/* Header */}
      <div className="p-4" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-secondary)' }}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatDate(report.report_date)}
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {report.store_name} • {report.store_location}
            </p>
          </div>
          <div 
            className="px-3 py-1 rounded-full border"
            style={{
              backgroundColor: performanceStyle.backgroundColor,
              borderColor: performanceStyle.borderColor,
              color: performanceStyle.color
            }}
          >
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
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-4'} mb-6`}>
          <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-success), #34D399)' }}></div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-success), #34D399)' }}>
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(report.daily_total)}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Daily Total</div>
          </div>

          <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-vapor), #60A5FA)' }}></div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-vapor), #60A5FA)' }}>
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {(report.shift1_transaction_count || 0) + (report.shift2_transaction_count || 0)}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Transactions</div>
          </div>

          {!isMobile && (
            <>
              <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-purple), #A78BFA)' }}></div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-purple), #A78BFA)' }}>
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(
                    report.daily_total / 
                    Math.max(1, (report.shift1_transaction_count || 0) + (report.shift2_transaction_count || 0))
                  )}
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Avg per Transaction</div>
              </div>

              <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-warning), #FBBF24)' }}></div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-warning), #FBBF24)' }}>
                    <Package className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {Math.round((report.daily_total / 1000) * 100)}%
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Performance</div>
              </div>
            </>
          )}
        </div>

        {/* Shift Details */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'} mb-6`}>
          {/* Shift 1 */}
          <div className="rounded-xl p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-vapor), #60A5FA)' }}></div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center space-x-1" style={{ color: 'var(--text-primary)' }}>
                <Clock className="h-4 w-4" />
                <span>Shift 1</span>
              </h4>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Morning</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Worker:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{report.shift1_worker?.name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Sales:</span>
                <span className="font-medium" style={{ color: 'var(--accent-success)' }}>
                  {formatCurrency(report.shift1_total_sales)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Transactions:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{report.shift1_transaction_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Shift 2 */}
          <div className="rounded-xl p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-purple), #A78BFA)' }}></div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center space-x-1" style={{ color: 'var(--text-primary)' }}>
                <Clock className="h-4 w-4" />
                <span>Shift 2</span>
              </h4>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Evening</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Worker:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{report.shift2_worker?.name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Sales:</span>
                <span className="font-medium" style={{ color: 'var(--accent-success)' }}>
                  {formatCurrency(report.shift2_total_sales)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Transactions:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{report.shift2_transaction_count || 0}</span>
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--accent-vapor)' }}></div>
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
