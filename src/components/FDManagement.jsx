import React, { useState, useEffect } from 'react'
import { Button, CustomDropdown } from './ui'
import { useFD } from '../hooks/useFD'
import { 
  Coins, 
  Calendar, 
  Store, 
  User, 
  FileText, 
  Download,
  Filter,
  TrendingUp,
  Clock,
  ChevronDown,
  Search,
  CalendarDays,
  Building2,
  Sparkles
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '../lib/utils'
import { exportToCSV } from '../lib/utils'

const FDManagement = () => {
  const [selectedStore, setSelectedStore] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  })
  const [stores, setStores] = useState([])

  const { 
    fdRecords, 
    loading, 
    error, 
    loadFDRecords, 
    getFDRecordsForDateRange 
  } = useFD()

  // Load stores on mount
  useEffect(() => {
    const loadStores = async () => {
      try {
        const { supabase } = await import('../lib/supabase')
        const { data, error } = await supabase
          .from('stores')
          .select('id, name')
          .order('name')
        
        if (error) throw error
        setStores(data || [])
      } catch (err) {
        console.error('Error loading stores:', err)
      }
    }
    loadStores()
  }, [])

  // Load FD records on mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      await loadFDRecords({
        storeId: selectedStore || null,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
    }
    loadData()
  }, [selectedStore, dateRange.startDate, dateRange.endDate, loadFDRecords])

  const handleExportFDRecords = async () => {
    try {
      const result = await getFDRecordsForDateRange(
        dateRange.startDate,
        dateRange.endDate,
        selectedStore || null
      )

      if (result.success && result.data.length > 0) {
        const exportData = result.data.map(record => ({
          Date: new Date(record.fd_date).toLocaleDateString(),
          Store: record.store_name,
          Worker: record.user_name,
          Shift: record.shift_number,
          'FD Amount (TND)': record.amount,
          Notes: record.notes || '',
          'Set On': new Date(record.created_at).toLocaleString()
        }))

        const filename = `fd-records-${dateRange.startDate}-to-${dateRange.endDate}`
        exportToCSV(exportData, filename)
      } else {
        alert('No FD records found for the selected criteria')
      }
    } catch (error) {
      alert('Failed to export FD records')
    }
  }

  const calculateStats = () => {
    if (!fdRecords.length) return null

    const totalAmount = fdRecords.reduce((sum, record) => sum + parseFloat(record.amount), 0)
    const averageAmount = totalAmount / fdRecords.length
    const storeStats = fdRecords.reduce((acc, record) => {
      if (!acc[record.store_name]) {
        acc[record.store_name] = { count: 0, total: 0 }
      }
      acc[record.store_name].count++
      acc[record.store_name].total += parseFloat(record.amount)
      return acc
    }, {})

    return {
      totalRecords: fdRecords.length,
      totalAmount,
      averageAmount,
      storeStats
    }
  }

  const stats = calculateStats()

  // Convert stores to dropdown options with enhanced styling
  const storeOptions = [
    { 
      value: '', 
      label: 'All Stores', 
      icon: <Building2 />,
      description: 'View records from all stores'
    },
    ...stores.map(store => ({ 
      value: store.id, 
      label: store.name,
      icon: <Store />,
      description: `Records from ${store.name}`
    }))
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-400/10 to-green-600/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Coins className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    FD Management
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    Font de Caisse (Cash Fund) Records
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-indigo-500/3 to-purple-500/3"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-blue-600/10 rounded-full translate-y-16 -translate-x-16"></div>
          
          <div className="relative p-6 sm:p-8">
            {/* Header with Animation */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Filter className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                    Smart Filters
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Refine your FD records search</p>
                </div>
              </div>
              
              {/* Quick Filter Badges */}
              <div className="hidden lg:flex items-center space-x-2">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    setDateRange({ startDate: today, endDate: today })
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    const today = new Date().toISOString().split('T')[0]
                    setDateRange({ startDate: weekAgo, endDate: today })
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors duration-200"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => {
                    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    const today = new Date().toISOString().split('T')[0]
                    setDateRange({ startDate: monthAgo, endDate: today })
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors duration-200"
                >
                  Last 30 days
                </button>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Enhanced Store Dropdown */}
              <div className="space-y-3">
                <CustomDropdown
                  label="Store Selection"
                  options={storeOptions}
                  value={selectedStore}
                  onChange={setSelectedStore}
                  placeholder="Choose a store..."
                  searchable={true}
                  clearable={true}
                  icon={<Building2 />}
                  size="md"
                  className="w-full"
                />
              </div>
              
              {/* Enhanced Start Date */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                  <span>Start Date</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md hover:border-blue-300 text-gray-900 font-medium"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
              
              {/* Enhanced End Date */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <CalendarDays className="h-4 w-4 text-purple-500" />
                  <span>End Date</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md hover:border-purple-300 text-gray-900 font-medium"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            </div>
            
            {/* Mobile Quick Filters */}
            <div className="lg:hidden mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Filters:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    setDateRange({ startDate: today, endDate: today })
                  }}
                  className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors duration-200"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    const today = new Date().toISOString().split('T')[0]
                    setDateRange({ startDate: weekAgo, endDate: today })
                  }}
                  className="px-4 py-2 text-sm font-medium bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors duration-200"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => {
                    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    const today = new Date().toISOString().split('T')[0]
                    setDateRange({ startDate: monthAgo, endDate: today })
                  }}
                  className="px-4 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-200"
                >
                  Last 30 days
                </button>
              </div>
            </div>
            
            {/* Filter Summary */}
            {(selectedStore || dateRange.startDate !== new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || dateRange.endDate !== new Date().toISOString().split('T')[0]) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStore('')
                      setDateRange({
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0]
                      })
                    }}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors duration-200"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedStore && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Store: {storeOptions.find(s => s.value === selectedStore)?.label}
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {dateRange.startDate} to {dateRange.endDate}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modern Statistics */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-blue-600/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/10 to-green-600/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total FD Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-purple-600/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Average FD</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageAmount)}</p>
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/10 to-amber-600/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Stores Covered</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.storeStats).length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern FD Records Table */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/2 via-slate-500/2 to-gray-500/2"></div>
          
          <div className="relative p-6 sm:p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">FD Records</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {loading ? 'Loading...' : `${fdRecords.length} records found`}
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mx-6 sm:mx-8 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Mobile-First Responsive Table */}
          <div className="relative">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Store</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Worker</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Shift</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">FD Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Set On</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-gray-500 font-medium">Loading FD records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : fdRecords.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <Coins className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">No FD records found</p>
                            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or date range</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    fdRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(record.fd_date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Store className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{record.store_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{record.user_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            record.shift_number === 1 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            Shift {record.shift_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(record.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <span className="text-sm text-gray-600 truncate block">
                            {record.notes || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {formatDateTime(record.created_at)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden p-4 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-500 font-medium">Loading FD records...</span>
                </div>
              ) : fdRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Coins className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">No FD records found</p>
                    <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or date range</p>
                  </div>
                </div>
              ) : (
                fdRecords.map((record) => (
                  <div key={record.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(record.fd_date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        record.shift_number === 1 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        Shift {record.shift_number}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Store className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Store:</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{record.store_name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Worker:</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{record.user_name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Coins className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600">FD Amount:</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(record.amount)}
                        </span>
                      </div>
                      
                      {record.notes && (
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-start space-x-2">
                            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <span className="text-sm text-gray-600">Notes:</span>
                              <p className="text-sm text-gray-900 mt-1">{record.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Set on {formatDateTime(record.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FDManagement 
