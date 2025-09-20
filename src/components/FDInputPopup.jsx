import React, { useState, useEffect } from 'react'
import { Modal, Button, Input, AddButton } from './ui'
import { Coins, Calendar, AlertCircle, Clock, User, FileText } from 'lucide-react'

const FDInputPopup = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false,
  storeName = '',
  shiftNumber = 2 
}) => {
  const [fdForm, setFdForm] = useState({
    amount: '',
    notes: ''
  })
  const [error, setError] = useState('')
  const isMobile = window.innerWidth <= 768

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFdForm({
        amount: '',
        notes: ''
      })
      setError('')
    }
  }, [isOpen])

  const handleSubmit = (formData) => {
    setError('')

    // Validate FD amount
    const amount = parseFloat(formData.amount)
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
      notes: formData.notes.trim() || null
    })
  }

  const handleClose = () => {
    if (!loading) {
      setFdForm({
        amount: '',
        notes: ''
      })
      setError('')
      onClose()
    }
  }

  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowFormatted = tomorrowDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Set Tomorrow's FD"
      size="md"
    >
      <div style={{ 
        padding: isMobile ? '0' : '1.5rem',
        background: 'transparent'
      }}>
        <form onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(fdForm)
        }} className="space-y-4" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? '1.25rem' : '1rem' 
        }}>
          {/* Header Info */}
          <div style={{
            padding: isMobile ? '1.25rem' : '1rem',
            borderRadius: isMobile ? '0.875rem' : '0.5rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-secondary)',
            backdropFilter: isMobile ? 'blur(8px)' : 'none'
          }}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-vapor)' }}>
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span style={{ 
                fontSize: isMobile ? '0.9rem' : '0.875rem',
                fontWeight: '600',
                color: 'var(--accent-vapor)'
              }}>Setting FD for:</span>
            </div>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>{tomorrowFormatted}</p>
            <div className="flex items-center space-x-2" style={{ 
              color: 'var(--text-secondary)', 
              fontSize: isMobile ? '0.85rem' : '0.8rem' 
            }}>
              <Clock className="h-4 w-4" />
              <span>As Shift {shiftNumber} worker, you're responsible for setting tomorrow's cash fund</span>
            </div>
          </div>

          {/* FD Amount Input */}
          <div>
            <Input
              label="FD Amount (TND)"
              type="number"
              step="0.001"
              min="0"
              max="10000"
              value={fdForm.amount}
              onChange={(e) => setFdForm({...fdForm, amount: e.target.value})}
              placeholder="0.000"
              required
              disabled={loading}
              style={{
                fontFamily: 'monospace',
                fontWeight: '600',
                fontSize: isMobile ? '1rem' : '0.95rem'
              }}
            />
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--accent-success)',
                borderRadius: '50%'
              }}></div>
              <span>Enter the cash fund amount that should be available tomorrow morning</span>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.9rem' : '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '0.75rem'
            }}>
              Notes (Optional)
            </label>
            <textarea
              value={fdForm.notes}
              onChange={(e) => setFdForm({...fdForm, notes: e.target.value})}
              rows={3}
              placeholder="Any additional notes about the FD (e.g., special instructions, observations, etc.)..."
              disabled={loading}
              style={{
                width: '100%',
                padding: isMobile ? '1rem' : '0.75rem',
                border: '2px solid var(--border-primary)',
                borderRadius: isMobile ? '0.75rem' : '0.5rem',
                fontSize: isMobile ? '1rem' : '0.95rem',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '80px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent-vapor)'
                e.target.style.boxShadow = isMobile 
                  ? '0 0 0 3px rgba(0, 212, 255, 0.2), 0 4px 8px -2px rgba(0, 0, 0, 0.3)' 
                  : '0 0 0 3px rgba(0, 212, 255, 0.2), 0 0 20px rgba(0, 212, 255, 0.3)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-primary)'
                e.target.style.boxShadow = isMobile 
                  ? '0 2px 4px -1px rgba(0, 0, 0, 0.3)' 
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.4)'
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: isMobile ? '1rem' : '0.75rem',
              borderRadius: isMobile ? '0.75rem' : '0.5rem',
              backgroundColor: 'var(--bg-error)',
              border: '1px solid var(--accent-cherry)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'var(--accent-cherry)',
                borderRadius: isMobile ? '0.5rem' : '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <span style={{
                fontSize: isMobile ? '0.875rem' : '0.8rem',
                fontWeight: '600',
                color: 'var(--accent-cherry)'
              }}>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.75rem' : '0.75rem',
            paddingTop: isMobile ? '1.5rem' : '1rem',
            flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
          }}>
            <AddButton 
              type="submit" 
              disabled={loading || !fdForm.amount} 
              loading={loading}
              className="flex-1"
              style={{ flex: window.innerWidth <= 480 ? 'none' : 1 }}
              icon={<Coins />}
            >
              Set FD
            </AddButton>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              style={{ flex: window.innerWidth <= 480 ? 'none' : 1 }}
            >
              Cancel
            </Button>
          </div>

          {/* Info Footer */}
          <div style={{
            padding: isMobile ? '1rem' : '0.75rem',
            borderRadius: isMobile ? '0.75rem' : '0.5rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-secondary)',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--accent-vapor)',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.75rem',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                This FD will be visible to administrators and the morning shift worker
              </span>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--accent-success)',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default FDInputPopup
