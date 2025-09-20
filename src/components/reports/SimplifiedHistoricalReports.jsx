import React, { useState, useEffect } from 'react'
import { Card } from '../ui'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { useHistoricalReports, useDetailedBreakdowns } from '../../hooks'
import { CalendarView } from './index'
import { 
  Calendar, 
  Download, 
  BarChart3, 
  X, 
  Store, 
  DollarSign, 
  Users, 
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Trash2
} from 'lucide-react'
import { 
  exportDailyRecordsToExcel, 
  exportDetailedBreakdownToExcel,
  exportMonthlySummaryToExcel 
} from '../../utils/exportUtils'

const SimplifiedHistoricalReports = () => {
  // Use existing hooks
  const {
    currentDate,
    selectedDate,
    availableDates,
    dailyReports,
    loading,
    error,
    isMobile,
    setCurrentDate,
    setSelectedDate,
    refreshData
  } = useHistoricalReports()

  const {
    productBreakdown,
    loadingProductBreakdown,
    loadDailyProductBreakdown
  } = useDetailedBreakdowns()


  // Handle date selection from calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  // Handle month navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  // Handle monthly export
  const handleMonthlyExport = async () => {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      // Get monthly summary data
      const { data: monthlyData, error } = await supabase.rpc('get_monthly_summary', {
        p_year: year,
        p_month: month
      })

      if (error) throw error

      await exportMonthlySummaryToExcel(monthlyData, currentDate)
    } catch (error) {
      console.error('Monthly export failed:', error)
      alert('Failed to export monthly data. Please try again.')
    }
  }

  // Handle data cleanup (60+ days old)
  const handleDataCleanup = async () => {
    if (!confirm('This will permanently delete all data older than 60 days. Are you sure?')) {
      return
    }

    try {
      const { data, error } = await supabase.rpc('cleanup_old_data')

      if (error) throw error

      if (data.success) {
        const { deleted_records, total_deleted } = data
        alert(`Data cleanup completed successfully!\n\nDeleted records:\n- Sales: ${deleted_records.sales}\n- Daily Reports: ${deleted_records.daily_reports}\n- Worker Transactions: ${deleted_records.worker_transactions}\n- Notifications: ${deleted_records.notifications}\n- Security Logs: ${deleted_records.security_logs}\n\nTotal: ${total_deleted} records deleted`)
        refreshData() // Refresh the current view
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Data cleanup failed:', error)
      alert('Failed to cleanup old data: ' + error.message)
    }
  }


  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Executive Header */}
        <div className="rounded-xl mb-8 overflow-hidden relative" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-primary)', transition: 'all 0.3s ease' }}>
          {/* Top accent border */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '4px', 
            background: 'linear-gradient(90deg, var(--accent-vapor), var(--accent-purple))' 
          }}></div>
          <div className="px-6 py-6">
            {/* Title Section */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-10">
              <div className="flex items-center space-x-5 mb-8 xl:mb-0">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-vapor), var(--accent-purple))', boxShadow: 'var(--shadow-md)' }}>
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl xl:text-5xl font-light tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Historical Reports
                  </h1>
                  <p className="mt-2 text-lg font-light" style={{ color: 'var(--text-secondary)' }}>
                    Executive sales analytics and performance insights
                  </p>
                </div>
              </div>
              
              {/* Executive Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleMonthlyExport}
                  disabled={loading}
                  className="group relative inline-flex items-center px-8 py-3.5 text-white text-sm font-semibold rounded-2xl focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-success), #059669)',
                    boxShadow: 'var(--shadow-lg)',
                    focusRingColor: 'var(--accent-success)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = 'var(--shadow-2xl)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = 'var(--shadow-lg)'
                  }}
                >
                  <FileSpreadsheet className="h-5 w-5 mr-3" />
                  <span className="hidden sm:inline">Export Monthly Report</span>
                  <span className="sm:hidden">Export</span>
                </button>
                
                <button
                  onClick={handleDataCleanup}
                  disabled={loading}
                  className="group relative inline-flex items-center px-8 py-3.5 text-white text-sm font-semibold rounded-2xl focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-cherry), #b91c1c)',
                    boxShadow: 'var(--shadow-lg)',
                    focusRingColor: 'var(--accent-cherry)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = 'var(--shadow-2xl)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = 'var(--shadow-lg)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Trash2 className="relative h-5 w-5 mr-3" />
                  <span className="relative hidden sm:inline">Data Cleanup</span>
                  <span className="relative sm:hidden">Cleanup</span>
                </button>
              </div>
            </div>

            {/* Refined Month Navigation */}
            <div className="flex items-center justify-between rounded-xl p-4 mt-6" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-secondary)' }}>
              <button
                onClick={() => navigateMonth(-1)}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-hover)'
                  e.target.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-card)'
                  e.target.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous Month
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl xl:text-3xl font-light tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {availableDates.length} reporting days available
                </p>
              </div>
              
              <button
                onClick={() => navigateMonth(1)}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-hover)'
                  e.target.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-card)'
                  e.target.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                Next Month
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Executive Calendar Container */}
        <div className="rounded-xl overflow-hidden relative" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-primary)', transition: 'all 0.3s ease' }}>
          {/* Top accent border */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '4px', 
            background: 'linear-gradient(90deg, var(--accent-success), #34D399)' 
          }}></div>
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-xl font-light tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Monthly Overview
              </h3>
              <p className="text-sm font-light mt-1" style={{ color: 'var(--text-secondary)' }}>
                Select any date to view detailed performance metrics
              </p>
            </div>
            <CalendarView
              currentDate={currentDate}
              availableDates={availableDates}
              dailyReports={dailyReports}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              isMobile={isMobile}
              loadDailyProductBreakdown={loadDailyProductBreakdown}
              productBreakdown={productBreakdown}
              loadingProductBreakdown={loadingProductBreakdown}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimplifiedHistoricalReports
