import React from 'react'
import { Modal, Button } from '../ui'
import { formatCurrency } from '../../lib/utils'
import { Package, X, RefreshCw, AlertCircle, BarChart3, Store, AlertTriangle } from 'lucide-react'

const StockModal = ({
  stockModal,
  onClose,
  onRefresh,
  getCategoryDotColor
}) => {
  const { open, product, inventory, loading, error } = stockModal

  if (!product) return null

  // Helper function to get stock display info based on product category
  const getStockInfo = (item, product) => {
    const { category } = product
    
    // For liquid products (fruities, gourmands), show ml
    if (category === 'fruities' || category === 'gourmands') {
      const currentStock = item.stock_ml || 0
      const threshold = item.low_stock_threshold_ml || 0
      const isLowStock = currentStock <= threshold && threshold > 0
      return {
        value: currentStock,
        unit: 'ml',
        isLowStock,
        display: `${currentStock.toFixed(1)} ml`,
        threshold: threshold
      }
    }
    
    // For solid products (puffs, coils, mesh), show quantity
    const currentStock = item.stock_quantity || 0
    const threshold = item.low_stock_threshold_quantity || 0
    const isLowStock = currentStock <= threshold && threshold > 0
    return {
      value: currentStock,
      unit: 'pcs',
      isLowStock,
      display: `${currentStock} pcs`,
      threshold: threshold
    }
  }

  const getTotalStock = () => {
    if (!inventory.length) return 0
    
    // Sum based on product category
    if (product.category === 'fruities' || product.category === 'gourmands') {
      return inventory.reduce((total, item) => total + (item.stock_ml || 0), 0)
    }
    return inventory.reduce((total, item) => total + (item.stock_quantity || 0), 0)
  }

  const getStockStatus = (stockInfo) => {
    if (stockInfo.value === 0) return { status: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle }
    if (stockInfo.isLowStock) return { status: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle }
    return { status: 'In Stock', color: 'text-green-600', bg: 'bg-green-50', icon: Package }
  }

  return (
    <Modal isOpen={open} onClose={onClose} size="lg" zIndex={100500}>
      <div className="rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden relative" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-2xl)', border: '2px solid var(--border-primary)' }}>
        {/* Top accent border */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '4px', 
          background: 'linear-gradient(90deg, var(--accent-vapor), var(--accent-purple))' 
        }}></div>
        
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg transition-all duration-200"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-primary)'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--text-primary)'
              e.target.style.background = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--text-muted)'
              e.target.style.background = 'var(--bg-elevated)'
            }}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-200"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-primary)'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--text-primary)'
              e.target.style.background = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--text-muted)'
              e.target.style.background = 'var(--bg-elevated)'
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-12 overflow-y-auto max-h-[calc(90vh-60px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--accent-vapor)' }}></div>
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Loading stock information...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl p-6 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-error)', border: '1px solid var(--accent-cherry)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-cherry)' }}></div>
              <div className="flex items-center space-x-3 mb-3">
                <AlertCircle className="h-6 w-6" style={{ color: 'var(--accent-cherry)' }} />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--accent-cherry)' }}>Error Loading Stock</h3>
              </div>
              <p className="mb-4" style={{ color: 'var(--accent-cherry)' }}>{error}</p>
              <Button
                onClick={onRefresh}
                variant="outline"
                style={{ 
                  color: 'var(--accent-cherry)', 
                  borderColor: 'var(--accent-cherry)',
                  backgroundColor: 'transparent'
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-vapor), #60A5FA)' }}></div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-vapor), #60A5FA)' }}>
                      <Package className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {getTotalStock().toFixed(product.category === 'fruities' || product.category === 'gourmands' ? 1 : 0)} {product.category === 'fruities' || product.category === 'gourmands' ? 'ml' : 'pcs'}
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Stock</div>
                </div>

                <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-success), #34D399)' }}></div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-success), #34D399)' }}>
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(product.price || 0)}
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Product Price</div>
                </div>

                <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-purple), #A78BFA)' }}></div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-purple), #A78BFA)' }}>
                      <Store className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {inventory.length}
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Stores</div>
                </div>
              </div>

              {/* Stock by Store */}
              {inventory.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Stock by Store</h3>
                  <div className="space-y-3">
                    {inventory.map((item, index) => {
                      const stockInfo = getStockInfo(item, product)
                      const statusInfo = getStockStatus(stockInfo)
                      const StatusIcon = statusInfo.icon
                      
                      return (
                        <div key={index} className="rounded-xl p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-warning), #FBBF24)' }}></div>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Store className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                                <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {item.store_name || 'Unknown Store'}
                                </h4>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Current Stock</p>
                                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {stockInfo.display}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Low Stock Threshold</p>
                                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    {stockInfo.threshold > 0 ? `${stockInfo.threshold} ${stockInfo.unit}` : 'Not set'}
                                  </p>
                                </div>
                              </div>

                              {product.category === 'fruities' || product.category === 'gourmands' ? (
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  Liquid product - Stock measured in milliliters (ml)
                                </div>
                              ) : (
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  Solid product - Stock measured in pieces (pcs)
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <div 
                                className="px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1"
                                style={{
                                  backgroundColor: stockInfo.value === 0 ? 'var(--bg-error)' : stockInfo.isLowStock ? 'var(--bg-warning)' : 'var(--bg-success)',
                                  color: stockInfo.value === 0 ? 'var(--accent-cherry)' : stockInfo.isLowStock ? 'var(--accent-warning)' : 'var(--accent-success)',
                                  borderColor: stockInfo.value === 0 ? 'var(--accent-cherry)' : stockInfo.isLowStock ? 'var(--accent-warning)' : 'var(--accent-success)'
                                }}
                              >
                                <StatusIcon className="h-3 w-3" />
                                <span>{statusInfo.status}</span>
                              </div>
                              {stockInfo.isLowStock && (
                                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--accent-warning)' }}>
                                  ⚠️ Below threshold
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Stock Information</h3>
                  <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                    This product doesn't have any stock records in our system yet.
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Stock information will appear here once inventory is added through the inventory management system.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </Modal>
  )
}

export default StockModal
