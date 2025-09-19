import React from 'react'
import { Package, CreditCard } from 'lucide-react'

const NavigationTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="worker-card">
      <div className="worker-card-header">
        <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide">Dashboard Sections</h3>
      </div>
      <div className="worker-card-content">
        <div className="nav-tabs-container">
          <div className="nav-tabs">
            <button
              onClick={() => onTabChange('sales')}
              className={`nav-tab ${
                activeTab === 'sales'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-2 border-transparent shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className={`p-1.5 sm:p-2 rounded-lg ${activeTab === 'sales' ? 'bg-white bg-opacity-20' : 'bg-blue-100'}`}>
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-sm sm:text-base">Sales & Shifts</span>
            </button>
            <button
              onClick={() => onTabChange('transactions')}
              className={`nav-tab ${
                activeTab === 'transactions'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-transparent shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className={`p-1.5 sm:p-2 rounded-lg ${activeTab === 'transactions' ? 'bg-white bg-opacity-20' : 'bg-green-100'}`}>
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
