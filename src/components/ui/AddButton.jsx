import React from 'react'
import { Plus } from 'lucide-react'

const AddButton = ({ 
  children, 
  onClick, 
  disabled = false,
  size = 'md', // sm, md, lg
  variant = 'primary', // primary, secondary, outline
  className = '',
  icon = <Plus />,
  loading = false,
  ...props 
}) => {
  const isMobile = window.innerWidth <= 768

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: isMobile ? '0.75rem 1rem' : '0.5rem 0.75rem',
      fontSize: isMobile ? '0.875rem' : '0.8rem',
      iconSize: 'h-4 w-4',
      minHeight: isMobile ? '40px' : '36px',
      borderRadius: isMobile ? '0.75rem' : '0.5rem'
    },
    md: {
      padding: isMobile ? '1rem 1.5rem' : '0.75rem 1rem',
      fontSize: isMobile ? '1rem' : '0.875rem',
      iconSize: 'h-5 w-5',
      minHeight: isMobile ? '48px' : '44px',
      borderRadius: isMobile ? '0.75rem' : '0.5rem'
    },
    lg: {
      padding: isMobile ? '1.25rem 2rem' : '1rem 1.5rem',
      fontSize: isMobile ? '1.125rem' : '1rem',
      iconSize: 'h-6 w-6',
      minHeight: isMobile ? '56px' : '52px',
      borderRadius: isMobile ? '1rem' : '0.75rem'
    }
  }

  const currentSize = sizeConfig[size] || sizeConfig.md

  // Variant styles
  const getVariantStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontWeight: '600',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.3s ease',
      fontFamily: 'inherit',
      border: '2px solid',
      outline: 'none',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      padding: currentSize.padding,
      fontSize: currentSize.fontSize,
      minHeight: currentSize.minHeight,
      borderRadius: currentSize.borderRadius
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          background: disabled 
            ? 'var(--bg-secondary)' 
            : 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)',
          borderColor: disabled ? 'var(--border-primary)' : 'var(--accent-vapor)',
          color: disabled ? 'var(--text-disabled)' : 'white',
          boxShadow: disabled 
            ? 'none' 
            : 'var(--shadow-glow), var(--shadow-lg)'
        }
      case 'secondary':
        return {
          ...baseStyles,
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-md)'
        }
      case 'outline':
        return {
          ...baseStyles,
          background: 'transparent',
          borderColor: 'var(--accent-vapor)',
          color: 'var(--accent-vapor)',
          boxShadow: 'none'
        }
      default:
        return baseStyles
    }
  }

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e)
    }
  }

  const handleMouseEnter = (e) => {
    if (!disabled && !loading) {
      const target = e.target
      switch (variant) {
        case 'primary':
          target.style.transform = isMobile ? 'scale(1.02)' : 'translateY(-2px)'
          target.style.boxShadow = 'var(--shadow-glow), var(--shadow-2xl)'
          break
        case 'secondary':
          target.style.backgroundColor = 'var(--bg-hover)'
          target.style.borderColor = 'var(--accent-vapor)'
          target.style.color = 'var(--accent-vapor)'
          break
        case 'outline':
          target.style.backgroundColor = 'var(--accent-vapor)'
          target.style.color = 'white'
          break
      }
    }
  }

  const handleMouseLeave = (e) => {
    if (!disabled && !loading) {
      const target = e.target
      switch (variant) {
        case 'primary':
          target.style.transform = 'none'
          target.style.boxShadow = 'var(--shadow-glow), var(--shadow-lg)'
          break
        case 'secondary':
          target.style.backgroundColor = 'var(--bg-elevated)'
          target.style.borderColor = 'var(--border-primary)'
          target.style.color = 'var(--text-primary)'
          break
        case 'outline':
          target.style.backgroundColor = 'transparent'
          target.style.color = 'var(--accent-vapor)'
          break
      }
    }
  }

  const handleTouchStart = (e) => {
    if (!disabled && !loading && isMobile) {
      e.target.style.transform = 'scale(0.98)'
      // Haptic feedback
      if (navigator.vibrate && document.hasFocus()) {
        try {
          navigator.vibrate(50)
        } catch (error) {
          // Silently ignore vibration errors
        }
      }
    }
  }

  const handleTouchEnd = (e) => {
    if (!disabled && !loading && isMobile) {
      setTimeout(() => {
        e.target.style.transform = 'scale(1)'
      }, 100)
    }
  }

  return (
    <button
      className={`add-button add-button-${variant} add-button-${size} ${className}`}
      style={getVariantStyles()}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      {...props}
    >
      {loading ? (
        <>
          <div className="loading-spinner" style={{
            width: currentSize.iconSize.split(' ')[0].replace('h-', '').replace('4', '16px').replace('5', '20px').replace('6', '24px'),
            height: currentSize.iconSize.split(' ')[1].replace('w-', '').replace('4', '16px').replace('5', '20px').replace('6', '24px'),
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Adding...</span>
        </>
      ) : (
        <>
          {icon && React.cloneElement(icon, { 
            className: `${currentSize.iconSize} flex-shrink-0` 
          })}
          <span className="flex-1 text-center">{children}</span>
        </>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </button>
  )
}

export default AddButton
