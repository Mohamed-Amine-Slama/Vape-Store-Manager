import React from 'react'
import { Button, AddButton } from '../ui'
import { Package, Plus, RefreshCw, Search, X } from 'lucide-react'

const ProductHeader = ({
  selectedCategory,
  setSelectedCategory,
  categories,
  categoryStats,
  filteredProducts,
  onAddProduct,
  onRefresh,
  loading,
  isMobile,
  searchQuery,
  setSearchQuery
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

      {/* Search Filter */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          </div>
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            className={`
              block w-full pl-10 pr-10 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isMobile ? 'text-base' : 'text-sm'}
            `}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              focusRingColor: 'var(--accent-vapor)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-vapor)'
              e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-primary)'
              e.target.style.boxShadow = 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery && setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {filteredProducts?.length || 0} product{filteredProducts?.length !== 1 ? 's' : ''} found for "{searchQuery}"
          </div>
        )}
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
            <div className="flex space-x-4 min-w-max px-4 py-3">
              {/* All Categories - Mobile */}
              <button
                onClick={() => setSelectedCategory('all')}
                className="flex items-center space-x-3 px-5 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap border"
                style={{
                  background: selectedCategory === 'all' 
                    ? 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)'
                    : 'var(--bg-card)',
                  borderColor: selectedCategory === 'all' 
                    ? 'transparent'
                    : 'var(--border-primary)',
                  color: selectedCategory === 'all' ? 'white' : 'var(--text-primary)',
                  boxShadow: selectedCategory === 'all' 
                    ? 'var(--shadow-lg)' 
                    : 'var(--shadow-sm)',
                  transform: selectedCategory === 'all' ? 'translateY(-1px)' : 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== 'all') {
                    e.target.style.background = 'var(--bg-hover)'
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = 'var(--shadow-md)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== 'all') {
                    e.target.style.background = 'var(--bg-card)'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'var(--shadow-sm)'
                  }
                }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: selectedCategory === 'all' 
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'var(--bg-elevated)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Package className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">All</span>
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
                    className="flex items-center space-x-3 px-5 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap border"
                    style={{
                      background: isSelected 
                        ? 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)'
                        : 'var(--bg-card)',
                      borderColor: isSelected 
                        ? 'transparent'
                        : 'var(--border-primary)',
                      color: isSelected ? 'white' : 'var(--text-primary)',
                      boxShadow: isSelected 
                        ? 'var(--shadow-lg)' 
                        : 'var(--shadow-sm)',
                      transform: isSelected ? 'translateY(-1px)' : 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.background = 'var(--bg-hover)'
                        e.target.style.transform = 'translateY(-1px)'
                        e.target.style.boxShadow = 'var(--shadow-md)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.background = 'var(--bg-card)'
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = 'var(--shadow-sm)'
                      }
                    }}
                  >
                    <div 
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{
                        background: isSelected 
                          ? 'rgba(255, 255, 255, 0.2)'
                          : getCategoryColor(category.value) + '20',
                        border: `2px solid ${isSelected ? 'rgba(255, 255, 255, 0.3)' : getCategoryColor(category.value)}`,
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ 
                          backgroundColor: isSelected ? 'white' : getCategoryColor(category.value)
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{category.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Desktop: Wrapped grid layout */
          <div className="flex flex-wrap gap-4 p-4">
            {/* All Categories - Desktop */}
            <button
              onClick={() => setSelectedCategory('all')}
              className="flex items-center space-x-4 px-6 py-4 rounded-xl font-medium transition-all duration-300 border"
              style={{
                background: selectedCategory === 'all' 
                  ? 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)'
                  : 'var(--bg-card)',
                borderColor: selectedCategory === 'all' 
                  ? 'transparent'
                  : 'var(--border-primary)',
                color: selectedCategory === 'all' ? 'white' : 'var(--text-primary)',
                boxShadow: selectedCategory === 'all' 
                  ? 'var(--shadow-lg)' 
                  : 'var(--shadow-sm)',
                transform: selectedCategory === 'all' ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== 'all') {
                  e.target.style.background = 'var(--bg-hover)'
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = 'var(--shadow-md)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== 'all') {
                  e.target.style.background = 'var(--bg-card)'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'var(--shadow-sm)'
                }
              }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: selectedCategory === 'all' 
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'var(--bg-elevated)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Package className="h-5 w-5" />
              </div>
              <span className="text-base font-semibold">All Products</span>
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
                  className="flex items-center space-x-4 px-6 py-4 rounded-xl font-medium transition-all duration-300 border"
                  style={{
                    background: isSelected 
                      ? 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)'
                      : 'var(--bg-card)',
                    borderColor: isSelected 
                      ? 'transparent'
                      : 'var(--border-primary)',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    boxShadow: isSelected 
                      ? 'var(--shadow-lg)' 
                      : 'var(--shadow-sm)',
                    transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.target.style.background = 'var(--bg-hover)'
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = 'var(--shadow-md)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.target.style.background = 'var(--bg-card)'
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = 'var(--shadow-sm)'
                    }
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: isSelected 
                        ? 'rgba(255, 255, 255, 0.2)'
                        : getCategoryColor(category.value) + '20',
                      border: `2px solid ${isSelected ? 'rgba(255, 255, 255, 0.3)' : getCategoryColor(category.value)}`,
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: isSelected ? 'white' : getCategoryColor(category.value)
                      }}
                    />
                  </div>
                  <span className="text-base font-semibold">{category.label}</span>
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
