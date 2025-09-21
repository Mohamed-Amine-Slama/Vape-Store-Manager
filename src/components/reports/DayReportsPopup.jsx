import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { 
  Calendar, 
  Download, 
  BarChart3, 
  X, 
  Store, 
  DollarSign, 
  Users, 
  Package,
  Loader2,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react'
import { exportDailyRecordsToExcel, exportDetailedBreakdownToExcel } from '../../utils/exportUtils'

const DayReportsPopup = ({ 
  isOpen, 
  selectedDate, 
  onClose, 
  loadDailyProductBreakdown,
  productBreakdown,
  loadingProductBreakdown 
}) => {
  const [dayRecords, setDayRecords] = useState({ reports: [], sales: [] })
  const [loading, setLoading] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Load day records when popup opens
  useEffect(() => {
    if (isOpen && selectedDate) {
      loadDayRecords()
    }
  }, [isOpen, selectedDate])

  const loadDayRecords = async () => {
    try {
      setLoading(true)
      
      // Load daily reports for all stores for this date
      const { data: reports, error: reportsError } = await supabase
        .from('daily_reports')
        .select(`
          *,
          stores (
            name,
            location
          )
        `)
        .eq('report_date', selectedDate)
        .order('daily_total', { ascending: false })

      if (reportsError) throw reportsError

      // Load individual sales for this date
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          store_users!inner(name),
          shifts!inner(shift_number)
        `)
        .gte('created_at', selectedDate + 'T00:00:00')
        .lt('created_at', selectedDate + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (salesError) throw salesError

      setDayRecords({
        reports: reports || [],
        sales: sales || []
      })

    } catch (error) {
      console.error('Error loading day records:', error)
      alert('Error loading day records. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleShowBreakdown = async () => {
    await loadDailyProductBreakdown(selectedDate)
    setShowBreakdown(true)
  }

  const handleExportRecords = async () => {
    if (!dayRecords.sales || dayRecords.sales.length === 0) {
      alert('No sales records to export')
      return
    }

    try {
      await exportDailyRecordsToExcel(dayRecords.sales, selectedDate)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export records. Please try again.')
    }
  }

  const handleExportBreakdown = async () => {
    if (!productBreakdown) {
      alert('No breakdown data to export')
      return
    }

    try {
      await exportDetailedBreakdownToExcel(productBreakdown, selectedDate, 'daily')
    } catch (error) {
      console.error('Export breakdown failed:', error)
      alert('Failed to export breakdown. Please try again.')
    }
  }

  const handleClose = () => {
    setShowBreakdown(false)
    setDayRecords({ reports: [], sales: [] })
    onClose()
  }

  // Calculate totals
  const totalRevenue = dayRecords.reports?.reduce((sum, report) => sum + (report.daily_total || 0), 0) || 0
  const totalTransactions = dayRecords.sales?.length || 0
  const uniqueWorkers = new Set(dayRecords.sales?.map(s => s.store_users?.name)).size || 0

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div 
        className="max-w-6xl w-full max-h-[90vh] overflow-hidden rounded-xl border border-gray-100 shadow-2xl"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-2xl)'
        }}
      >
        {/* Signature Top Accent Border */}
        <div 
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)'
          }}
        />
        
        {/* Executive Header */}
        <div 
          className="px-8 py-6 border-b"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-5">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 
                  className="text-2xl font-light tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Daily Performance Report
                </h3>
                <p 
                  className="text-sm font-light mt-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                color: 'var(--text-muted)',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'var(--text-primary)'
                e.target.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--text-muted)'
                e.target.style.background = 'transparent'
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Executive Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Revenue Card */}
            <div 
              className="rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-sm)',
                borderTop: '3px solid var(--accent-success)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Total Revenue
                  </p>
                  <p 
                    className="text-3xl font-light tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-success) 0%, #10b981 100%)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            {/* Total Transactions Card */}
            <div 
              className="rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-sm)',
                borderTop: '3px solid var(--accent-vapor)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Total Transactions
                  </p>
                  <p 
                    className="text-3xl font-light tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {totalTransactions.toLocaleString()}
                  </p>
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-vapor) 0%, #0ea5e9 100%)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            {/* Active Staff Card */}
            <div 
              className="rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-sm)',
                borderTop: '3px solid var(--accent-purple)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Active Staff
                  </p>
                  <p 
                    className="text-3xl font-light tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {uniqueWorkers}
                  </p>
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-purple) 0%, #8b5cf6 100%)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Executive Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <button
              onClick={handleShowBreakdown}
              disabled={loadingProductBreakdown}
              className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              style={{
                background: 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)',
                color: 'white',
                border: 'none',
                focusRingColor: 'var(--accent-vapor)'
              }}
            >
              {loadingProductBreakdown ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Product Analysis
            </button>
            
            <button
              onClick={handleExportRecords}
              disabled={loading || !dayRecords.sales?.length}
              className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              style={{
                background: 'linear-gradient(135deg, var(--accent-success) 0%, #10b981 100%)',
                color: 'white',
                border: 'none',
                focusRingColor: 'var(--accent-success)'
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
            
            {showBreakdown && productBreakdown && (
              <button
                onClick={handleExportBreakdown}
                disabled={loadingProductBreakdown}
                className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-warning) 0%, #f59e0b 100%)',
                  color: 'white',
                  border: 'none',
                  focusRingColor: 'var(--accent-warning)'
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Analysis
              </button>
            )}
          </div>
        </div>

        {/* Executive Content */}
        <div 
          className="px-8 py-6 overflow-y-auto max-h-[60vh]"
          style={{ background: 'var(--bg-primary)' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 
                className="h-8 w-8 animate-spin mr-3" 
                style={{ color: 'var(--accent-vapor)' }}
              />
              <span 
                className="font-light"
                style={{ color: 'var(--text-primary)' }}
              >
                Loading performance data...
              </span>
            </div>
          ) : showBreakdown && productBreakdown ? (
            /* Product Breakdown View */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Product Sales Breakdown
                </h4>
                <button
                  onClick={() => setShowBreakdown(false)}
                  className="text-sm font-medium transition-colors duration-200"
                  style={{ color: 'var(--accent-vapor)' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--accent-purple)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--accent-vapor)'}
                >
                  ← Back to Store Reports
                </button>
              </div>
              {productBreakdown && Array.isArray(productBreakdown) && productBreakdown.length > 0 ? (
                productBreakdown.map((store, index) => (
                  <div 
                    key={index} 
                    className="rounded-xl p-6 border transition-all duration-300"
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border-primary)',
                      boxShadow: 'var(--shadow-sm)',
                      borderTop: '3px solid var(--accent-warning)'
                    }}
                  >
                    <h5 
                      className="font-semibold mb-4 flex items-center space-x-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Store className="h-5 w-5" style={{ color: 'var(--accent-warning)' }} />
                      <span>{store.store_name}</span>
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        ({formatCurrency(store.total_revenue || 0)})
                      </span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {store.products?.map((product, pIndex) => (
                        <div 
                          key={pIndex} 
                          className="rounded-lg p-4 border transition-all duration-200 hover:shadow-md"
                          style={{
                            background: 'var(--bg-elevated)',
                            borderColor: 'var(--border-secondary)',
                            borderTop: '2px solid var(--accent-vapor)'
                          }}
                        >
                          <div 
                            className="font-medium mb-2"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {product.product_name}
                          </div>
                          <div className="text-sm space-y-1">
                            <div style={{ color: 'var(--text-secondary)' }}>
                              Qty: <span style={{ color: 'var(--text-primary)' }}>{product.total_quantity || 0}</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                              Revenue: <span style={{ color: 'var(--accent-success)' }}>{formatCurrency(product.total_revenue || 0)}</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                              Transactions: <span style={{ color: 'var(--text-primary)' }}>{product.transaction_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <BarChart3 
                    className="h-16 w-16 mx-auto mb-4" 
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <h3 
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    No Product Breakdown
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    No product breakdown data available for this date.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Store Reports and Sales Records View */
            <div className="space-y-6">
              {/* Store Performance */}
              <div>
                <h4 
                  className="text-lg font-semibold mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Store Performance
                </h4>
                {dayRecords.reports?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {dayRecords.reports.map((report, index) => (
                      <div 
                        key={index} 
                        className="rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                        style={{
                          background: 'var(--bg-card)',
                          borderColor: 'var(--border-primary)',
                          boxShadow: 'var(--shadow-sm)',
                          borderTop: '3px solid var(--accent-vapor)'
                        }}
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, var(--accent-vapor) 0%, #0ea5e9 100%)',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <Store className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h5 
                              className="font-semibold"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {report.stores?.name}
                            </h5>
                            <p 
                              className="text-xs"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {report.stores?.location}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span 
                              className="text-sm"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Revenue:
                            </span>
                            <span 
                              className="font-semibold text-lg"
                              style={{ color: 'var(--accent-success)' }}
                            >
                              {formatCurrency(report.daily_total || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span 
                              className="text-sm"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Transactions:
                            </span>
                            <span 
                              className="font-semibold"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {(report.shift1_transaction_count || 0) + (report.shift2_transaction_count || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span 
                              className="text-sm"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Hours:
                            </span>
                            <span 
                              className="font-semibold"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {((report.shift1_hours || 0) + (report.shift2_hours || 0)).toFixed(1)}h
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 mb-6">
                    <AlertCircle 
                      className="h-12 w-12 mx-auto mb-3" 
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <p style={{ color: 'var(--text-secondary)' }}>
                      No store reports found for this date.
                    </p>
                  </div>
                )}
              </div>

              {/* Sales Records */}
              <div>
                <h4 
                  className="text-lg font-semibold mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Sales Records ({dayRecords.sales?.length || 0})
                </h4>
                {dayRecords.sales?.length > 0 ? (
                  <div 
                    className="rounded-xl border overflow-hidden"
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border-primary)',
                      boxShadow: 'var(--shadow-sm)',
                      borderTop: '3px solid var(--accent-success)'
                    }}
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead 
                          style={{
                            background: 'var(--bg-elevated)',
                            borderBottom: '1px solid var(--border-secondary)'
                          }}
                        >
                          <tr>
                            <th 
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Time
                            </th>
                            <th 
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Worker
                            </th>
                            <th 
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Product
                            </th>
                            <th 
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Quantity
                            </th>
                            <th 
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Price
                            </th>
                            <th 
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Shift
                            </th>
                          </tr>
                        </thead>
                        <tbody 
                          className="divide-y"
                          style={{
                            background: 'var(--bg-card)',
                            borderColor: 'var(--border-secondary)'
                          }}
                        >
                          {dayRecords.sales.map((record, index) => (
                            <tr 
                              key={record.id || index} 
                              className="transition-colors duration-200"
                              style={{
                                borderColor: 'var(--border-secondary)'
                              }}
                              onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                              onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center space-x-2">
                                  <Clock 
                                    className="h-4 w-4" 
                                    style={{ color: 'var(--text-muted)' }}
                                  />
                                  <span style={{ color: 'var(--text-primary)' }}>
                                    {new Date(record.created_at).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center space-x-2">
                                  <Users 
                                    className="h-4 w-4" 
                                    style={{ color: 'var(--text-muted)' }}
                                  />
                                  <span style={{ color: 'var(--text-primary)' }}>
                                    {record.store_users?.name || 'Unknown'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center space-x-2">
                                  <Package 
                                    className="h-4 w-4" 
                                    style={{ color: 'var(--text-muted)' }}
                                  />
                                  <span style={{ color: 'var(--text-primary)' }}>
                                    {record.product}
                                  </span>
                                </div>
                              </td>
                              <td 
                                className="px-4 py-3 whitespace-nowrap text-sm"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {record.quantity ? `${record.quantity} pcs` : record.ml_amount ? `${record.ml_amount} ml` : '-'}
                              </td>
                              <td 
                                className="px-4 py-3 whitespace-nowrap text-sm font-medium"
                                style={{ color: 'var(--accent-success)' }}
                              >
                                {formatCurrency(record.price)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    background: 'var(--bg-vapor)',
                                    color: 'var(--accent-vapor)'
                                  }}
                                >
                                  Shift {record.shifts?.shift_number || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText 
                      className="h-16 w-16 mx-auto mb-4" 
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <h3 
                      className="text-lg font-semibold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      No Sales Records
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      No sales records found for this date.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default DayReportsPopup
