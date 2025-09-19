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
    <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-blue-800">Detailed Store Breakdown</h3>
        </div>
        <div className="text-base text-blue-600 font-medium">
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
            <span className="text-sm font-medium text-gray-600">Total Transactions</span>
          </div>
          <div className="text-xl font-bold text-blue-700">
            {breakdown.total_transactions || 0}
          </div>
        </div>
        {!isMobile && (
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="flex items-center space-x-2 mb-1">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Active Stores</span>
            </div>
            <div className="text-xl font-bold text-purple-700">
              {breakdown.stores ? breakdown.stores.length : 0}
            </div>
          </div>
        )}
      </div>

      {/* Store Details */}
      {breakdown.stores && breakdown.stores.length > 0 ? (
        <div className="space-y-6">
          {breakdown.stores.map((store, storeIndex) => (
            <div key={store.store_id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              {/* Store Header */}
              <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-start'} mb-4`}>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h4 className="font-bold text-xl text-gray-800">{store.store_name}</h4>
                  </div>
                  <p className="text-gray-600 flex items-center space-x-1">
                    <span>📍</span>
                    <span>{store.store_location}</span>
                  </p>
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
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No products sold at this store today</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No sales recorded for this date</p>
        </div>
      )}
    </div>
  )

  const renderMonthlyBreakdown = () => (
    <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
          <h3 className="text-xl font-bold text-indigo-800">Detailed Monthly Breakdown</h3>
        </div>
        <div className="text-base text-indigo-600 font-medium">
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
  <div className={`bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'} border border-gray-200`}>
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <h6 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-800 mb-1`}>
          {product.product_name}
        </h6>
        <div className="flex items-center space-x-2 mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.category === 'fruities' ? 'bg-green-100 text-green-800' :
            product.category === 'gourmands' ? 'bg-purple-100 text-purple-800' :
            product.category === 'puffs' ? 'bg-blue-100 text-blue-800' :
            product.category === 'coils' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {product.category}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-green-700`}>
          {formatCurrency(product.total_sales || 0)}
        </div>
      </div>
    </div>
    
    <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-3 gap-3'} text-sm mb-3`}>
      <div className="flex items-center space-x-1">
        <Users className="h-3 w-3 text-gray-500" />
        <span className="text-gray-600">Sales:</span>
        <span className="font-semibold">{product.transaction_count || 0}</span>
      </div>
      {product.total_quantity > 0 && (
        <div className="flex items-center space-x-1">
          <Package className="h-3 w-3 text-gray-500" />
          <span className="text-gray-600">Qty:</span>
          <span className="font-semibold">{product.total_quantity}</span>
        </div>
      )}
      {product.total_ml > 0 && (
        <div className="flex items-center space-x-1">
          <Package className="h-3 w-3 text-gray-500" />
          <span className="text-gray-600">ML:</span>
          <span className="font-semibold">{product.total_ml}</span>
        </div>
      )}
      {!isMobile && (
        <div className="flex items-center space-x-1">
          <DollarSign className="h-3 w-3 text-gray-500" />
          <span className="text-gray-600">Avg:</span>
          <span className="font-semibold">{formatCurrency(product.average_price || 0)}</span>
        </div>
      )}
    </div>

    {/* Individual Sales for this product */}
    {showSalesDetails && product.sales_details && product.sales_details.length > 0 && (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600 mb-2 font-medium">Individual Sales:</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {product.sales_details.map((sale, saleIndex) => (
            <div key={sale.id || saleIndex} className="flex justify-between items-center text-xs bg-white rounded p-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{sale.time}</span>
                <span className="text-gray-500">by {sale.worker_name}</span>
                {sale.quantity && <span className="text-blue-600">×{sale.quantity}</span>}
                {sale.ml_amount && <span className="text-blue-600">{sale.ml_amount}ml</span>}
              </div>
              <span className="font-semibold text-green-600">
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
