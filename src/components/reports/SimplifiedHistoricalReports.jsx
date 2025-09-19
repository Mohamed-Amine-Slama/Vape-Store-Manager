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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Executive Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-12 overflow-hidden">
          <div className="px-8 py-10">
            {/* Title Section */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-10">
              <div className="flex items-center space-x-5 mb-8 xl:mb-0">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl xl:text-5xl font-light text-slate-900 tracking-tight">
                    Historical Reports
                  </h1>
                  <p className="text-slate-600 mt-2 text-lg font-light">
                    Executive sales analytics and performance insights
                  </p>
                </div>
              </div>
              
              {/* Executive Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleMonthlyExport}
                  disabled={loading}
                  className="group relative inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-2xl hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <FileSpreadsheet className="relative h-5 w-5 mr-3" />
                  <span className="relative hidden sm:inline">Export Monthly Report</span>
                  <span className="relative sm:hidden">Export</span>
                </button>
                
                <button
                  onClick={handleDataCleanup}
                  disabled={loading}
                  className="group relative inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-2xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Trash2 className="relative h-5 w-5 mr-3" />
                  <span className="relative hidden sm:inline">Data Cleanup</span>
                  <span className="relative sm:hidden">Cleanup</span>
                </button>
              </div>
            </div>

            {/* Refined Month Navigation */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="inline-flex items-center px-5 py-2.5 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous Month
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl xl:text-3xl font-light text-slate-900 tracking-tight">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  {availableDates.length} reporting days available
                </p>
              </div>
              
              <button
                onClick={() => navigateMonth(1)}
                className="inline-flex items-center px-5 py-2.5 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Next Month
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Executive Calendar Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-xl font-light text-slate-900 tracking-tight">
                Monthly Overview
              </h3>
              <p className="text-slate-600 text-sm font-light mt-1">
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
