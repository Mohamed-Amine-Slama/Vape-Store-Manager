import React from 'react'
import { cn } from '../../lib/utils'

export function CategoryDropdown({ 
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
  const isMobile = window.innerWidth <= 768

  // Category colors for visual enhancement - EXACT same as original
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
          color: 'var(--text-primary)', 
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
            border: error ? '2px solid var(--accent-cherry)' : '2px solid var(--border-primary)',
            borderRadius: isMobile ? '0.75rem' : '0.5rem',
            backgroundColor: 'var(--bg-card)',
            fontSize: '16px',
            fontFamily: 'inherit',
            color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: isOpen ? 'var(--shadow-glow), var(--shadow-lg)' : 'var(--shadow-md)',
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
              color: 'var(--text-muted)',
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
              backgroundColor: 'var(--bg-card)',
              border: '2px solid var(--border-primary)',
              borderRadius: isMobile ? '0.75rem' : '0.5rem',
              boxShadow: 'var(--shadow-2xl)',
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
                  backgroundColor: selectedValue === option.value ? 'var(--bg-elevated)' : 'transparent',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  color: selectedValue === option.value ? 'var(--accent-vapor)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  borderBottom: index < options.length - 1 ? '1px solid var(--border-secondary)' : 'none',
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
                    e.target.style.backgroundColor = 'var(--bg-hover)'
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
                    style={{ width: '16px', height: '16px', color: 'var(--accent-vapor)' }}
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
          color: 'var(--accent-cherry)', 
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
      
      <style>
        {`
          @keyframes dropdown-fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  )
}

export default CategoryDropdown
