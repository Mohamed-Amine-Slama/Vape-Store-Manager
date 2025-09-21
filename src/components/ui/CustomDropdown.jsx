import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'

const CustomDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option",
  searchable = true, // Changed default to true
  disabled = false,
  className = "",
  label = "",
  error = "",
  icon = null,
  clearable = false,
  size = "md", // sm, md, lg
  fuzzySearchEnabled = true,
  searchKey = "label",
  displayKey = "label",
  valueKey = "value",
  maxResults = 50,
  noResultsText = "No options found"
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)
  const buttonRef = useRef(null)

  // Fuzzy search function
  const fuzzySearch = (text, searchTerm) => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    const textLower = text.toLowerCase()
    
    // Direct match gets highest priority
    if (textLower.includes(searchLower)) return true
    
    // Fuzzy matching - check if all characters of search term exist in order
    let searchIndex = 0
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++
      }
    }
    return searchIndex === searchLower.length
  }

  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => {
        const searchText = option[searchKey] || option.label || ''
        const description = option.description || ''
        
        if (fuzzySearchEnabled) {
          return fuzzySearch(searchText, searchTerm) || fuzzySearch(description, searchTerm)
        } else {
          return searchText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 description.toLowerCase().includes(searchTerm.toLowerCase())
        }
      }).slice(0, maxResults)
    : options.slice(0, maxResults)

  // Find selected option
  const selectedOption = options.find(option => (option[valueKey] || option.value) === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setSearchTerm('')
      if (!isOpen) {
        setIsFocused(true)
      }
    }
  }

  const handleSelect = (option) => {
    onChange(option[valueKey] || option.value)
    setIsOpen(false)
    setSearchTerm('')
    setIsFocused(false)
    buttonRef.current?.focus()
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setIsOpen(false)
    setSearchTerm('')
    setIsFocused(false)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setIsFocused(false)
      buttonRef.current?.focus()
    } else if (e.key === 'Enter' && !isOpen) {
      setIsOpen(true)
      setIsFocused(true)
    }
  }

  // Size configurations - Updated to match Input field dimensions
  const isMobile = window.innerWidth <= 768
  
  const sizeConfig = {
    sm: {
      button: 'px-3 py-3 text-sm min-h-[42px]',
      icon: 'h-4 w-4',
      label: 'text-xs',
      dropdown: 'text-sm',
      option: 'px-3 py-4'
    },
    md: {
      button: isMobile ? 'px-5 py-6 text-lg min-h-[65px]' : 'px-4 py-4 text-[1rem] min-h-[52px]',
      icon: isMobile ? 'h-6 w-6' : 'h-5 w-5',
      label: isMobile ? 'text-base' : 'text-sm',
      dropdown: isMobile ? 'text-lg' : 'text-base',
      option: isMobile ? 'px-10 py-20 min-h-[220px]' : 'px-4 py-4'
    },
    lg: {
      button: 'px-5 py-5 text-lg min-h-[60px]',
      icon: 'h-6 w-6',
      label: 'text-base',
      dropdown: 'text-lg',
      option: 'px-5 py-6'
    }
  }

  const currentSize = sizeConfig[size] || sizeConfig.md

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      
      <div ref={dropdownRef} className="relative">
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{
            background: disabled ? 'var(--bg-secondary)' : 'var(--bg-card)',
            borderColor: error ? 'var(--accent-cherry)' : (isOpen || isFocused ? 'var(--accent-vapor)' : 'var(--border-primary)'),
            color: disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
            boxShadow: isOpen || isFocused 
              ? 'var(--shadow-glow), var(--shadow-lg)' 
              : 'var(--shadow-md)',
            borderRadius: isMobile ? '0.75rem' : '0.5rem'
          }}
          className={`
            group relative w-full border-2 text-left cursor-pointer
            focus:outline-none transition-all duration-300 ease-out backdrop-blur-sm
            ${currentSize.button}
            ${disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'hover:scale-[1.02] active:scale-[0.98]'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Custom Icon */}
              {icon && (
                <div style={{ 
                  color: disabled ? 'var(--text-disabled)' : 'var(--text-muted)'
                }} className="flex-shrink-0 transition-colors duration-200 group-hover:text-[var(--accent-vapor)]">
                  {React.cloneElement(icon, { className: currentSize.icon })}
                </div>
              )}
              
              {/* Selected Value or Placeholder */}
              <span style={{
                color: !selectedOption 
                  ? 'var(--text-muted)' 
                  : disabled 
                    ? 'var(--text-disabled)' 
                    : 'var(--text-primary)'
              }} className="block truncate font-medium transition-colors duration-200">
                {selectedOption ? (selectedOption[displayKey] || selectedOption.label) : placeholder}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              {/* Clear Button */}
              {clearable && selectedOption && !disabled && (
                <div
                  onClick={handleClear}
                  className={`
                    p-1 rounded-full transition-all duration-200 cursor-pointer ${currentSize.icon}
                  `}
                  style={{
                    color: 'var(--text-muted)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-hover)'
                    e.target.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent'
                    e.target.style.color = 'var(--text-muted)'
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleClear(e)
                    }
                  }}
                >
                  <X className="w-full h-full" />
                </div>
              )}
              
              {/* Chevron */}
              <ChevronDown 
                className={`
                  ${currentSize.icon} transition-all duration-300 ease-out
                  ${isOpen ? 'transform rotate-180' : ''}
                `}
                style={{
                  color: disabled 
                    ? 'var(--text-disabled)' 
                    : isOpen 
                      ? 'var(--accent-vapor)' 
                      : 'var(--text-muted)'
                }} 
              />
            </div>
          </div>
          
          {/* Focus Ring Animation */}
          <div className={`
            absolute inset-0 rounded-2xl transition-all duration-300
            ${isOpen || isFocused 
              ? 'bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5' 
              : ''
            }
          `} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-primary)',
              boxShadow: 'var(--shadow-2xl)',
              borderRadius: isMobile ? '0.75rem' : '0.5rem'
            }}
            className={`
              absolute z-50 w-full mt-2 border-2 max-h-[450px] overflow-hidden backdrop-blur-sm
              transition-all duration-300 ease-out
              ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}
              ${isMobile ? 'w-[110%] -ml-[5%]' : 'w-full'}
            `}>
            {/* Search Input */}
            {searchable && (
              <div style={{ 
                borderBottomColor: 'var(--border-primary)',
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)'
              }} className="p-4 border-b">
                <div className="relative">
                  <Search style={{ color: 'var(--text-muted)' }} className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search options..."
                    style={{
                      background: 'var(--bg-elevated)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)',
                      borderRadius: isMobile ? '0.75rem' : '0.5rem'
                    }}
                    className={`
                      w-full pl-10 pr-4 py-3 border-2 
                      focus:outline-none transition-all duration-200 backdrop-blur-sm
                      placeholder:text-[var(--text-muted)] ${currentSize.dropdown}
                    `}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-vapor)'
                      e.target.style.boxShadow = 'var(--shadow-glow)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className={`${isMobile ? 'max-h-[400px]' : 'max-h-[350px]'} overflow-y-auto scrollbar-thin scrollbar-track-transparent`} style={{ scrollbarColor: 'var(--border-primary) transparent' }}>
              {filteredOptions.length === 0 ? (
                <div className={`
                  px-6 py-8 text-center ${currentSize.dropdown}
                `}
                style={{ color: 'var(--text-muted)' }}>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <Search className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="font-medium">
                    {searchTerm ? noResultsText : 'No options available'}
                  </p>
                  {searchTerm && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Try adjusting your search terms
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-3">
                  {filteredOptions.map((option, index) => (
                    <button
                      key={option[valueKey] || option.value}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`
                        group w-full text-left transition-all duration-200 ease-out
                        hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
                        focus:outline-none focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50
                        flex items-center justify-between relative
                        mb-3 rounded-xl ${isMobile ? 'my-2' : ''}
                        ${currentSize.option}
                        ${(option[valueKey] || option.value) === value 
                          ? 'font-semibold' 
                          : ''
                        }
                      `}
                      style={{
                        backgroundColor: (option[valueKey] || option.value) === value 
                          ? 'var(--bg-elevated)' 
                          : 'transparent',
                        color: (option[valueKey] || option.value) === value 
                          ? 'var(--accent-vapor)' 
                          : 'var(--text-primary)'
                      }}
                    >
                      {/* Option Content */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Option Icon (if provided) */}
                        {option.icon && (
                          <div className={`
                            flex-shrink-0 transition-colors duration-200
                          `}
                          style={{
                            color: (option[valueKey] || option.value) === value 
                              ? 'var(--accent-vapor)' 
                              : 'var(--text-muted)'
                          }}>
                            {React.cloneElement(option.icon, { className: currentSize.icon })}
                          </div>
                        )}
                        
                        {/* Option Label */}
                        <span className="block truncate transition-colors duration-200">
                          {option[displayKey] || option.label}
                        </span>
                        
                        {/* Option Description */}
                        {option.description && (
                          <span className="text-xs truncate ml-2" style={{ color: 'var(--text-muted)' }}>
                            {option.description}
                          </span>
                        )}
                      </div>
                      
                      {/* Selected Indicator */}
                      {(option[valueKey] || option.value) === value && (
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-vapor)' }}>
                            <Check className="h-3 w-3" style={{ color: 'white' }} />
                          </div>
                        </div>
                      )}
                      
                      {/* Hover Effect */}
                      <div className={`
                        absolute inset-0 rounded-xl transition-all duration-200 opacity-0
                        group-hover:opacity-100 bg-gradient-to-r from-blue-500/5 to-indigo-500/5
                      `} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center space-x-2" style={{ color: 'var(--accent-cherry)' }}>
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <X className="w-2 h-2" style={{ color: 'var(--accent-cherry)' }} />
          </div>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      
    </div>
  )
}

export default CustomDropdown
