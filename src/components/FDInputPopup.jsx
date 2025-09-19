import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './ui'
import { Coins, Calendar, AlertCircle, X, Sparkles, Clock, User, FileText } from 'lucide-react'

const FDInputPopup = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false,
  storeName = '',
  shiftNumber = 2 
}) => {
  const [fdAmount, setFdAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Validate FD amount
    const amount = parseFloat(fdAmount)
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid FD amount (must be 0 or greater)')
      return
    }

    if (amount > 10000) {
      setError('FD amount seems too high. Please verify the amount.')
      return
    }

    // Submit the FD
    onSubmit({
      amount: amount,
      notes: notes.trim() || null
    })
  }

  // Animation effects
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Auto-focus on amount input when popup opens
      setTimeout(() => {
        const amountInput = document.getElementById('fdAmount')
        if (amountInput) amountInput.focus()
      }, 300)
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  const handleClose = () => {
    if (!loading) {
      setIsAnimating(false)
      setTimeout(() => {
        setFdAmount('')
        setNotes('')
        setError('')
        onClose()
      }, 200)
    }
  }

  // Prevent body scroll when modal is open - MUST be before any early returns
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowFormatted = tomorrowDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 overflow-y-auto"
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Enhanced Backdrop with Strong Blur */}
        <div 
          className={`
            fixed inset-0 bg-gradient-to-br from-slate-900/70 via-blue-900/30 to-indigo-900/50 
            backdrop-blur-xl transition-all duration-500
            ${isAnimating ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)'
          }}
          onClick={handleClose}
        />
        
        {/* Worker Dashboard Style Modal */}
        <div className={`
          relative transform overflow-hidden bg-white shadow-2xl 
          transition-all duration-500 ease-out w-full max-w-lg
          rounded-2xl border border-gray-200
          ${isAnimating 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-8'
          }
        `}
        style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-400/10 to-green-600/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          {/* Worker Dashboard Style Header */}
          <div 
            className="worker-card-header relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
            }}
          >
            {/* Shimmer effect like worker cards */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Set Tomorrow's FD
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Font de Caisse for {storeName}</span>
                  </p>
                </div>
              </div>
              {!loading && (
                <button
                  onClick={handleClose}
                  className="worker-button p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-lg transition-all duration-200"
                  style={{ minHeight: '40px' }}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Worker Dashboard Style Content */}
          <form onSubmit={handleSubmit} className="worker-card-content">
            {/* Worker Dashboard Style Date Info */}
            <div className="shift-card border-blue-200 bg-blue-50 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-blue-700">Setting FD for:</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-blue-900 mb-2">{tomorrowFormatted}</p>
              <div className="flex items-center space-x-2 text-blue-600 text-sm">
                <Clock className="h-4 w-4" />
                <span>As Shift {shiftNumber} worker, you're responsible for setting tomorrow's cash fund</span>
              </div>
            </div>

            {/* Worker Dashboard Style FD Amount Input */}
            <div className="form-field mb-6">
              <label htmlFor="fdAmount" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Coins className="h-4 w-4 text-green-500" />
                <span>FD Amount (TND) *</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-green-600 font-bold text-base">TND</span>
                </div>
                <input
                  type="number"
                  id="fdAmount"
                  value={fdAmount}
                  onChange={(e) => setFdAmount(e.target.value)}
                  step="0.001"
                  min="0"
                  max="10000"
                  placeholder="0.000"
                  className="form-input pl-16 text-lg font-mono font-bold text-gray-900"
                  required
                  disabled={loading}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Enter the cash fund amount that should be available tomorrow morning</span>
              </div>
            </div>

            {/* Worker Dashboard Style Notes Input */}
            <div className="form-field mb-6">
              <label htmlFor="notes" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <span>Notes (Optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any additional notes about the FD (e.g., special instructions, observations, etc.)..."
                className="form-input resize-none text-gray-900"
                disabled={loading}
              />
            </div>

            {/* Worker Dashboard Style Error Message */}
            {error && (
              <div className="mb-6 shift-card border-red-200 bg-red-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Worker Dashboard Style Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="worker-button flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300"
                disabled={loading}
              >
                <div className="flex items-center justify-center space-x-2">
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </div>
              </button>
              <button
                type="submit"
                className="worker-button flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg"
                disabled={loading || !fdAmount}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loading-spinner w-4 h-4 border-white"></div>
                    <span>Setting FD...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Coins className="h-4 w-4" />
                    <span>Set FD</span>
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Worker Dashboard Style Footer */}
          <div 
            className="worker-card-header border-t border-gray-200"
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderTop: '1px solid rgba(226, 232, 240, 0.8)'
            }}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm text-gray-600 font-medium text-center">
                This FD will be visible to administrators and the morning shift worker
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render modal using portal to ensure it appears above everything
  return createPortal(modalContent, document.body)
}

export default FDInputPopup
