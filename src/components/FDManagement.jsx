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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-xl p-6 transition-all duration-300" style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Top accent border */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '4px', 
            background: 'linear-gradient(90deg, var(--accent-success), #34D399)',
            borderTopLeftRadius: '0.75rem',
            borderTopRightRadius: '0.75rem'
          }}></div>
          
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ 
                  background: 'linear-gradient(135deg, var(--accent-success), #34D399)',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    FD Management
                  </h1>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Font de Caisse (Cash Fund) Records
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="relative overflow-hidden rounded-xl p-6 transition-all duration-300" style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Top accent border */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '4px', 
            background: 'linear-gradient(90deg, var(--accent-vapor), var(--accent-purple))',
            borderTopLeftRadius: '0.75rem',
            borderTopRightRadius: '0.75rem'
          }}></div>
          
          <div className="relative">
            {/* Header with Animation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ 
                  background: 'linear-gradient(135deg, var(--accent-vapor), var(--accent-purple))',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Smart Filters
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Refine your FD records search</p>
                </div>
              </div>
              
              {/* Quick Filter Badges */}
              <div className="hidden lg:flex items-center space-x-2">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    setDateRange({ startDate: today, endDate: today })
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200"
                  style={{ 
                    backgroundColor: 'rgba(0, 212, 255, 0.1)', 
                    color: 'var(--accent-vapor)',
                    border: '1px solid var(--accent-vapor)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(0, 212, 255, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(0, 212, 255, 0.1)'
                  }}
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    const today = new Date().toISOString().split('T')[0]
                    setDateRange({ startDate: weekAgo, endDate: today })
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200"
                  style={{ 
                    backgroundColor: 'rgba(124, 58, 237, 0.1)', 
                    color: 'var(--accent-purple)',
                    border: '1px solid var(--accent-purple)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(124, 58, 237, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(124, 58, 237, 0.1)'
                  }}
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => {
                    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    const today = new Date().toISOString().split('T')[0]
                    setDateRange({ startDate: monthAgo, endDate: today })
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200"
                  style={{ 
                    backgroundColor: 'var(--bg-success)', 
                    color: 'var(--accent-success)',
                    border: '1px solid var(--accent-success)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-success)'
                  }}
                >
                  Last 30 days
                </button>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Enhanced Store Dropdown */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  <Building2 className="h-4 w-4" style={{ color: 'var(--accent-vapor)' }} />
                  <span>Store Selection</span>
                </label>
                <CustomDropdown
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
                <label className="flex items-center space-x-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  <CalendarDays className="h-4 w-4" style={{ color: 'var(--accent-vapor)' }} />
                  <span>Start Date</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                    className="w-full px-4 py-3 border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium hover:scale-[1.02]"
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-vapor)'
                      e.target.style.boxShadow = 'var(--shadow-glow)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)'
                      e.target.style.boxShadow = 'var(--shadow-md)'
                    }}
                  />
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, transparent 100%)'
                  }} className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
              
              {/* Enhanced End Date */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  <CalendarDays className="h-4 w-4" style={{ color: 'var(--accent-electric)' }} />
                  <span>End Date</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                    className="w-full px-4 py-3 border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium hover:scale-[1.02]"
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-electric)'
                      e.target.style.boxShadow = 'var(--shadow-glow-electric)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)'
                      e.target.style.boxShadow = 'var(--shadow-md)'
                    }}
                  />
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, transparent 100%)'
                  }} className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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
            <div className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:transform hover:scale-105" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {/* Top accent border */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px', 
                background: 'linear-gradient(90deg, var(--accent-vapor), #3B82F6)',
                borderTopLeftRadius: '0.75rem',
                borderTopRightRadius: '0.75rem'
              }}></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, var(--accent-vapor), #3B82F6)'
                }}>
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Records</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalRecords}</p>
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:transform hover:scale-105" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {/* Top accent border */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px', 
                background: 'linear-gradient(90deg, var(--accent-success), #34D399)',
                borderTopLeftRadius: '0.75rem',
                borderTopRightRadius: '0.75rem'
              }}></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, var(--accent-success), #34D399)'
                }}>
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total FD Amount</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:transform hover:scale-105" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {/* Top accent border */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px', 
                background: 'linear-gradient(90deg, var(--accent-purple), #A855F7)',
                borderTopLeftRadius: '0.75rem',
                borderTopRightRadius: '0.75rem'
              }}></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, var(--accent-purple), #A855F7)'
                }}>
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Average FD</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(stats.averageAmount)}</p>
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:transform hover:scale-105" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {/* Top accent border */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px', 
                background: 'linear-gradient(90deg, var(--accent-warning), #FBBF24)',
                borderTopLeftRadius: '0.75rem',
                borderTopRightRadius: '0.75rem'
              }}></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, var(--accent-warning), #FBBF24)'
                }}>
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Stores Covered</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{Object.keys(stats.storeStats).length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern FD Records Table */}
        <div className="relative overflow-hidden rounded-xl transition-all duration-300" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Top accent border */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '4px', 
            background: 'linear-gradient(90deg, var(--accent-warning), #FBBF24)',
            borderTopLeftRadius: '0.75rem',
            borderTopRightRadius: '0.75rem'
          }}></div>
          
          <div className="relative p-6" style={{ borderBottom: '1px solid var(--border-secondary)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, var(--accent-warning), #FBBF24)'
                }}>
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>FD Records</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {loading ? 'Loading...' : `${fdRecords.length} records found`}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mx-6 mb-6 p-4 rounded-xl" style={{
              backgroundColor: 'var(--bg-error)',
              border: '1px solid var(--accent-cherry)'
            }}>
              <p className="text-sm" style={{ color: 'var(--accent-cherry)' }}>{error}</p>
            </div>
          )}

          {/* Mobile-First Responsive Table */}
          <div className="relative">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'var(--bg-elevated)' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Store</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Worker</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Shift</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>FD Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Notes</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Set On</th>
                  </tr>
                </thead>
                <tbody style={{ background: 'var(--bg-card)' }}>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--accent-vapor)' }}></div>
                          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Loading FD records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : fdRecords.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <Coins className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <div>
                            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No FD records found</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or date range</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    fdRecords.map((record) => (
                      <tr key={record.id} className="transition-colors duration-150" style={{
                        borderBottom: '1px solid var(--border-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {new Date(record.fd_date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Store className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{record.store_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{record.user_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{
                            backgroundColor: record.shift_number === 1 ? 'rgba(0, 212, 255, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                            color: record.shift_number === 1 ? 'var(--accent-vapor)' : 'var(--accent-purple)'
                          }}>
                            Shift {record.shift_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold" style={{ color: 'var(--accent-success)' }}>
                            {formatCurrency(record.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <span className="text-sm truncate block" style={{ color: 'var(--text-secondary)' }}>
                            {record.notes || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--accent-vapor)' }}></div>
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Loading FD records...</span>
                </div>
              ) : fdRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <Coins className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No FD records found</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or date range</p>
                  </div>
                </div>
              ) : (
                fdRecords.map((record) => (
                  <div key={record.id} className="relative overflow-hidden rounded-xl p-4 transition-all duration-200" style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = 'var(--shadow-md)'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = 'var(--shadow-sm)'
                    e.target.style.transform = 'translateY(0)'
                  }}>
                    {/* Top accent border */}
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      height: '3px', 
                      background: 'linear-gradient(90deg, var(--accent-warning), #FBBF24)',
                      borderTopLeftRadius: '0.75rem',
                      borderTopRightRadius: '0.75rem'
                    }}></div>
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
