import React from 'react'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { 
  DollarSign, 
  Users, 
  Package, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  ShoppingCart,
  Clock
} from 'lucide-react'

const DetailedBreakdown = ({ 
  breakdown, 
  type = 'daily', // 'daily' or 'monthly'
  isMobile 
}) => {
  if (!breakdown) return null

  const renderDailyBreakdown = () => (
    <div 
      className="mt-6 rounded-xl p-6 border transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-primary)',
        boxShadow: 'var(--shadow-lg)',
        borderTop: '4px solid var(--accent-vapor)'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <h3 
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Detailed Store Breakdown
          </h3>
        </div>
        <div 
          className="text-base font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {new Date(breakdown.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Overall Summary */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-4'} mb-6`}>
        <div 
          className="rounded-lg p-4 border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-sm)',
            borderTop: '3px solid var(--accent-success)'
          }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign 
              className="h-4 w-4" 
              style={{ color: 'var(--accent-success)' }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Total Revenue
            </span>
          </div>
          <div 
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatCurrency(breakdown.total_revenue || 0)}
          </div>
        </div>
        <div 
          className="rounded-lg p-4 border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-sm)',
            borderTop: '3px solid var(--accent-vapor)'
          }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Users 
              className="h-4 w-4" 
              style={{ color: 'var(--accent-vapor)' }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Total Transactions
            </span>
          </div>
          <div 
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {breakdown.total_transactions || 0}
          </div>
        </div>
        {!isMobile && (
          <div 
            className="rounded-lg p-4 border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-primary)',
              boxShadow: 'var(--shadow-sm)',
              borderTop: '3px solid var(--accent-purple)'
            }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 
                className="h-4 w-4" 
                style={{ color: 'var(--accent-purple)' }}
              />
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Active Stores
              </span>
            </div>
            <div 
              className="text-xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {breakdown.stores ? breakdown.stores.length : 0}
            </div>
          </div>
        )}
      </div>

      {/* Store Details */}
      {breakdown.stores && breakdown.stores.length > 0 ? (
        <div className="space-y-6">
          {breakdown.stores.map((store, storeIndex) => (
            <div 
              key={store.store_id} 
              className="rounded-xl p-6 border transition-all duration-300 hover:shadow-lg"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-sm)',
                borderTop: '3px solid var(--accent-warning)'
              }}
            >
              {/* Store Header */}
              <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-start'} mb-6`}>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, var(--accent-warning) 0%, #f59e0b 100%)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <h4 
                      className="font-bold text-xl"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {store.store_name}
                    </h4>
                  </div>
                  <p 
                    className="flex items-center space-x-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span>📍</span>
                    <span>{store.store_location}</span>
                  </p>
                </div>
                <div 
                  className={`${isMobile ? 'w-full' : 'text-right'} rounded-xl p-4 border`}
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-secondary)',
                    borderTop: '2px solid var(--accent-success)'
                  }}
                >
                  <div 
                    className="text-2xl font-bold mb-1"
                    style={{ color: 'var(--accent-success)' }}
                  >
                    {formatCurrency(store.total_revenue)}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {store.total_transactions} transactions
                  </div>
                </div>
              </div>

              {/* Products for this store */}
              {store.products && store.products.length > 0 ? (
                <div className="space-y-4">
                  <h5 
                    className="text-lg font-semibold mb-3 flex items-center space-x-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Package 
                      className="h-5 w-5" 
                      style={{ color: 'var(--accent-vapor)' }}
                    />
                    <span>Products Sold</span>
                  </h5>
                  <div className={`${isMobile ? 'space-y-3' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}`}>
                    {store.products.map((product, productIndex) => (
                      <ProductCard 
                        key={`${store.store_id}-${product.product_name}-${productIndex}`}
                        product={product}
                        isMobile={isMobile}
                        showSalesDetails={true}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package 
                    className="h-12 w-12 mx-auto mb-3" 
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    No products sold at this store today
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart 
            className="h-16 w-16 mx-auto mb-4" 
            style={{ color: 'var(--text-muted)' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>
            No sales recorded for this date
          </p>
        </div>
      )}
    </div>
  )

  const renderMonthlyBreakdown = () => (
    <div 
      className="mt-6 rounded-xl p-6 border transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-primary)',
        boxShadow: 'var(--shadow-lg)',
        borderTop: '4px solid var(--accent-purple)'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-vapor) 100%)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h3 
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Detailed Monthly Breakdown
          </h3>
        </div>
        <div 
          className="text-base font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {breakdown.month_name}
        </div>
      </div>

      {/* Overall Summary Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-4'} mb-6`}>
        <div className="bg-white rounded-lg p-3 border border-green-200">
          <div className="flex items-center space-x-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Total Revenue</span>
          </div>
          <div className="text-xl font-bold text-green-700">
            {formatCurrency(breakdown.total_revenue || 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Transactions</span>
          </div>
          <div className="text-xl font-bold text-blue-700">
            {breakdown.total_transactions || 0}
          </div>
        </div>
        {!isMobile && (
          <>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <div className="flex items-center space-x-2 mb-1">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Active Days</span>
              </div>
              <div className="text-xl font-bold text-purple-700">
                {breakdown.total_days_with_sales || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <div className="flex items-center space-x-2 mb-1">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Active Stores</span>
              </div>
              <div className="text-xl font-bold text-orange-700">
                {breakdown.stores ? breakdown.stores.length : 0}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Store Details */}
      {breakdown.stores && breakdown.stores.length > 0 ? (
        <div className="space-y-6">
          {breakdown.stores.map((store, storeIndex) => (
            <MonthlyStoreCard 
              key={store.store_id}
              store={store}
              isMobile={isMobile}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No sales data found for this month</p>
        </div>
      )}
    </div>
  )

  return type === 'daily' ? renderDailyBreakdown() : renderMonthlyBreakdown()
}

// Product Card Component
const ProductCard = ({ product, isMobile, showSalesDetails }) => (
  <div 
    className={`rounded-lg ${isMobile ? 'p-3' : 'p-4'} border transition-all duration-200 hover:shadow-md`}
    style={{
      background: 'var(--bg-elevated)',
      borderColor: 'var(--border-secondary)',
      borderTop: '2px solid var(--accent-purple)'
    }}
  >
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h6 
          className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold mb-2`}
          style={{ color: 'var(--text-primary)' }}
        >
          {product.product_name}
        </h6>
        <div className="flex items-center space-x-2 mb-2">
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              background: product.category === 'fruities' ? 'var(--bg-success)' :
                         product.category === 'gourmands' ? 'var(--bg-purple)' :
                         product.category === 'puffs' ? 'var(--bg-vapor)' :
                         product.category === 'coils' ? 'var(--bg-warning)' :
                         'var(--bg-elevated)',
              color: product.category === 'fruities' ? 'var(--accent-success)' :
                     product.category === 'gourmands' ? 'var(--accent-purple)' :
                     product.category === 'puffs' ? 'var(--accent-vapor)' :
                     product.category === 'coils' ? 'var(--accent-warning)' :
                     'var(--text-secondary)'
            }}
          >
            {product.category}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div 
          className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}
          style={{ color: 'var(--accent-success)' }}
        >
          {formatCurrency(product.total_sales || 0)}
        </div>
      </div>
    </div>
    
    <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-3 gap-3'} text-sm mb-3`}>
      <div className="flex items-center space-x-1">
        <Users 
          className="h-3 w-3" 
          style={{ color: 'var(--text-muted)' }}
        />
        <span style={{ color: 'var(--text-secondary)' }}>Sales:</span>
        <span 
          className="font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {product.transaction_count || 0}
        </span>
      </div>
      {product.total_quantity > 0 && (
        <div className="flex items-center space-x-1">
          <Package 
            className="h-3 w-3" 
            style={{ color: 'var(--text-muted)' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>Qty:</span>
          <span 
            className="font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {product.total_quantity}
          </span>
        </div>
      )}
      {product.total_ml > 0 && (
        <div className="flex items-center space-x-1">
          <Package 
            className="h-3 w-3" 
            style={{ color: 'var(--text-muted)' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>ML:</span>
          <span 
            className="font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {product.total_ml}
          </span>
        </div>
      )}
      {!isMobile && (
        <div className="flex items-center space-x-1">
          <DollarSign 
            className="h-3 w-3" 
            style={{ color: 'var(--text-muted)' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>Avg:</span>
          <span 
            className="font-semibold"
            style={{ color: 'var(--accent-success)' }}
          >
            {formatCurrency(product.average_price || 0)}
          </span>
        </div>
      )}
    </div>

    {/* Individual Sales for this product */}
    {showSalesDetails && product.sales_details && product.sales_details.length > 0 && (
      <div 
        className="mt-3 pt-3 border-t"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        <div 
          className="text-sm mb-2 font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          Individual Sales:
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {product.sales_details.map((sale, saleIndex) => (
            <div 
              key={sale.id || saleIndex} 
              className="flex justify-between items-center text-xs rounded p-2 border"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-secondary)'
              }}
            >
              <div className="flex items-center space-x-2">
                <span 
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {sale.time}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  by {sale.worker_name}
                </span>
                {sale.quantity && (
                  <span style={{ color: 'var(--accent-vapor)' }}>
                    ×{sale.quantity}
                  </span>
                )}
                {sale.ml_amount && (
                  <span style={{ color: 'var(--accent-vapor)' }}>
                    {sale.ml_amount}ml
                  </span>
                )}
              </div>
              <span 
                className="font-semibold"
                style={{ color: 'var(--accent-success)' }}
              >
                {formatCurrency(sale.price)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)

// Monthly Store Card Component
const MonthlyStoreCard = ({ store, isMobile }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
    {/* Store Header */}
    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-start'} mb-4`}>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h4 className="font-bold text-xl text-gray-800">{store.store_name}</h4>
        </div>
        <p className="text-gray-600 flex items-center space-x-1 mb-2">
          <span>📍</span>
          <span>{store.store_location}</span>
        </p>
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-3'} text-sm`}>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-blue-600" />
            <span className="text-gray-600">Active:</span>
            <span className="font-semibold">{store.days_active} days</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-gray-600">Avg Daily:</span>
            <span className="font-semibold">{formatCurrency(store.average_daily_revenue)}</span>
          </div>
          {!isMobile && store.best_day && (
            <>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 text-purple-600" />
                <span className="text-gray-600">Best Day:</span>
                <span className="font-semibold">
                  {new Date(store.best_day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3 text-orange-600" />
                <span className="text-gray-600">Best Revenue:</span>
                <span className="font-semibold">{formatCurrency(store.best_day_revenue)}</span>
              </div>
            </>
          )}
        </div>
      </div>
      <div className={`${isMobile ? 'bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 w-full' : 'text-right bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4'}`}>
        <div className="text-2xl font-bold text-green-700 mb-1">
          {formatCurrency(store.total_revenue)}
        </div>
        <div className="text-sm text-gray-600">
          {store.total_transactions} transactions
        </div>
      </div>
    </div>

    {/* Products for this store */}
    {store.products && store.products.length > 0 ? (
      <div className="space-y-3">
        <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
          <Package className="h-4 w-4 text-indigo-600" />
          <span>Top Products ({store.products.length} total)</span>
        </h5>
        <div className={`${isMobile ? 'space-y-3' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}`}>
          {store.products.slice(0, isMobile ? 3 : 6).map((product, productIndex) => (
            <ProductCard 
              key={`${store.store_id}-${product.product_id}-${productIndex}`}
              product={product}
              isMobile={isMobile}
              showSalesDetails={false}
            />
          ))}
        </div>
        {store.products.length > (isMobile ? 3 : 6) && (
          <div className="text-center mt-3 text-gray-500 text-sm">
            Showing top {isMobile ? 3 : 6} of {store.products.length} products for this store
          </div>
        )}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No products sold at this store this month</p>
      </div>
    )}
  </div>
)

export default DetailedBreakdown
