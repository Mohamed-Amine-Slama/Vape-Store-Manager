import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { 
  Store, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  Activity,
  BarChart3,
  Calendar,
  RefreshCw
} from 'lucide-react'
import './MultiStoreSummary.css'

export default function MultiStoreSummary() {
  const [storeData, setStoreData] = useState([])
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    activeShifts: 0,
    todayReports: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchMultiStoreData()
    let interval
    if (autoRefresh) {
      interval = setInterval(fetchMultiStoreData, 15000) // Refresh every 15 seconds for live tracking
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchMultiStoreData = async () => {
    try {
      setLoading(true)
      
      // Use the new optimized function to get live revenue data
      const { data: liveData, error: liveError } = await supabase
        .rpc('get_live_store_revenue')

      if (liveError) {
        console.error('Live data function not available, falling back to manual queries:', liveError)
        await fetchMultiStoreDataFallback()
        return
      }

      // Additional fallback: if function returns data but revenue is 0, double-check with direct query
      if (liveData && Array.isArray(liveData)) {
        const totalRevenueFromFunction = liveData.reduce((sum, store) => sum + (parseFloat(store.today_revenue) || 0), 0)
        if (totalRevenueFromFunction === 0) {
          console.log('Function returned 0 revenue, checking with direct query...')
          await fetchTodayRevenueDirectly()
        }
      }

      if (liveData && Array.isArray(liveData)) {
        // Debug: Log the raw data from the database function
        console.log('Raw live data from get_live_store_revenue():', liveData)
        
        // Transform the data to match our expected format
        const transformedStoreData = liveData.map(store => ({
          id: store.store_id,
          name: store.store_name,
          location: store.store_location,
          todayRevenue: parseFloat(store.today_revenue) || 0,
          todayTransactions: store.today_transactions || 0,
          activeShifts: store.active_shifts || 0,
          shifts: {
            shift1: store.shift1_worker ? {
              worker: store.shift1_worker,
              isActive: store.shift1_active,
              sales: parseFloat(store.shift1_revenue) || 0,
              transactions: store.shift1_transactions || 0
            } : null,
            shift2: store.shift2_worker ? {
              worker: store.shift2_worker,
              isActive: store.shift2_active,
              sales: parseFloat(store.shift2_revenue) || 0,
              transactions: store.shift2_transactions || 0
            } : null
          },
          hasCompletedDay: store.has_daily_report,
          dailyReport: store.has_daily_report ? {
            daily_total: parseFloat(store.daily_total) || 0,
            shift1_transaction_count: store.shift1_transactions || 0,
            shift2_transaction_count: store.shift2_transactions || 0
          } : null,
          lastSaleTime: store.last_sale_time
        }))

        setStoreData(transformedStoreData)

        // Calculate total stats
        const totals = transformedStoreData.reduce((acc, store) => ({
          totalRevenue: acc.totalRevenue + store.todayRevenue,
          totalSales: acc.totalSales + store.todayTransactions,
          activeShifts: acc.activeShifts + store.activeShifts,
          todayReports: acc.todayReports + (store.hasCompletedDay ? 1 : 0)
        }), { totalRevenue: 0, totalSales: 0, activeShifts: 0, todayReports: 0 })

        console.log('Transformed store data:', transformedStoreData)
        console.log('Calculated totals:', totals)
        
        setTotalStats(totals)
      }

      setLastUpdated(new Date())
      setError('')
    } catch (error) {
      console.error('Error fetching live store data:', error)
      setError('Failed to load live store data')
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayRevenueDirectly = async () => {
    try {
      console.log('Fetching today\'s revenue with direct query...')
      
      // Get today's date range
      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString()
      
      // Direct query to get today's sales by store
      const { data: todaySales, error: salesError } = await supabase
        .from('sales')
        .select('store_id, price, user_id, created_at')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
      
      if (salesError) {
        console.error('Error fetching today\'s sales:', salesError)
        return
      }
      
      console.log('Direct query found sales:', todaySales)
      
      // Get stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
      
      if (storesError) {
        console.error('Error fetching stores:', storesError)
        return
      }
      
      // Calculate revenue by store
      const storeRevenues = stores.map(store => {
        const storeSales = todaySales?.filter(sale => sale.store_id === store.id) || []
        const revenue = storeSales.reduce((sum, sale) => sum + parseFloat(sale.price), 0)
        return {
          id: store.id,
          name: store.name,
          location: store.location,
          todayRevenue: revenue,
          todayTransactions: storeSales.length,
          activeShifts: 0, // Will be calculated separately if needed
          shifts: { shift1: null, shift2: null },
          hasCompletedDay: false,
          dailyReport: null,
          lastSaleTime: storeSales.length > 0 ? Math.max(...storeSales.map(s => new Date(s.created_at).getTime())) : null
        }
      })
      
      console.log('Calculated store revenues:', storeRevenues)
      
      setStoreData(storeRevenues)
      
      // Calculate totals
      const totals = storeRevenues.reduce((acc, store) => ({
        totalRevenue: acc.totalRevenue + store.todayRevenue,
        totalSales: acc.totalSales + store.todayTransactions,
        activeShifts: 0,
        todayReports: 0
      }), { totalRevenue: 0, totalSales: 0, activeShifts: 0, todayReports: 0 })
      
      console.log('Direct query calculated totals:', totals)
      setTotalStats(totals)
      
    } catch (error) {
      console.error('Error in direct revenue fetch:', error)
    }
  }

  const fetchMultiStoreDataFallback = async () => {
    try {
      // Fetch stores with their current day data
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('name')

      if (storesError) throw storesError

      // Fetch today's data for each store
      const storeDataPromises = stores.map(async (store) => {
        // Get today's shifts
        const { data: shifts } = await supabase
          .from('shifts')
          .select(`
            *,
            store_users!inner(name),
            sales(total)
          `)
          .eq('store_id', store.id)
          .gte('start_time', new Date().toISOString().split('T')[0])
          .order('shift_number')

        // Get today's sales total
        const { data: todaySales } = await supabase
          .from('sales')
          .select('total')
          .eq('store_id', store.id)
          .gte('created_at', new Date().toISOString().split('T')[0])

        // Get daily report for today
        const { data: dailyReport } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('store_id', store.id)
          .eq('report_date', new Date().toISOString().split('T')[0])
          .single()

        // Calculate store stats
        const todayRevenue = todaySales?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0
        const todayTransactions = todaySales?.length || 0
        const activeShifts = shifts?.filter(shift => !shift.end_time).length || 0
        
        // Get shift details
        const shift1 = shifts?.find(s => s.shift_number === 1)
        const shift2 = shifts?.find(s => s.shift_number === 2)

        return {
          ...store,
          todayRevenue,
          todayTransactions,
          activeShifts,
          shifts: {
            shift1: shift1 ? {
              worker: shift1.store_users.name,
              startTime: shift1.start_time,
              endTime: shift1.end_time,
              isActive: !shift1.end_time,
              sales: shift1.sales?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0,
              transactions: shift1.sales?.length || 0
            } : null,
            shift2: shift2 ? {
              worker: shift2.store_users.name,
              startTime: shift2.start_time,
              endTime: shift2.end_time,
              isActive: !shift2.end_time,
              sales: shift2.sales?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0,
              transactions: shift2.sales?.length || 0
            } : null
          },
          dailyReport,
          hasCompletedDay: !!dailyReport
        }
      })

      const storeDataResults = await Promise.all(storeDataPromises)
      setStoreData(storeDataResults)

      // Calculate total stats
      const totals = storeDataResults.reduce((acc, store) => ({
        totalRevenue: acc.totalRevenue + store.todayRevenue,
        totalSales: acc.totalSales + store.todayTransactions,
        activeShifts: acc.activeShifts + store.activeShifts,
        todayReports: acc.todayReports + (store.hasCompletedDay ? 1 : 0)
      }), { totalRevenue: 0, totalSales: 0, activeShifts: 0, todayReports: 0 })

      setTotalStats(totals)
      setLastUpdated(new Date())
      setError('')
    } catch (error) {
      console.error('Error fetching multi-store data:', error)
      setError('Failed to load store data')
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = () => {
    setLoading(true)
    fetchMultiStoreData()
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Not started'
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading && storeData.length === 0) {
    return (
      <div className="multi-store-summary loading">
        <div className="loading-spinner"></div>
        <p>Loading store data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="multi-store-summary error">
        <p>{error}</p>
        <button onClick={fetchMultiStoreData} className="retry-button">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="multi-store-summary">
      {/* Live Tracking Header */}
      <div className="live-tracking-header">
        <div className="header-info">
          <h2>Live Revenue Tracking</h2>
          <div className="update-info">
            {lastUpdated && (
              <span className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <div className="refresh-controls">
              <button 
                onClick={handleManualRefresh} 
                className={`refresh-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <label className="auto-refresh-toggle">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
            </div>
          </div>
        </div>
        <div className={`live-indicator ${autoRefresh ? 'active' : 'paused'}`}>
          <div className="indicator-dot"></div>
          {autoRefresh ? 'LIVE' : 'PAUSED'}
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="summary-cards">
        <div className="summary-card revenue">
          <div className="card-icon">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="card-content">
            <h3>Today's Revenue</h3>
            <p className="amount">{formatCurrency(totalStats.totalRevenue)}</p>
            <span className="label">All Stores</span>
          </div>
        </div>

        <div className="summary-card sales">
          <div className="card-icon">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="card-content">
            <h3>Today's Sales</h3>
            <p className="amount">{totalStats.totalSales}</p>
            <span className="label">Transactions</span>
          </div>
        </div>

        <div className="summary-card shifts">
          <div className="card-icon">
            <Activity className="h-6 w-6" />
          </div>
          <div className="card-content">
            <h3>Active Shifts</h3>
            <p className="amount">{totalStats.activeShifts}</p>
            <span className="label">Currently Working</span>
          </div>
        </div>

        <div className="summary-card reports">
          <div className="card-icon">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="card-content">
            <h3>Completed Days</h3>
            <p className="amount">{totalStats.todayReports}/3</p>
            <span className="label">Daily Reports</span>
          </div>
        </div>
      </div>

      {/* Individual Store Cards */}
      <div className="stores-grid">
        {storeData.map((store) => (
          <div key={store.id} className={`store-card ${store.hasCompletedDay ? 'completed' : ''}`}>
            <div className="store-header">
              <div className="store-info">
                <div className="store-icon">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h3>{store.name}</h3>
                  <p>{store.location}</p>
                </div>
              </div>
              <div className={`status-badge ${store.hasCompletedDay ? 'completed' : store.activeShifts > 0 ? 'active' : 'inactive'}`}>
                {store.hasCompletedDay ? 'Day Complete' : store.activeShifts > 0 ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="store-stats">
              <div className="stat">
                <span className="stat-label">Today's Revenue</span>
                <span className="stat-value">{formatCurrency(store.todayRevenue)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Transactions</span>
                <span className="stat-value">{store.todayTransactions}</span>
              </div>
              {store.lastSaleTime && (
                <div className="stat last-sale">
                  <span className="stat-label">Last Sale</span>
                  <span className="stat-value">{formatTime(store.lastSaleTime)}</span>
                </div>
              )}
            </div>

            <div className="shifts-info">
              <div className="shift-row">
                <div className="shift-header">
                  <Clock className="h-4 w-4" />
                  <span>Shift 1</span>
                </div>
                {store.shifts.shift1 ? (
                  <div className="shift-details">
                    <div className="worker-info">
                      <span className="worker-name">{store.shifts.shift1.worker}</span>
                      <span className={`shift-status ${store.shifts.shift1.isActive ? 'active' : 'completed'}`}>
                        {store.shifts.shift1.isActive ? 'Active' : 'Completed'}
                      </span>
                    </div>
                    <div className="shift-times">
                      <span>Start: {formatTime(store.shifts.shift1.startTime)}</span>
                      {store.shifts.shift1.endTime && (
                        <span>End: {formatTime(store.shifts.shift1.endTime)}</span>
                      )}
                    </div>
                    <div className="shift-sales">
                      {formatCurrency(store.shifts.shift1.sales)} ({store.shifts.shift1.transactions} sales)
                    </div>
                  </div>
                ) : (
                  <div className="shift-empty">Not started</div>
                )}
              </div>

              <div className="shift-row">
                <div className="shift-header">
                  <Clock className="h-4 w-4" />
                  <span>Shift 2</span>
                </div>
                {store.shifts.shift2 ? (
                  <div className="shift-details">
                    <div className="worker-info">
                      <span className="worker-name">{store.shifts.shift2.worker}</span>
                      <span className={`shift-status ${store.shifts.shift2.isActive ? 'active' : 'completed'}`}>
                        {store.shifts.shift2.isActive ? 'Active' : 'Completed'}
                      </span>
                    </div>
                    <div className="shift-times">
                      <span>Start: {formatTime(store.shifts.shift2.startTime)}</span>
                      {store.shifts.shift2.endTime && (
                        <span>End: {formatTime(store.shifts.shift2.endTime)}</span>
                      )}
                    </div>
                    <div className="shift-sales">
                      {formatCurrency(store.shifts.shift2.sales)} ({store.shifts.shift2.transactions} sales)
                    </div>
                  </div>
                ) : (
                  <div className="shift-empty">Not started</div>
                )}
              </div>
            </div>

            {store.hasCompletedDay && store.dailyReport && (
              <div className="daily-summary">
                <h4>Daily Summary</h4>
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span>Total Revenue</span>
                    <span>{formatCurrency(store.dailyReport.daily_total)}</span>
                  </div>
                  <div className="summary-stat">
                    <span>Total Transactions</span>
                    <span>{store.dailyReport.shift1_transaction_count + store.dailyReport.shift2_transaction_count}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
