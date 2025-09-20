import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { User, X } from 'lucide-react'

export default function WorkerDetailsModal({ isOpen, onClose, worker }) {
  const [workerSalesDetails, setWorkerSalesDetails] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Prevent body scrolling and reset scroll position
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = '0'
      document.body.style.left = '0'
      document.body.style.width = '100%'
      
      if (worker && worker.id) {
        loadWorkerSalesDetails()
      }
    } else {
      // Restore body scrolling
      document.body.style.overflow = 'auto'
      document.body.style.position = 'static'
      document.body.style.top = 'auto'
      document.body.style.left = 'auto'
      document.body.style.width = 'auto'
    }
    return () => {
      // Cleanup - restore body scrolling
      document.body.style.overflow = 'auto'
      document.body.style.position = 'static'
      document.body.style.top = 'auto'
      document.body.style.left = 'auto'
      document.body.style.width = 'auto'
    }
  }, [isOpen, worker?.id])

  const loadWorkerSalesDetails = async () => {
    if (!worker) return
    setLoadingDetails(true)
    setWorkerSalesDetails([])
    
    try {
      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      
      const { data: salesData, error } = await supabase
        .from('sales')
        .select('id, price, product, quantity, ml_amount, created_at')
        .eq('user_id', worker.id)
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const formattedData = salesData?.map(sale => ({
        id: sale.id,
        total: parseFloat(sale.price) || 0,
        time: sale.created_at ? new Date(sale.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : 'Unknown time',
        product: sale.product || 'Unknown product',
        quantity: sale.quantity || 1,
        price: parseFloat(sale.price) || 0,
        ml_amount: sale.ml_amount || null
      })) || []
      
      setWorkerSalesDetails(formattedData)
    } catch (error) {
      setWorkerSalesDetails([])
    } finally {
      setLoadingDetails(false)
    }
  }

  if (!isOpen || !worker) return null

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: '0px',
        left: '0px',
        right: '0px',
        bottom: '0px',
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        margin: '0px',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '2px solid var(--border-primary)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)',
          padding: '1.5rem',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              {worker.name}'s Performance
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
              Today's Sales Details
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              padding: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {loadingDetails ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-primary)' }}>Loading performance data...</p>
            </div>
          ) : workerSalesDetails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                No Sales Today
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {worker.name} hasn't recorded any transactions today
              </p>
            </div>
          ) : (
            <div>
              {/* Summary */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Today's Summary</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ 
                    background: 'var(--bg-elevated)', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    minWidth: '120px',
                    border: '1px solid var(--border-primary)'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-vapor)' }}>
                      {workerSalesDetails.length}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Transactions
                    </div>
                  </div>
                  <div style={{ 
                    background: 'var(--bg-elevated)', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    minWidth: '120px',
                    border: '1px solid var(--border-primary)'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-success)' }}>
                      {formatCurrency(workerSalesDetails.reduce((sum, sale) => sum + sale.total, 0))}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Revenue
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Transaction List */}
              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Transaction History</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {workerSalesDetails.map((sale, index) => (
                    <div 
                      key={sale.id} 
                      style={{ 
                        padding: '1rem',
                        border: '1px solid var(--border-secondary)',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--bg-elevated)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                          {sale.product}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {sale.time}
                          {sale.ml_amount && ` • ${sale.ml_amount}ml`}
                          {sale.quantity > 1 && ` • ×${sale.quantity}`}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--accent-success)' }}>
                        {formatCurrency(sale.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
