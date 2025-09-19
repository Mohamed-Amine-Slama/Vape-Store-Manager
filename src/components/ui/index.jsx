import React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className,
  style,
  ...props 
}) {
  const isMobile = window.innerWidth <= 768

  const getButtonStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: isMobile ? '1rem 1.5rem' : '0.75rem 1rem',
      border: 'none',
      borderRadius: isMobile ? '0.875rem' : '0.5rem',
      fontSize: isMobile ? '1rem' : '0.875rem',
      fontWeight: '600',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      minHeight: isMobile ? '52px' : '40px',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
      ...style
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          background: isMobile 
            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)' 
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          boxShadow: isMobile 
            ? '0 8px 16px -4px rgba(59, 130, 246, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.1)' 
            : '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
          border: isMobile ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
        }
      case 'outline':
        return {
          ...baseStyles,
          background: isMobile 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'white',
          color: '#374151',
          border: isMobile 
            ? '2px solid #e2e8f0' 
            : '2px solid #d1d5db',
          boxShadow: isMobile 
            ? '0 4px 8px -2px rgba(0, 0, 0, 0.1)' 
            : 'none',
          backdropFilter: isMobile ? 'blur(8px)' : 'none'
        }
      case 'danger':
        return {
          ...baseStyles,
          background: isMobile 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)' 
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          boxShadow: isMobile 
            ? '0 8px 16px -4px rgba(239, 68, 68, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.1)' 
            : '0 4px 6px -1px rgba(239, 68, 68, 0.3)',
          border: isMobile ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
        }
      default:
        return baseStyles
    }
  }

  return (
    <button
      className={cn('btn', `btn-${variant}`, className)}
      style={getButtonStyles()}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled && !isMobile) {
          e.target.style.transform = 'translateY(-2px)'
          if (variant === 'primary') {
            e.target.style.boxShadow = '0 8px 12px -2px rgba(59, 130, 246, 0.4)'
          } else if (variant === 'danger') {
            e.target.style.boxShadow = '0 8px 12px -2px rgba(239, 68, 68, 0.4)'
          } else {
            e.target.style.boxShadow = '0 6px 12px -2px rgba(0, 0, 0, 0.15)'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isMobile) {
          e.target.style.transform = 'translateY(0)'
          if (variant === 'primary') {
            e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
          } else if (variant === 'danger') {
            e.target.style.boxShadow = '0 4px 6px -1px rgba(239, 68, 68, 0.3)'
          } else {
            e.target.style.boxShadow = 'none'
          }
        }
      }}
      onTouchStart={(e) => {
        if (!disabled && isMobile) {
          e.target.style.transform = 'scale(0.98)'
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }
        }
      }}
      onTouchEnd={(e) => {
        if (!disabled && isMobile) {
          setTimeout(() => {
            e.target.style.transform = 'scale(1)'
          }, 100)
        }
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ children, className, ...props }) {
  return (
    <div 
      className={cn('card', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function Input({ 
  label, 
  error, 
  className,
  style,
  ...props 
}) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div className="input-group" style={{ marginBottom: '1.25rem', ...style }}>
      {label && (
        <label className="input-label" style={{ 
          fontSize: isMobile ? '0.9rem' : '0.875rem', 
          fontWeight: '600', 
          marginBottom: '0.75rem', 
          display: 'block',
          background: isMobile 
            ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
            : 'inherit',
          backgroundClip: isMobile ? 'text' : 'inherit',
          WebkitBackgroundClip: isMobile ? 'text' : 'inherit',
          color: isMobile ? 'transparent' : '#374151'
        }}>
          {label}
        </label>
      )}
      <input
        className={cn(
          'input',
          error && 'error',
          className
        )}
        style={{ 
          width: '100%', 
          padding: isMobile ? '1rem' : '0.75rem', 
          border: error 
            ? '2px solid #ef4444' 
            : '2px solid #e2e8f0', 
          borderRadius: isMobile ? '0.75rem' : '0.5rem', 
          fontSize: isMobile ? '1rem' : '0.95rem', 
          backgroundColor: 'white',
          transition: 'all 0.2s ease',
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: isMobile 
            ? '0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
            : 'none',
          WebkitAppearance: 'none',
          ...style 
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6'
          e.target.style.boxShadow = isMobile 
            ? '0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.1)' 
            : '0 0 0 3px rgba(59, 130, 246, 0.1)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0'
          e.target.style.boxShadow = isMobile 
            ? '0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
            : 'none'
        }}
        {...props}
      />
      {error && (
        <div style={{
          marginTop: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem' : '0.5rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: isMobile ? '0.75rem' : '0.5rem',
          animation: 'shake 0.3s ease-in-out'
        }}>
          <svg 
            width="16" 
            height="16" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="#ef4444"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="input-error" style={{ 
            color: '#dc2626', 
            fontSize: isMobile ? '0.875rem' : '0.8rem', 
            margin: 0,
            fontWeight: '500'
          }}>
            {error}
          </p>
        </div>
      )}
      
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}
      </style>
    </div>
  )
}


export function Select({ 
  label, 
  options = [], 
  error, 
  className,
  value,
  onChange,
  style,
  placeholder = "Select an option...",
  ...props 
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || '')
  const dropdownRef = React.useRef(null)

  React.useEffect(() => {
    setSelectedValue(value || '')
  }, [value])

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = (optionValue) => {
    setSelectedValue(optionValue)
    setIsOpen(false)
    if (onChange) {
      onChange({ target: { value: optionValue } })
    }
  }

  const selectedOption = options.find(option => option.value === selectedValue)

  // Category colors for visual enhancement
  const categoryColors = {
    fruities: { bg: '#fdf2f8', color: '#be185d', border: '#f9a8d4' },
    gourmands: { bg: '#fffbeb', color: '#d97706', border: '#fed7aa' },
    puffs: { bg: '#f3e8ff', color: '#9333ea', border: '#d8b4fe' },
    coils: { bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' },
    mesh: { bg: '#f0fdf4', color: '#16a34a', border: '#86efac' }
  }

  return (
    <div className="input-group" style={{ marginBottom: '1rem', ...style }}>
      {label && (
        <label className="input-label" style={{ 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          color: '#374151', 
          marginBottom: '0.5rem', 
          display: 'block' 
        }}>
          {label}
        </label>
      )}
      
      <div className="custom-select-container" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
        <button
          type="button"
          className={cn('custom-select-trigger', error && 'error', className)}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            minHeight: '50px',
            padding: '12px 16px',
            border: error ? '2px solid #ef4444' : '2px solid #d1d5db',
            borderRadius: '12px',
            backgroundColor: 'white',
            fontSize: '16px',
            fontFamily: 'inherit',
            color: selectedOption ? '#1f2937' : '#9ca3af',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
            ...style
          }}
          {...props}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {selectedOption && categoryColors[selectedValue] && (
              <div 
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: categoryColors[selectedValue].bg,
                  border: `2px solid ${categoryColors[selectedValue].border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: categoryColors[selectedValue].color
                  }}
                />
              </div>
            )}
            <span style={{ 
              fontWeight: selectedOption ? '500' : '400',
              textAlign: 'left',
              textTransform: selectedOption ? 'capitalize' : 'none'
            }}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          
          <svg 
            style={{
              width: '20px',
              height: '20px',
              color: '#6b7280',
              flexShrink: 0,
              marginLeft: '8px',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
            fill="none" 
            viewBox="0 0 20 20"
          >
            <path 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="1.5" 
              d="m6 8 4 4 4-4"
            />
          </svg>
        </button>
        
        {isOpen && (
          <div 
            className="custom-select-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxHeight: '240px',
              overflowY: 'auto',
              animation: 'dropdown-fade-in 0.15s ease-out'
            }}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                className="custom-select-option"
                onClick={() => handleSelect(option.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: 'none',
                  backgroundColor: selectedValue === option.value ? '#f8fafc' : 'transparent',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  color: selectedValue === option.value ? '#1e40af' : '#374151',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  borderBottom: index < options.length - 1 ? '1px solid #f1f5f9' : 'none',
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontWeight: selectedValue === option.value ? '600' : '400',
                  textTransform: 'capitalize',
                  borderRadius: index === 0 ? '10px 10px 0 0' : index === options.length - 1 ? '0 0 10px 10px' : '0'
                }}
                onMouseEnter={(e) => {
                  if (selectedValue !== option.value) {
                    e.target.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedValue !== option.value) {
                    e.target.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {categoryColors[option.value] && (
                  <div 
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: categoryColors[option.value].bg,
                      border: `2px solid ${categoryColors[option.value].border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <div 
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: categoryColors[option.value].color
                      }}
                    />
                  </div>
                )}
                <span style={{ flex: 1 }}>{option.label}</span>
                {selectedValue === option.value && (
                  <svg 
                    style={{ width: '16px', height: '16px', color: '#1e40af' }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {error && (
        <p className="input-error" style={{ 
          color: '#dc2626', 
          fontSize: '0.875rem', 
          marginTop: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  const isMobile = window.innerWidth <= 768

  // Track the last pointerdown/touchstart coordinates so we can open
  // the modal near where the user tapped on mobile screens.
  const lastPointerRef = React.useRef({ x: null, y: null })

  React.useEffect(() => {
    function handlePointerDown(e) {
      // prefer touch points if present
      const point = e.touches && e.touches[0] ? e.touches[0] : e
      lastPointerRef.current = { x: point.clientX, y: point.clientY }
    }

    document.addEventListener('pointerdown', handlePointerDown, { capture: true })
    document.addEventListener('touchstart', handlePointerDown, { capture: true })
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      document.removeEventListener('touchstart', handlePointerDown, { capture: true })
    }
  }, [])

  // Prevent body scroll when modal is open on non-mobile devices.
  // On mobile we keep body scroll enabled but use overscroll-behavior on the modal
  // so inner modal scrolling doesn't propagate to the background.
  React.useEffect(() => {
    if (isOpen && !isMobile) {
      document.body.style.overflow = 'hidden'
      document.body.style.height = '100%'
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.height = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.height = 'unset'
    }
  }, [isOpen, isMobile])

  // Compute mobile position from last pointer; keep centered if unknown.
  const mobilePosition = isMobile ? (() => {
    try {
      const last = lastPointerRef.current || { x: null, y: null }
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
      const modalWidth = Math.min(vw - 32, 520)
      const modalHeight = Math.min(vh - 32, 800)
      let left = (vw - modalWidth) / 2
      let top = (vh - modalHeight) / 2
      if (last.x !== null && last.y !== null) {
        left = Math.min(Math.max(last.x - modalWidth / 2, 8), vw - modalWidth - 8)
        top = Math.min(Math.max(last.y - 60, 8), vh - modalHeight - 8)
      }
      return { left: left + 'px', top: top + 'px' }
    } catch (e) {
      return {}
    }
  })() : {}

  const modalMarkup = (
    <>
    <div 
      className="shared-modal-overlay" 
      onClick={onClose}
      style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: isMobile ? '1rem' : '2rem',
          margin: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
  <div 
          className="shared-modal-content" 
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: isMobile ? '1.25rem' : '1.25rem',
            boxShadow: isMobile 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.1)' 
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: isMobile ? 'calc(100vw - 2rem)' : '520px',
            minWidth: isMobile ? '280px' : '400px',
            width: '100%',
            minHeight: isMobile ? '200px' : '320px',
            overflowY: 'auto',
            position: isMobile ? 'fixed' : 'relative',
            zIndex: 100000,
            ...mobilePosition,
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            maxHeight: isMobile ? '90vh' : 'calc(100vh - 2rem)',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: isMobile ? 'fadeInScaleMobile 0.3s ease-out' : 'fadeInScale 0.2s ease-out',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            perspective: 1000
          }}
        >
          {/* Close button handle for mobile */}
          {isMobile && (
            <div style={{
              padding: '0.75rem 1.5rem 0.5rem',
              display: 'flex',
              justifyContent: 'center',
              background: 'transparent',
              cursor: 'pointer'
            }}
            onClick={onClose}
            >
              <div style={{
                width: '48px',
                height: '4px',
                backgroundColor: '#d1d5db',
                borderRadius: '2px',
                transition: 'background-color 0.2s ease'
              }} />
            </div>
          )}
          
          <div 
            className="modal-header"
            style={{
              padding: isMobile ? '0.75rem 1.5rem 1rem' : '1.5rem 1.5rem 1rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            background: isMobile 
              ? 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)' 
              : 'transparent',
            flexShrink: 0,
            minHeight: isMobile ? '70px' : 'auto',
            position: 'relative'
          }}
        >
          {/* Background decoration for mobile */}
          {isMobile && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
              borderRadius: '1.25rem 1.25rem 0 0'
            }} />
          )}            <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
              <h3 
                className="modal-title"
                style={{
                  fontSize: isMobile ? '1.125rem' : '1.25rem',
                  fontWeight: '800',
                  margin: '0',
                  lineHeight: 1.3,
                  paddingRight: '1rem',
                  background: isMobile 
                    ? 'linear-gradient(135deg, #1e293b 0%, #3730a3 100%)'
                    : 'inherit',
                  backgroundClip: isMobile ? 'text' : 'inherit',
                  WebkitBackgroundClip: isMobile ? 'text' : 'inherit',
                  color: isMobile ? 'transparent' : '#1e293b'
                }}
              >
                {title}
              </h3>
              {isMobile && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginTop: '0.25rem',
                  fontWeight: '500'
                }}>
                  {title && title.includes('Edit') ? 'Update team member information' : 'Add a new team member to your store'}
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="modal-close"
              style={{
                background: isMobile 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : '#f1f5f9',
                border: isMobile ? '1px solid rgba(255, 255, 255, 0.6)' : 'none',
                borderRadius: isMobile ? '0.75rem' : '0.5rem',
                padding: isMobile ? '0.625rem' : '0.5rem',
                cursor: 'pointer',
                color: '#64748b',
                width: isMobile ? '44px' : '40px',
                height: isMobile ? '44px' : '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: isMobile 
                  ? '0 4px 8px -2px rgba(0, 0, 0, 0.1)' 
                  : 'none',
                backdropFilter: isMobile ? 'blur(8px)' : 'none',
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.target.style.background = isMobile 
                  ? 'rgba(248, 250, 252, 0.95)' 
                  : '#e2e8f0'
                e.target.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = isMobile 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : '#f1f5f9'
                e.target.style.transform = 'scale(1)'
              }}
            >
              <svg 
                width={isMobile ? "20" : "24"} 
                height={isMobile ? "20" : "24"} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div style={{ 
            padding: isMobile ? '1.5rem' : '1.5rem', 
            flex: 1, 
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            background: isMobile 
              ? 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)' 
              : 'transparent',
            position: 'relative',
            maxHeight: isMobile ? 'calc(100vh - 220px)' : 'none'
          }}>
            {/* Mobile content decoration */}
            {isMobile && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.3) 50%, rgba(236, 72, 153, 0.3) 100%)',
                borderRadius: '1px'
              }} />
            )}
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              {children}
            </div>
          </div>
        </div>
  </div>
      
  <style>
        {`
          @keyframes fadeInScaleMobile {
            from {
              transform: scale(0.9);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes fadeInScale {
            from {
              transform: scale(0.95);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          .modal-overlay {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Prevent scrolling on body when modal is open */
          body.modal-open {
            overflow: hidden !important;
            height: 100vh !important;
            position: fixed !important;
            width: 100% !important;
          }
        `}
      </style>
    </>
  )

  // Render modal into document.body to avoid ancestor overflow/styling issues
  return createPortal(modalMarkup, document.body)
}
export function Badge({ children, variant = 'default', className }) {
  return (
    <span className={cn(
      'badge',
      `badge-${variant}`,
      className
    )}>
      {children}
    </span>
  )
}
