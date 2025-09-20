import React from 'react'
import { DollarSign } from 'lucide-react'
import { formatCurrency, formatDateTime } from '../../lib/utils'

const SalesHistory = ({ sales }) => {
  if (sales.length === 0) return null

  return (
    <div 
      className="rounded-xl overflow-hidden relative transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-primary)'
      }}
    >
      {/* Top accent border */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: '4px', 
        background: 'linear-gradient(90deg, var(--accent-success), #34D399)' 
      }}></div>
      
      <div className="p-4" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-secondary)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-success), #34D399)' }}>
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Today's Sales</h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>{sales.length} transactions recorded</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                <th className="text-left py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Product</th>
                <th className="text-left py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                <th className="text-left py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Price</th>
                <th className="hidden sm:table-cell text-left py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                  <td className="py-3 px-2">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{sale.product}</div>
                    <div className="sm:hidden text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {formatDateTime(sale.created_at)}
                    </div>
                  </td>
                  <td className="py-3 px-2 font-semibold">
                    {sale.ml_amount ? (
                      <span style={{ color: 'var(--accent-vapor)' }}>{sale.ml_amount}ml</span>
                    ) : (
                      <span style={{ color: 'var(--accent-purple)' }}>{sale.quantity} pcs</span>
                    )}
                  </td>
                  <td className="py-3 px-2 font-bold" style={{ color: 'var(--accent-success)' }}>
                    {formatCurrency(sale.price)}
                  </td>
                  <td className="hidden sm:table-cell py-3 px-2" style={{ color: 'var(--text-muted)' }}>
                    {formatDateTime(sale.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SalesHistory
