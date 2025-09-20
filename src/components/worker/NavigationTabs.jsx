import React from 'react'
import { Package, CreditCard } from 'lucide-react'

const NavigationTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="worker-card">
      <div className="worker-card-header">
        <h3 style={{ color: 'var(--text-secondary)' }} className="text-xs sm:text-sm font-bold uppercase tracking-wide">Dashboard Sections</h3>
      </div>
      <div className="worker-card-content">
        <div className="nav-tabs-container">
          <div className="nav-tabs">
            <button
              onClick={() => onTabChange('sales')}
              style={{
                background: activeTab === 'sales' 
                  ? 'var(--gradient-vapor)' 
                  : 'var(--bg-elevated)',
                color: activeTab === 'sales' 
                  ? 'white' 
                  : 'var(--text-primary)',
                borderColor: activeTab === 'sales' 
                  ? 'transparent' 
                  : 'var(--border-primary)',
                boxShadow: activeTab === 'sales' 
                  ? 'var(--shadow-glow)' 
                  : 'var(--shadow-sm)'
              }}
              className="nav-tab border-2 transition-all duration-300 hover:scale-105"
              onMouseEnter={(e) => {
                if (activeTab !== 'sales') {
                  e.target.style.borderColor = 'var(--accent-vapor)'
                  e.target.style.boxShadow = 'var(--shadow-glow)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'sales') {
                  e.target.style.borderColor = 'var(--border-primary)'
                  e.target.style.boxShadow = 'var(--shadow-sm)'
                }
              }}
            >
              <div style={{
                background: activeTab === 'sales' 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(0, 212, 255, 0.1)'
              }} className="p-1.5 sm:p-2 rounded-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-sm sm:text-base">Sales & Shifts</span>
            </button>
            <button
              onClick={() => onTabChange('transactions')}
              style={{
                background: activeTab === 'transactions' 
                  ? 'var(--gradient-neon)' 
                  : 'var(--bg-elevated)',
                color: activeTab === 'transactions' 
                  ? 'white' 
                  : 'var(--text-primary)',
                borderColor: activeTab === 'transactions' 
                  ? 'transparent' 
                  : 'var(--border-primary)',
                boxShadow: activeTab === 'transactions' 
                  ? 'var(--shadow-glow-neon)' 
                  : 'var(--shadow-sm)'
              }}
              className="nav-tab border-2 transition-all duration-300 hover:scale-105"
              onMouseEnter={(e) => {
                if (activeTab !== 'transactions') {
                  e.target.style.borderColor = 'var(--accent-neon)'
                  e.target.style.boxShadow = 'var(--shadow-glow-neon)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'transactions') {
                  e.target.style.borderColor = 'var(--border-primary)'
                  e.target.style.boxShadow = 'var(--shadow-sm)'
                }
              }}
            >
              <div style={{
                background: activeTab === 'transactions' 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(16, 185, 129, 0.1)'
              }} className="p-1.5 sm:p-2 rounded-lg">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-sm sm:text-base">My Transactions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NavigationTabs
