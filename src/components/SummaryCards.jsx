import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card } from './ui'
import { formatCurrency } from '../lib/utils'
import { DollarSign, TrendingUp, Users, Clock, Package, Activity, Shield, BarChart3 } from 'lucide-react'
import './SummaryCards.css'

export default function SummaryCards() {
  const [stats, setStats] = useState({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    // Database statistics
    totalUsers: 0,
    adminUsers: 0,
    workerUsers: 0,
    totalProducts: 0,
    totalShifts: 0,
    totalSales: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay())).toISOString()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

      // Today's sales
      const { data: todaySales } = await supabase
        .from('sales')
        .select('price')
        .gte('created_at', todayStart)

      // This week's sales
      const { data: weekSales } = await supabase
        .from('sales')
        .select('price')
        .gte('created_at', weekStart)

      // This month's sales
      const { data: monthSales } = await supabase
        .from('sales')
        .select('price')
        .gte('created_at', monthStart)

      // Calculate totals
      const todayTotal = todaySales?.reduce((sum, sale) => sum + parseFloat(sale.price), 0) || 0
      const weekTotal = weekSales?.reduce((sum, sale) => sum + parseFloat(sale.price), 0) || 0
      const monthTotal = monthSales?.reduce((sum, sale) => sum + parseFloat(sale.price), 0) || 0

      // Database Statistics - Basic Statistics like in schema
      const { data: usersData } = await supabase
        .from('store_users')
        .select('role')
      
      const { data: productsData } = await supabase
        .from('products')
        .select('id')
      
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('id')
      
      const { data: allSalesData } = await supabase
        .from('sales')
        .select('id')

      // Calculate database stats
      const totalUsers = usersData?.length || 0
      const adminUsers = usersData?.filter(u => u.role === 'admin').length || 0
      const workerUsers = usersData?.filter(u => u.role === 'worker').length || 0
      const totalProducts = productsData?.length || 0
      const totalShifts = shiftsData?.length || 0
      const totalSales = allSalesData?.length || 0

      setStats({
        todayTotal,
        weekTotal,
        monthTotal,
        totalUsers,
        adminUsers,
        workerUsers,
        totalProducts,
        totalShifts,
        totalSales
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
    setLoading(false)
  }

  const cards = [
    {
      title: "Today's Sales",
      value: formatCurrency(stats.todayTotal),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: "This Week",
      value: formatCurrency(stats.weekTotal),
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: "This Month",
      value: formatCurrency(stats.monthTotal),
      icon: Clock,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      change: '+15%',
      changeType: 'positive'
    },
    // Database Statistics Cards
    {
      title: "Total Team Members",
      value: stats.totalUsers.toString(),
      subtitle: `${stats.adminUsers} Admins • ${stats.workerUsers} Workers`,
      icon: Users,
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-200',
      change: `Active Team`,
      changeType: 'neutral'
    },
    {
      title: "Product Catalog",
      value: stats.totalProducts.toString(),
      subtitle: 'Items available for sale',
      icon: Package,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      change: 'In Stock',
      changeType: 'positive'
    },
    {
      title: "Total Shifts",
      value: stats.totalShifts.toString(),
      subtitle: 'All-time work sessions',
      icon: Activity,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      change: 'Completed',
      changeType: 'neutral'
    },
    {
      title: "Total Sales Records",
      value: stats.totalSales.toString(),
      subtitle: 'All-time transaction count',
      icon: BarChart3,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200',
      change: 'Transactions',
      changeType: 'positive'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div 
            key={i} 
            className="stats-card animate-pulse rounded-2xl p-6"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)'
            }}
          >
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-2xl"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              ></div>
              <div className="flex-1">
                <div 
                  className="h-4 rounded mb-2"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                ></div>
                <div 
                  className="h-6 rounded"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)'
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = 'var(--shadow-2xl)'
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = 'var(--shadow-lg)'
          }}
        >
          {/* Background Pattern */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, transparent 100%)'
            }}
          ></div>
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16"
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, transparent 100%)'
            }}
          ></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{
                  background: `linear-gradient(135deg, ${card.gradient.includes('emerald') ? 'var(--accent-success)' : 
                    card.gradient.includes('blue') ? 'var(--accent-vapor)' :
                    card.gradient.includes('purple') ? 'var(--accent-purple)' :
                    card.gradient.includes('indigo') ? 'var(--accent-vapor)' :
                    card.gradient.includes('green') ? 'var(--accent-success)' :
                    card.gradient.includes('orange') ? 'var(--accent-warning)' :
                    'var(--accent-vapor)'} 0%, ${card.gradient.includes('emerald') ? '#059669' : 
                    card.gradient.includes('blue') ? '#0ea5e9' :
                    card.gradient.includes('purple') ? '#ec4899' :
                    card.gradient.includes('indigo') ? 'var(--accent-purple)' :
                    card.gradient.includes('green') ? '#059669' :
                    card.gradient.includes('orange') ? '#ea580c' :
                    'var(--accent-purple)'} 100%)`
                }}
              >
                <card.icon className="h-6 w-6 text-white" />
              </div>
              
              {card.change && (
                <div 
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: card.changeType === 'positive' ? 'var(--bg-success)' : 
                      card.changeType === 'negative' ? 'var(--bg-error)' : 
                      'var(--bg-elevated)',
                    color: card.changeType === 'positive' ? 'var(--accent-success)' : 
                      card.changeType === 'negative' ? 'var(--accent-cherry)' : 
                      'var(--text-secondary)'
                  }}
                >
                  {card.change}
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{card.title}</p>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
              {card.subtitle && (
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{card.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
