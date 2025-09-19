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
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] border border-gray-100 overflow-hidden">
        {/* Executive Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-5">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-slate-900 tracking-tight">
                  Daily Performance Report
                </h3>
                <p className="text-slate-600 text-sm font-light mt-1">
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
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Executive Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-slate-200 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-light text-slate-900 tracking-tight">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-slate-200 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Transactions</p>
                  <p className="text-3xl font-light text-slate-900 tracking-tight">
                    {totalTransactions.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-slate-200 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Active Staff</p>
                  <p className="text-3xl font-light text-slate-900 tracking-tight">
                    {uniqueWorkers}
                  </p>
                </div>
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
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
              className="inline-flex items-center px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
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
              className="inline-flex items-center px-6 py-3 bg-white text-slate-700 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
            
            {showBreakdown && productBreakdown && (
              <button
                onClick={handleExportBreakdown}
                disabled={loadingProductBreakdown}
                className="inline-flex items-center px-6 py-3 bg-white text-slate-700 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Analysis
              </button>
            )}
          </div>
        </div>

        {/* Executive Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[60vh] bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-600 mr-3" />
              <span className="text-slate-600 font-light">Loading performance data...</span>
            </div>
          ) : showBreakdown && productBreakdown ? (
            /* Product Breakdown View */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Product Sales Breakdown</h4>
                <button
                  onClick={() => setShowBreakdown(false)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Back to Store Reports
                </button>
              </div>
              {productBreakdown && Array.isArray(productBreakdown) && productBreakdown.length > 0 ? (
                productBreakdown.map((store, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                      <Store className="h-4 w-4" />
                      <span>{store.store_name}</span>
                      <span className="text-sm text-gray-600">({formatCurrency(store.total_revenue || 0)})</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {store.products?.map((product, pIndex) => (
                        <div key={pIndex} className="bg-white rounded p-3 border">
                          <div className="font-medium text-gray-900">{product.product_name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>Qty: {product.total_quantity || 0}</div>
                            <div>Revenue: {formatCurrency(product.total_revenue || 0)}</div>
                            <div>Transactions: {product.transaction_count || 0}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Product Breakdown</h3>
                  <p className="text-gray-600">No product breakdown data available for this date.</p>
                </div>
              )}
            </div>
          ) : (
            /* Store Reports and Sales Records View */
            <div className="space-y-6">
              {/* Store Performance */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Store Performance</h4>
                {dayRecords.reports?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {dayRecords.reports.map((report, index) => (
                      <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <Store className="h-5 w-5 text-blue-600" />
                          <div>
                            <h5 className="font-semibold text-blue-800">{report.stores?.name}</h5>
                            <p className="text-xs text-blue-600">{report.stores?.location}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Revenue:</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(report.daily_total || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Transactions:</span>
                            <span className="font-semibold">
                              {(report.shift1_transaction_count || 0) + (report.shift2_transaction_count || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Hours:</span>
                            <span className="font-semibold">
                              {((report.shift1_hours || 0) + (report.shift2_hours || 0)).toFixed(1)}h
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 mb-6">
                    <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600">No store reports found for this date.</p>
                  </div>
                )}
              </div>

              {/* Sales Records */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Sales Records ({dayRecords.sales?.length || 0})
                </h4>
                {dayRecords.sales?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Worker
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Shift
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dayRecords.sales.map((record, index) => (
                          <tr key={record.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>
                                  {new Date(record.created_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>{record.store_users?.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span>{record.product}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {record.quantity ? `${record.quantity} pcs` : record.ml_amount ? `${record.ml_amount} ml` : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                              {formatCurrency(record.price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Shift {record.shifts?.shift_number || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales Records</h3>
                    <p className="text-gray-600">No sales records found for this date.</p>
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
