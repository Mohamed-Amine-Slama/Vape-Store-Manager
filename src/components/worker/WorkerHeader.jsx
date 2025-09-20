import React from 'react'
import { Button } from '../ui'
import { Store, LogOut } from 'lucide-react'

const WorkerHeader = ({ user, storeInfo, onLogout }) => {
  return (
    <div className="worker-header">
      <div className="worker-header-content max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="flex items-center space-x-3">
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
            }} className="p-2 rounded-xl">
              <Store style={{ color: 'var(--accent-vapor)' }} className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 style={{ color: 'var(--text-primary)' }} className="text-lg sm:text-xl font-bold">
                Worker Dashboard
              </h1>
              <p style={{ color: 'var(--text-secondary)' }} className="text-xs sm:text-sm">
                {user.name} • {storeInfo?.name || 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Button
            onClick={onLogout}
            variant="outline"
            style={{
              borderColor: 'var(--border-primary)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-elevated)'
            }}
            className="worker-button flex items-center space-x-2 border-2 font-semibold transition-all duration-300 hover:scale-105"
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'var(--accent-cherry)'
              e.target.style.color = 'var(--accent-cherry)'
              e.target.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'var(--border-primary)'
              e.target.style.color = 'var(--text-secondary)'
              e.target.style.boxShadow = 'none'
            }}
          >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkerHeader
