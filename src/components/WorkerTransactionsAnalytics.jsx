import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Select, Badge } from './ui'
import { formatCurrency, formatDateTime } from '../lib/utils'
import { Calendar, DollarSign, Package, Users, TrendingUp, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

export default function WorkerTransactionsAnalytics() {
  const [transactions, setTransactions] = useState([])
  const [workers, setWorkers] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedWorker, setSelectedWorker] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [calendarData, setCalendarData] = useState([])
  const [summary, setSummary] = useState({
    totalAdvances: 0,
    totalAdvanceAmount: 0,
    totalConsumptions: 0,
    totalWorkers: 0
  })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  // Detect mobile to fine-tune paddings/fonts while keeping 7-column grid
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadTransactions()
    loadCalendarData()
  }, [selectedWorker, selectedStore, selectedType, selectedMonth, selectedYear])

  const loadInitialData = async () => {
    try {
      // Load workers
      const { data: workersData } = await supabase
        .from('store_users')
        .select('id, name')
        .eq('role', 'worker')
        .order('name')

      // Load stores
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name')
        .order('name')

      setWorkers(workersData || [])
      setStores(storesData || [])
    } catch (error) {
      // Error loading initial data
    }
  }

  const loadTransactions = async () => {
    setLoading(true)
    try {
      // Build query for transactions with filters
      let query = supabase
        .from('worker_transactions')
        .select(`
          *,
          store_users!inner(name),
          stores!inner(name)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (selectedWorker) {
        query = query.eq('user_id', selectedWorker)
      }
      if (selectedStore) {
        query = query.eq('store_id', selectedStore)
      }
      if (selectedType) {
        query = query.eq('transaction_type', selectedType)
      }

      // Date range filter for current month/year
      const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
      query = query.gte('transaction_date', startDate).lte('transaction_date', endDate)

      const { data, error } = await query

      if (error) throw error

      setTransactions(data || [])

      // Calculate summary
      const advances = data?.filter(t => t.transaction_type === 'salary_advance') || []
      const consumptions = data?.filter(t => t.transaction_type === 'product_consumption') || []
      const uniqueWorkers = new Set(data?.map(t => t.user_id) || [])

      setSummary({
        totalAdvances: advances.length,
        totalAdvanceAmount: advances.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        totalConsumptions: consumptions.length,
        totalWorkers: uniqueWorkers.size
      })
    } catch (error) {
      // Error loading transactions
    }
    setLoading(false)
  }

  const loadCalendarData = async () => {
    try {
      // Get all workers' transaction data for calendar view
      const { data, error } = await supabase.rpc('get_worker_transactions_by_date', {
        p_user_id: selectedWorker || null,
        p_year: selectedYear,
        p_month: selectedMonth
      })

      if (error) throw error
      setCalendarData(data || [])
    } catch (error) {
      // Error loading calendar data
    }
  }

  const exportTransactions = async () => {
    try {
      const exportData = transactions.map(transaction => ({
        Date: transaction.transaction_date,
        Time: formatDateTime(transaction.created_at),
        Worker: transaction.store_users.name,
        Store: transaction.stores.name,
        Type: transaction.transaction_type === 'salary_advance' ? 'Salary Advance' : 'Product Consumption',
        Amount: transaction.amount || '',
        Product: transaction.product_name || '',
        Category: transaction.product_category || '',
        Quantity: transaction.quantity || '',
        ML_Amount: transaction.ml_amount || '',
        Notes: transaction.notes || ''
      }))

      // Simple CSV export
      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `worker-transactions-${selectedYear}-${selectedMonth}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export transactions')
    }
  }

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate()
  }

  const getTransactionsForDate = (date) => {
    const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
    const dayData = calendarData.find(d => d.date === dateStr)
    return dayData?.transactions || []
  }

  // Month navigation like HistoricalReports
  const navigateMonth = (direction) => {
    let month = selectedMonth + direction
    let year = selectedYear
    if (month < 1) {
      month = 12
      year -= 1
    } else if (month > 12) {
      month = 1
      year += 1
    }
    setSelectedMonth(month)
    setSelectedYear(year)
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay()
    const today = new Date()
    const totalCells = firstDay + daysInMonth
    const totalWeeks = Math.ceil(totalCells / 7)
    const rows = []
    const rowStyle = { display: 'table', tableLayout: 'fixed', width: '100%' }
    const cellStyle = { display: 'table-cell', width: '14.2857%' }

    for (let week = 0; week < totalWeeks; week++) {
      const cells = []
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const cellIndex = week * 7 + dayOfWeek
        const isEmpty = cellIndex < firstDay || cellIndex >= totalCells
        if (isEmpty) {
          cells.push(
            <div key={`empty-${week}-${dayOfWeek}`} className={isMobile ? 'p-2' : 'p-3'} style={cellStyle}></div>
          )
          continue
        }

        const date = cellIndex - firstDay + 1
        const dayTransactions = getTransactionsForDate(date)
        const hasTransactions = dayTransactions.length > 0
        const advanceCount = dayTransactions.filter(t => t.transaction_type === 'salary_advance').length
        const consumptionCount = dayTransactions.filter(t => t.transaction_type === 'product_consumption').length
        const isToday = today.getFullYear() === selectedYear && (today.getMonth() + 1) === selectedMonth && today.getDate() === date

        cells.push(
          <div
            key={`day-${date}`}
            className={`relative ${isMobile ? 'p-2 min-h-[64px]' : 'p-3 min-h-[90px]'} border rounded-lg transition-all hover:shadow-sm ${
              hasTransactions
                ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
            style={cellStyle}
            title={hasTransactions ? `${dayTransactions.length} transactions` : 'No transactions'}
          >
            <div className="flex items-center justify-between">
              <div className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'} text-gray-800`}>{date}</div>
              {hasTransactions && (
                <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-gray-500`}>{dayTransactions.length} total</span>
              )}
            </div>
            {hasTransactions && (
              <div className={`${isMobile ? 'mt-1' : 'mt-2'} space-y-1`}>
                {advanceCount > 0 && (
                  <div className={`${isMobile ? 'text-[10px] px-1.5' : 'text-xs px-2'} bg-green-100 text-green-800 py-0.5 rounded-full inline-block`}>
                    {advanceCount} advance{advanceCount > 1 ? 's' : ''}
                  </div>
                )}
                {consumptionCount > 0 && (
                  <div className={`${isMobile ? 'text-[10px] px-1.5' : 'text-xs px-2'} bg-blue-100 text-blue-800 py-0.5 rounded-full inline-block ml-1`}>
                    {consumptionCount} consumption{consumptionCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      }
      rows.push(
        <div key={`week-${week}`} style={rowStyle}>
          {cells}
        </div>
      )
    }

    return rows
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Worker Transactions Analytics</h2>
              <p className="text-sm text-gray-500">Monitor salary advances and product consumption</p>
            </div>
          </div>
          <Button
            onClick={exportTransactions}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            disabled={transactions.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Select
            label="Worker"
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            options={[
              { value: '', label: 'All Workers' },
              ...workers.map(worker => ({ value: worker.id, label: worker.name }))
            ]}
          />
          <Select
            label="Store"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            options={[
              { value: '', label: 'All Stores' },
              ...stores.map(store => ({ value: store.id, label: store.name }))
            ]}
          />
          <Select
            label="Type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={[
              { value: '', label: 'All Types' },
              { value: 'salary_advance', label: 'Salary Advances' },
              { value: 'product_consumption', label: 'Product Consumption' }
            ]}
          />
          <Select
            label="Month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            options={[
              { value: 1, label: 'January' },
              { value: 2, label: 'February' },
              { value: 3, label: 'March' },
              { value: 4, label: 'April' },
              { value: 5, label: 'May' },
              { value: 6, label: 'June' },
              { value: 7, label: 'July' },
              { value: 8, label: 'August' },
              { value: 9, label: 'September' },
              { value: 10, label: 'October' },
              { value: 11, label: 'November' },
              { value: 12, label: 'December' }
            ]}
          />
          <Select
            label="Year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            options={[
              { value: 2024, label: '2024' },
              { value: 2025, label: '2025' },
              { value: 2026, label: '2026' }
            ]}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">{summary.totalAdvances}</div>
                <div className="text-sm text-green-700">Salary Advances</div>
                <div className="text-xs text-green-600">{formatCurrency(summary.totalAdvanceAmount)}</div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">{summary.totalConsumptions}</div>
                <div className="text-sm text-blue-700">Product Consumptions</div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-900">{summary.totalWorkers}</div>
                <div className="text-sm text-purple-700">Active Workers</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
                <div className="text-sm text-gray-700">Total Transactions</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar View */}
      <Card className="p-6 bg-gradient-to-br from-white to-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Worker Transactions Calendar</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium text-gray-700">
              {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          style={{ display: 'table', tableLayout: 'fixed', width: '100%' }}
        >
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div
              key={index}
              style={{ display: 'table-cell', width: '14.2857%' }}
              className={`${isMobile ? 'p-2 text-xs' : 'p-3 text-sm'} text-center bg-gray-50 rounded-lg font-medium text-gray-500`}
            >
              {day}
            </div>
          ))}
        </div>

        <div style={{ display: 'block', width: '100%' }}>
          {renderCalendar()}
        </div>
      </Card>

      {/* Transaction List */}
      <Card>
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Transaction Details</h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Worker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.store_users.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.stores.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={transaction.transaction_type === 'salary_advance' ? 'success' : 'info'}>
                        {transaction.transaction_type === 'salary_advance' ? 'Advance' : 'Consumption'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.transaction_type === 'salary_advance' ? (
                        formatCurrency(transaction.amount)
                      ) : (
                        <span>
                          <span className="font-medium">{transaction.product_name}</span>
                          {transaction.product_category && (
                            <span className="ml-2 text-xs text-gray-500">({transaction.product_category})</span>
                          )}
                          <span className="ml-2 text-gray-700">
                            - {transaction.ml_amount ? `${transaction.ml_amount}ml` : `${transaction.quantity} pcs`}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {transaction.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
