import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui'
import MultiStoreSummary from '../components/MultiStoreSummary'
import WorkerTable from '../components/WorkerTable'
import HistoricalReports from '../components/HistoricalReports'
import WorkerTransactionsAnalytics from '../components/WorkerTransactionsAnalytics'
import './Admin.css'
import UserManagement from '../components/UserManagement'
import ProductCatalog from '../components/ProductCatalog'
import InventoryManager from '../components/InventoryManager'
import NotificationsPopup from '../components/NotificationsPopup'
import FDManagement from '../components/FDManagement'
import NotificationSettings from '../components/admin/NotificationSettings'
import { exportToCSV } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { 
  BarChart3, 
  Users, 
  Package, 
  Download, 
  LogOut, 
  User,
  Settings,
  TrendingUp,
  Activity,
  Crown,
  FileText,
  Calendar,
  Bell,
  Search,
  Store,
  CreditCard,
  DollarSign
} from 'lucide-react'

export default function Admin() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
  }

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Multi-Store Dashboard', 
      icon: Store,
      description: 'All Stores Overview'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'Detailed Analytics'
    },
    { 
      id: 'reports', 
      label: 'Historical Reports', 
      icon: Calendar,
      description: 'Monthly & Daily Reports'
    },
    { 
      id: 'transactions', 
      label: 'Worker Transactions', 
      icon: CreditCard,
      description: 'Salary Advances & Consumption'
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: Users,
      description: 'User Management'
    },
    { 
      id: 'products', 
      label: 'Products', 
      icon: Package,
      description: 'Product Catalog'
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Package,
      description: 'Manage Store Inventory'
    },
    { 
      id: 'fd', 
      label: 'FD Management', 
      icon: DollarSign,
      description: 'Font de Caisse Records'
    },
    { 
      id: 'notifications', 
      label: 'Push Notifications', 
      icon: Bell,
      description: 'Mobile Notification Settings'
    },
  ]

  const handleExportSales = async () => {
    try {
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          *,
          store_users!inner(name),
          stores!inner(name),
          shifts(start_time, end_time, shift_number)
        `)
        .order('created_at', { ascending: false })

      if (salesData) {
        const exportData = salesData.map(sale => ({
          Date: new Date(sale.created_at).toLocaleDateString(),
          Time: new Date(sale.created_at).toLocaleTimeString(),
          Store: sale.stores.name,
          Worker: sale.store_users.name,
          Shift: sale.shifts?.shift_number || 'N/A',
          Product: sale.product,
          Quantity: sale.quantity,
          Price: sale.price,
          Total: sale.total,
          PaymentType: sale.payment_type,
          ShiftStart: sale.shifts?.start_time ? 
            new Date(sale.shifts.start_time).toLocaleString() : 'N/A'
        }))

        exportToCSV(exportData, 'multi-store-sales-report')
      }
    } catch (error) {
      alert('Failed to export sales data')
    }
  }

  const handleExportShifts = async () => {
    try {
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select(`
          *,
          store_users!inner(name),
          stores!inner(name),
          sales(total)
        `)
        .order('start_time', { ascending: false })

      if (shiftsData) {
        const exportData = shiftsData.map(shift => {
          const shiftTotal = shift.sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0)
          const duration = shift.end_time ? 
            Math.round((new Date(shift.end_time) - new Date(shift.start_time)) / (1000 * 60)) : 
            'Ongoing'

          return {
            Store: shift.stores.name,
            Worker: shift.store_users.name,
            ShiftNumber: shift.shift_number,
            StartTime: new Date(shift.start_time).toLocaleString(),
            EndTime: shift.end_time ? 
              new Date(shift.end_time).toLocaleString() : 'Ongoing',
            Duration: typeof duration === 'number' ? `${duration} minutes` : duration,
            SalesCount: shift.sales.length,
            TotalSales: shiftTotal,
            Date: new Date(shift.start_time).toLocaleDateString()
          }
        })

        exportToCSV(exportData, 'multi-store-shifts-report')
      }
    } catch (error) {
      alert('Failed to export shifts data')
    }
  }

  const handleExportDailyReports = async () => {
    try {
      const { data: dailyReports } = await supabase
        .from('daily_reports')
        .select(`
          *,
          stores!inner(name),
          shift1_worker:store_users!daily_reports_shift1_worker_id_fkey(name),
          shift2_worker:store_users!daily_reports_shift2_worker_id_fkey(name)
        `)
        .order('report_date', { ascending: false })

      if (dailyReports) {
        const exportData = dailyReports.map(report => ({
          Date: new Date(report.report_date).toLocaleDateString(),
          Store: report.stores.name,
          Shift1Worker: report.shift1_worker?.name || 'N/A',
          Shift1Sales: report.shift1_total_sales,
          Shift1Transactions: report.shift1_transaction_count,
          Shift2Worker: report.shift2_worker?.name || 'N/A',
          Shift2Sales: report.shift2_total_sales,
          Shift2Transactions: report.shift2_transaction_count,
          DayTotal: report.daily_total,
          TotalTransactions: report.shift1_transaction_count + report.shift2_transaction_count
        }))

        exportToCSV(exportData, 'daily-reports')
      }
    } catch (error) {
      alert('Failed to export daily reports')
    }
  }

  const quickActions = [
    {
      label: 'Export Sales Report',
      icon: FileText,
      action: handleExportSales,
      color: 'primary'
    },
    {
      label: 'Export Shifts Report', 
      icon: Calendar,
      action: handleExportShifts,
      color: 'secondary'
    },
    {
      label: 'Export Daily Reports', 
      icon: BarChart3,
      action: handleExportDailyReports,
      color: 'success'
    }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Multi-Store Overview */}
            <div className="fade-in">
              <MultiStoreSummary />
            </div>
          </div>
        )
      case 'analytics':
        return (
          <div className="space-y-8">
            
            {/* Team Performance */}
            <div className="fade-in">
              <WorkerTable onWorkerClick={setSelectedWorker} />
            </div>
          </div>
        )
      case 'users':
        return (
          <div className="fade-in">
            <UserManagement />
          </div>
        )
      case 'reports':
        return (
          <div className="fade-in">
            <HistoricalReports />
          </div>
        )
      case 'transactions':
        return (
          <div className="fade-in">
            <WorkerTransactionsAnalytics />
          </div>
        )
      case 'inventory':
        return (
          <div className="fade-in">
            <InventoryManager />
          </div>
        )
      case 'products':
        return (
          <div className="fade-in">
            <ProductCatalog />
          </div>
        )
      case 'fd':
        return (
          <div className="fade-in">
            <FDManagement />
          </div>
        )
      case 'notifications':
        return (
          <div className="fade-in">
            <NotificationSettings />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="admin-dashboard">
      {/* Enhanced Header with Professional Design */}
      <div className="admin-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            {/* Brand & Welcome Section */}
            <div className="admin-brand-section">
              <div className="admin-brand-icon">
                <div className="admin-brand-icon-bg"></div>
                <div className="admin-brand-icon-main">
                  <Crown className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="admin-title" style={{ color: 'var(--text-primary)' }}>
                  Admin Dashboard
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Crown className="h-3 w-3" style={{ color: 'var(--accent-warning)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Welcome back, {user.name} • {user.selectedStoreName || 'All Stores'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Header Actions - Right Side */}
            <div className="flex items-center space-x-3">
              {/* Quick Actions - Hidden on Small Screens */}
              <div className="hidden lg:flex items-center space-x-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.action}
                    variant={action.color === 'primary' ? 'primary' : 'secondary'}
                    size="sm"
                    className="admin-btn hover-lift click-scale focus-ring flex items-center space-x-2"
                  >
                    <action.icon className="h-3 w-3" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>

              {/* Essential Actions - Always Visible */}
              <div className="flex items-center space-x-2">
                {/* Notifications */}
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 rounded-lg transition-colors focus:outline-none focus:ring-2"
                  style={{
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--text-primary)'
                    e.target.style.backgroundColor = 'var(--bg-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--text-secondary)'
                    e.target.style.backgroundColor = 'transparent'
                  }}
                >
                  <Bell className="h-5 w-5" />
                  {/* Notification badge - you can add unread count logic here */}
                  <span className="absolute -top-1 -right-1 h-4 w-4 text-white text-xs rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-cherry)' }}>
                    3
                  </span>
                </button>

                {/* Logout Button */}
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="admin-btn hover-lift focus-ring flex items-center space-x-1 lg:space-x-2"
                  style={{
                    color: 'var(--accent-cherry)',
                    borderColor: 'var(--border-primary)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-error)'
                    e.target.style.borderColor = 'var(--accent-cherry)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent'
                    e.target.style.borderColor = 'var(--border-primary)'
                  }}
                >
                  <LogOut className="h-3 w-3" />
                  <span className="hidden sm:inline text-sm">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation Tabs */}
          <div className="admin-nav-tabs">
            <div className="admin-nav-container custom-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`admin-nav-tab ${activeTab === tab.id ? 'active' : ''} focus-ring`}
                >
                  <tab.icon className="admin-nav-tab-icon" />
                  <div className="admin-nav-tab-content">
                    <div className="admin-nav-tab-label">{tab.label}</div>
                    <div className="admin-nav-tab-description">{tab.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Area */}
      <div className="admin-content">
        <div className="admin-content-wrapper">
          <div className="admin-content-bg"></div>
          <div className="admin-content-inner p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Enhanced Worker Detail Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div 
              className="fixed inset-0 backdrop-blur-sm transition-opacity"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              onClick={() => setSelectedWorker(null)}
            />
            <div className="relative transform overflow-hidden rounded-2xl shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-primary)' }}>
              {/* Modal Header */}
              <div className="px-6 py-6" style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-secondary)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {selectedWorker.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedWorker.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Worker Performance Overview</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedWorker(null)}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                      color: 'var(--text-muted)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--text-primary)'
                      e.target.style.backgroundColor = 'var(--bg-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--text-muted)'
                      e.target.style.backgroundColor = 'transparent'
                    }}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="px-6 py-6">
                {/* Status Badge */}
                <div className="flex justify-center mb-6">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedWorker.isOnShift 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      selectedWorker.isOnShift ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    {selectedWorker.isOnShift ? 'Currently On Shift' : 'Off Shift'}
                  </span>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Sales</p>
                        <p className="text-2xl font-bold text-blue-900">{selectedWorker.totalSales}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-900">{selectedWorker.totalRevenue.toFixed(3)} TND</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Average Sale</p>
                        <p className="text-2xl font-bold text-purple-900">{selectedWorker.avgSaleValue.toFixed(3)} TND</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-amber-600 font-medium">Performance</p>
                        <p className="text-2xl font-bold text-amber-900">
                          {selectedWorker.totalSales > 10 ? 'Excellent' : 
                           selectedWorker.totalSales > 5 ? 'Good' : 'Learning'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setSelectedWorker(null)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      // Add view detailed report functionality here
                    }}
                    variant="primary"
                    className="flex-1"
                  >
                    View Full Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Popup */}
      <NotificationsPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  )
}
