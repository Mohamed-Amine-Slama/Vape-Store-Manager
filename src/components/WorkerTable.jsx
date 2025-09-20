import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Badge, Button } from './ui'
import { formatCurrency, formatDateTime } from '../lib/utils'
import { User, Eye } from 'lucide-react'
import WorkerDetailsModal from './WorkerDetailsModal'
import './WorkerTable.css'

export default function WorkerTable({ onWorkerClick }) {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWorkerDetails, setShowWorkerDetails] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)

  useEffect(() => {
    loadWorkers()
  }, [])

  const handleShowWorkerDetails = (worker) => {
    setSelectedWorker(worker)
    setShowWorkerDetails(true)
  }

  const handleCloseModal = () => {
    setShowWorkerDetails(false)
    setSelectedWorker(null)
  }

  const loadWorkers = async () => {
    try {
      // Get today's date range for daily reset functionality
      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString()

      // Get all workers with their sales data
      const { data: usersData } = await supabase
        .from('store_users')
        .select('*')
        .eq('role', 'worker')
        .order('name')

      // Get sales data for each worker (TODAY ONLY - Daily Reset)
      const workersWithStats = await Promise.all(
        usersData?.map(async (worker) => {
          // Only get today's sales for daily performance metrics
          const { data: todaySalesData, error: salesError } = await supabase
            .from('sales')
            .select('price, created_at, store_id, product')
            .eq('user_id', worker.id)
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd)

          // Calculate daily performance metrics based on sales data

          // Calculate daily performance metrics
          const dailyTotalSales = todaySalesData?.length || 0
          const dailyTotalRevenue = todaySalesData?.reduce((sum, sale) => sum + parseFloat(sale.price), 0) || 0
          const dailyAvgSaleValue = dailyTotalSales > 0 ? dailyTotalRevenue / dailyTotalSales : 0
          
          // Get last sale time (today only)
          const lastSaleTimeToday = todaySalesData?.length > 0 ? 
            Math.max(...todaySalesData.map(sale => new Date(sale.created_at).getTime())) : null

          // Check if worker is currently on shift (today)
          const { data: activeShift } = await supabase
            .from('shifts')
            .select('start_time')
            .eq('user_id', worker.id)
            .gte('start_time', todayStart)
            .is('end_time', null)
            .single()

          return {
            ...worker,
            // Daily metrics (reset every day at midnight)
            totalSales: dailyTotalSales,
            totalRevenue: dailyTotalRevenue,
            avgSaleValue: dailyAvgSaleValue,
            lastSaleTime: lastSaleTimeToday ? new Date(lastSaleTimeToday).toISOString() : null,
            isOnShift: !!activeShift,
            shiftStartTime: activeShift?.start_time,
            // Add metadata for daily reset
            metricsDate: todayStart,
            isDailyReset: true
          }
        }) || []
      )

      setWorkers(workersWithStats)
    } catch (error) {
      // Error loading workers
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="rounded-2xl shadow-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}></div>
            <div className="h-6 w-48 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="wt-container">
        {/* Enhanced Header */}
        <div className="wt-header">
          <div className="wt-header-content">
            <div className="wt-header-info">
              <div className="wt-icon-container">
                <User className="wt-icon" />
              </div>
              <div>
                <h2 className="wt-title">Daily Team Performance</h2>
                <p className="wt-subtitle">Today's worker activity • Resets daily at midnight</p>
              </div>
            </div>
            <div className="wt-stats">
              <p className="wt-stats-label">Total Workers</p>
              <p className="wt-stats-value">{workers.length}</p>
            </div>
          </div>
        </div>

        {workers.length === 0 ? (
          <div className="wt-empty">
            <div className="wt-empty-icon">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <p className="wt-empty-title">No workers found</p>
            <p className="wt-empty-subtitle">Add workers to start tracking performance</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="wt-desktop-table">
              <table className="wt-table">
                <thead>
                  <tr className="wt-table-header">
                    <th className="wt-th">Worker</th>
                    <th className="wt-th">Status</th>
                    <th className="wt-th">Sales</th>
                    <th className="wt-th">Revenue</th>
                    <th className="wt-th">Last Activity</th>
                    <th className="wt-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="wt-table-body">
                  {workers.map((worker) => (
                    <tr key={worker.id} className="wt-table-row">
                      <td className="wt-td">
                        <div className="wt-worker-info">
                          <div className="wt-avatar-container">
                            <div className="wt-avatar">
                              <span className="wt-avatar-text">
                                {worker.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {worker.isOnShift && (
                              <div className="wt-status-indicator"></div>
                            )}
                          </div>
                          <div className="wt-worker-details">
                            <div className="wt-worker-name">{worker.name}</div>
                            <div className="wt-worker-pin">PIN: {worker.pin}</div>
                          </div>
                        </div>
                      </td>
                      <td className="wt-td">
                        <div className="wt-status">
                          <Badge variant={worker.isOnShift ? "success" : "default"}>
                            {worker.isOnShift ? "On Shift" : "Off Shift"}
                          </Badge>
                          {worker.isOnShift && worker.shiftStartTime && (
                            <div className="wt-shift-time">
                              Since: {formatDateTime(worker.shiftStartTime)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="wt-td">
                        <div className="wt-sales-count">
                          <span className="wt-sales-number">{worker.totalSales}</span>
                          <span className="wt-sales-label">sales</span>
                        </div>
                      </td>
                      <td className="wt-td">
                        <div className="wt-revenue">
                          {formatCurrency(worker.totalRevenue)}
                        </div>
                      </td>
                      <td className="wt-td">
                        <div className={`wt-last-activity ${!worker.lastSaleTime ? 'no-sales' : ''}`}>
                          {worker.lastSaleTime ? 
                            formatDateTime(worker.lastSaleTime) : 
                            "No sales yet"
                          }
                        </div>
                      </td>
                      <td className="wt-td">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleShowWorkerDetails(worker)
                          }}
                          className="px-2 py-1 text-xs bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-colors duration-200 rounded"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="wt-mobile-cards">
              {workers.map((worker) => (
                <div key={worker.id} className="wt-mobile-card">
                  {/* Card Header */}
                  <div className="wt-card-header">
                    <div className="wt-card-worker-info">
                      <div className="wt-card-avatar-container">
                        <div className="wt-card-avatar">
                          <span className="wt-card-avatar-text">
                            {worker.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {worker.isOnShift && (
                          <div className="wt-card-status-indicator"></div>
                        )}
                      </div>
                      <div className="wt-card-worker-details">
                        <div className="wt-card-worker-name">{worker.name}</div>
                        <div className="wt-card-worker-pin">PIN: {worker.pin}</div>
                      </div>
                    </div>
                    <div className="wt-card-status-container">
                      <Badge variant={worker.isOnShift ? "success" : "default"} className="wt-card-status-badge">
                        {worker.isOnShift ? "On Shift" : "Off Shift"}
                      </Badge>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="wt-card-metrics">
                    <div className="wt-metric-item">
                      <div className="wt-metric-value">{worker.totalSales}</div>
                      <div className="wt-metric-label">Total Sales</div>
                    </div>
                    <div className="wt-metric-item">
                      <div className="wt-metric-value wt-revenue-text">{formatCurrency(worker.totalRevenue)}</div>
                      <div className="wt-metric-label">Revenue</div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="wt-card-details">
                    {worker.isOnShift && worker.shiftStartTime && (
                      <div className="wt-card-detail-item">
                        <span className="wt-detail-label">Shift Started:</span>
                        <span className="wt-detail-value">{formatDateTime(worker.shiftStartTime)}</span>
                      </div>
                    )}
                    <div className="wt-card-detail-item">
                      <span className="wt-detail-label">Last Activity:</span>
                      <span className={`wt-detail-value ${!worker.lastSaleTime ? 'wt-no-activity' : ''}`}>
                        {worker.lastSaleTime ? 
                          formatDateTime(worker.lastSaleTime) : 
                          "No sales yet"
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* View Details Button for Mobile */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleShowWorkerDetails(worker)
                      }}
                      className="px-3 py-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-colors duration-200 rounded flex items-center"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Worker Details Modal Component */}
      <WorkerDetailsModal
        isOpen={showWorkerDetails}
        onClose={handleCloseModal}
        worker={selectedWorker}
      />
    </>
  )
}