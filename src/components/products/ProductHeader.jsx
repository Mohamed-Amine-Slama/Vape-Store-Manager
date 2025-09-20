import React from 'react'
import { Button, AddButton } from '../ui'
import { Package, Plus, RefreshCw } from 'lucide-react'

const ProductHeader = ({
  selectedCategory,
  setSelectedCategory,
  categories,
  categoryStats,
  filteredProducts,
  onAddProduct,
  onRefresh,
  loading,
  isMobile
}) => {
  return (
    <div className="rounded-xl p-6 mb-6 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-primary)' }}>
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
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'} mb-6`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-vapor), var(--accent-purple))' }}>
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Product Catalog</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Manage your product inventory and categories
            </p>
          </div>
        </div>
        
        <div className={`flex ${isMobile ? 'items-center space-x-4 w-full' : 'items-center space-x-3'}`}>
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className={`flex items-center space-x-2 ${isMobile ? 'flex-1' : ''}`}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <AddButton
            onClick={onAddProduct}
            size={isMobile ? "md" : "md"}
            icon={<Plus />}
            className={isMobile ? 'flex-1' : ''}
          >
            Add Product
          </AddButton>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`} style={{ color: 'var(--text-primary)' }}>
            Filter by Category
          </h3>
          {isMobile && (
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {filteredProducts?.length || 0} products
            </span>
          )}
        </div>
        
        {/* Mobile: Scrollable horizontal tabs */}
        {isMobile ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-6 min-w-max px-4 py-3">
              {/* All Categories - Mobile */}
              <button
                onClick={() => setSelectedCategory('all')}
                className={`
                  flex items-center space-x-3 px-6 py-4 rounded-2xl font-medium transition-all duration-200 whitespace-nowrap shadow-md hover:shadow-lg transform hover:scale-105
                  ${selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-teal-200 scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-teal-300 hover:shadow-teal-100'
                  }
                `}
                style={{
                  backdropFilter: 'blur(10px)',
                  boxShadow: selectedCategory === 'all' 
                    ? '0 6px 20px rgba(15, 118, 110, 0.3), 0 2px 8px rgba(15, 118, 110, 0.2)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className={`p-2 rounded-2xl ${selectedCategory === 'all' ? 'bg-white bg-opacity-25 shadow-inner' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                  <Package className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold">All</span>
                <span className={`
                  px-3 py-1.5 text-xs rounded-full font-semibold min-w-[28px] text-center
                  ${selectedCategory === 'all' 
                    ? 'bg-white text-teal-700' 
                    : 'bg-teal-100 text-teal-700'
                  }
                `}>
                  {categoryStats.reduce((sum, cat) => sum + cat.count, 0)}
                </span>
              </button>

              {/* Individual Categories - Mobile */}
              {categories.map((category) => {
                const stats = categoryStats.find(s => s.value === category.value)
                const count = stats?.count || 0
                const isSelected = selectedCategory === category.value
                
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`
                      flex items-center space-x-3 px-6 py-4 rounded-2xl font-medium transition-all duration-200 whitespace-nowrap shadow-md hover:shadow-lg transform hover:scale-105
                      ${isSelected
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-teal-200 scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-teal-300 hover:shadow-teal-100'
                      }
                    `}
                    style={{
                      backdropFilter: 'blur(10px)',
                      boxShadow: isSelected 
                        ? '0 6px 20px rgba(15, 118, 110, 0.3), 0 2px 8px rgba(15, 118, 110, 0.2)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div 
                      className={`w-5 h-5 rounded-full border-2 shadow-md ${isSelected ? 'border-white' : 'border-gray-300'}`}
                      style={{ 
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : getCategoryColor(category.value),
                        boxShadow: isSelected 
                          ? `inset 0 0 0 2px ${getCategoryColor(category.value)}, 0 2px 8px rgba(0,0,0,0.2)` 
                          : `0 2px 8px ${getCategoryColor(category.value)}60`
                      }}
                    />
                    <span className="text-sm font-bold">{category.label}</span>
                    <span className={`
                      px-3 py-1.5 text-xs rounded-full font-semibold min-w-[28px] text-center
                      ${isSelected 
                        ? 'bg-white text-teal-700' 
                        : 'bg-teal-100 text-teal-700'
                      }
                    `}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Desktop: Wrapped grid layout */
          <div className="flex flex-wrap gap-6 p-4">
            {/* All Categories - Desktop */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={`
                flex items-center space-x-4 px-8 py-5 rounded-2xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl transform
                ${selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-teal-200 scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-teal-300 hover:shadow-teal-200'
                }
              `}
              style={{
                backdropFilter: 'blur(10px)',
                boxShadow: selectedCategory === 'all' 
                  ? '0 8px 25px rgba(15, 118, 110, 0.4), 0 4px 12px rgba(15, 118, 110, 0.3)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className={`p-3 rounded-2xl shadow-inner ${selectedCategory === 'all' ? 'bg-white bg-opacity-25' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                <Package className="h-6 w-6" />
              </div>
              <span className="text-base">All Products</span>
              <span className={`
                px-4 py-2 text-sm rounded-full font-semibold min-w-[36px] text-center
                ${selectedCategory === 'all' 
                  ? 'bg-white text-teal-700' 
                  : 'bg-teal-100 text-teal-700'
                }
              `}>
                {categoryStats.reduce((sum, cat) => sum + cat.count, 0)}
              </span>
            </button>

            {/* Individual Categories - Desktop */}
            {categories.map((category) => {
              const stats = categoryStats.find(s => s.value === category.value)
              const count = stats?.count || 0
              const isSelected = selectedCategory === category.value
              
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`
                    flex items-center space-x-4 px-8 py-5 rounded-2xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl transform
                    ${isSelected
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-teal-200 scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-teal-300 hover:shadow-teal-200'
                    }
                  `}
                  style={{
                    backdropFilter: 'blur(10px)',
                    boxShadow: isSelected 
                      ? '0 8px 25px rgba(15, 118, 110, 0.4), 0 4px 12px rgba(15, 118, 110, 0.3)' 
                      : '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div 
                    className={`w-6 h-6 rounded-full border-2 shadow-lg ${isSelected ? 'border-white' : 'border-gray-300'}`}
                    style={{ 
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : getCategoryColor(category.value),
                      boxShadow: isSelected 
                        ? `inset 0 0 0 2px ${getCategoryColor(category.value)}, 0 4px 16px rgba(0,0,0,0.2)` 
                        : `0 4px 16px ${getCategoryColor(category.value)}60`
                    }}
                  />
                  <span className="text-base">{category.label}</span>
                  <span className={`
                    px-4 py-2 text-sm rounded-full font-semibold min-w-[36px] text-center
                    ${isSelected 
                      ? 'bg-white text-teal-700' 
                      : 'bg-teal-100 text-teal-700'
                    }
                  `}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Category Summary */}
      {!isMobile && (
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-secondary)' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoryStats.map((category) => (
              <div 
                key={category.value}
                className="rounded-lg p-3 text-center transition-colors cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-hover)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-elevated)'
                }}
                onClick={() => setSelectedCategory(category.value)}
              >
                <div 
                  className="w-4 h-4 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: getCategoryColor(category.value) }}
                />
                <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{category.label}</div>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{category.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to get category colors
const getCategoryColor = (category) => {
  const colors = {
    fruities: '#ec4899',
    gourmands: '#f59e0b',
    puffs: '#a855f7',
    coils: '#3b82f6',
    mesh: '#10b981'
  }
  return colors[category] || '#6b7280'
}

export default ProductHeader
