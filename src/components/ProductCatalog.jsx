import React, { useState, useEffect } from 'react'
import { Card, Modal, Button, AddButton } from './ui'
import { useProductCatalog, useProductStock } from '../hooks'
import { 
  ProductHeader, 
  ProductCard, 
  ProductForm, 
  StockModal 
} from './products'
import { Loader2, AlertCircle, Trash2 } from 'lucide-react'

export default function ProductCatalog() {
  // Main product catalog data
  const {
    products,
    filteredProducts,
    loading,
    selectedCategory,
    error,
    success,
    categories,
    categoryColors,
    categoryStats,
    setSelectedCategory,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    validateProduct,
    getCategoryDotColor
  } = useProductCatalog()

  // Stock management
  const {
    stockModal,
    openStockModal,
    closeStockModal,
    refreshStock
  } = useProductStock()

  // Form and modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle add product
  const handleAddProduct = () => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  // Handle edit product
  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  // Handle delete product
  const handleDeleteProduct = (product) => {
    setDeleteConfirm(product)
  }

  // Handle form submit
  const handleFormSubmit = async (formData) => {
    if (editingProduct) {
      return await updateProduct(editingProduct.id, formData)
    } else {
      return await createProduct(formData)
    }
  }

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    
    const result = await deleteProduct(deleteConfirm.id)
    if (result.success) {
      setDeleteConfirm(null)
    }
  }

  // Loading state
  if (loading && !products.length) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Products</h3>
          <p className="text-gray-600 text-center">
            Fetching your product catalog...
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProductHeader
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        categoryStats={categoryStats}
        filteredProducts={filteredProducts}
        onAddProduct={handleAddProduct}
        onRefresh={loadProducts}
        loading={loading}
        isMobile={isMobile}
      />

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryColors={categoryColors}
              getCategoryDotColor={getCategoryDotColor}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onViewStock={openStockModal}
              isMobile={isMobile}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedCategory === 'all' ? 'No Products Found' : `No ${categories.find(c => c.value === selectedCategory)?.label} Products`}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCategory === 'all' 
                ? 'Get started by adding your first product to the catalog.'
                : `No products found in the ${categories.find(c => c.value === selectedCategory)?.label} category.`
              }
            </p>
            <AddButton onClick={handleAddProduct} className="mt-2">
              Add Your First Product
            </AddButton>
          </div>
        </Card>
      )}

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editingProduct={editingProduct}
        categories={categories}
        validateProduct={validateProduct}
        loading={loading}
      />

      {/* Stock Modal */}
      <StockModal
        stockModal={stockModal}
        onClose={closeStockModal}
        onRefresh={refreshStock}
        getCategoryDotColor={getCategoryDotColor}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal isOpen={true} onClose={() => setDeleteConfirm(null)} size="sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  Are you sure you want to delete this product?
                </p>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryDotColor(deleteConfirm.category) }}
                  />
                  <span className="font-medium text-gray-900">{deleteConfirm.name}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Product
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={loading}
                  className="flex-1"
                >
                  Keep Product
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Loading Overlay */}
      {loading && products.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="text-gray-900 font-medium">Processing...</span>
          </div>
        </div>
      )}
    </div>
  )
}
