import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'

const CustomDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option",
  searchable = false,
  disabled = false,
  className = "",
  label = "",
  error = "",
  icon = null,
  clearable = false,
  size = "md" // sm, md, lg
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)
  const buttonRef = useRef(null)

  // Filter options based on search term
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  // Find selected option
  const selectedOption = options.find(option => option.value === value)

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
    onChange(option.value)
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

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'px-3 py-2 text-sm min-h-[36px]',
      icon: 'h-4 w-4',
      label: 'text-xs',
      dropdown: 'text-sm',
      option: 'px-3 py-2'
    },
    md: {
      button: 'px-4 py-3 text-base min-h-[44px]',
      icon: 'h-5 w-5',
      label: 'text-sm',
      dropdown: 'text-base',
      option: 'px-4 py-3'
    },
    lg: {
      button: 'px-5 py-4 text-lg min-h-[52px]',
      icon: 'h-6 w-6',
      label: 'text-base',
      dropdown: 'text-lg',
      option: 'px-5 py-4'
    }
  }

  const currentSize = sizeConfig[size] || sizeConfig.md

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
          className={`
            group relative w-full bg-white border-2 rounded-2xl text-left cursor-pointer
            focus:outline-none transition-all duration-300 ease-out
            ${currentSize.button}
            ${disabled 
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200 shadow-none' 
              : `border-gray-200 hover:border-blue-300 text-gray-900 shadow-sm hover:shadow-md
                 ${isOpen || isFocused 
                   ? 'border-blue-500 shadow-lg ring-4 ring-blue-500/10' 
                   : 'hover:bg-gray-50/50'
                 }`
            }
            ${error ? 'border-red-300 hover:border-red-400 focus:border-red-500 focus:ring-red-500/10' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Custom Icon */}
              {icon && (
                <div className={`flex-shrink-0 ${disabled ? 'text-gray-300' : 'text-gray-500 group-hover:text-blue-500'} transition-colors duration-200`}>
                  {React.cloneElement(icon, { className: currentSize.icon })}
                </div>
              )}
              
              {/* Selected Value or Placeholder */}
              <span className={`block truncate font-medium transition-colors duration-200 ${
                !selectedOption 
                  ? 'text-gray-400' 
                  : disabled 
                    ? 'text-gray-400' 
                    : 'text-gray-900'
              }`}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              {/* Clear Button */}
              {clearable && selectedOption && !disabled && (
                <div
                  onClick={handleClear}
                  className={`
                    p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600
                    transition-all duration-200 cursor-pointer ${currentSize.icon}
                  `}
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
                  ${currentSize.icon} text-gray-400 group-hover:text-blue-500 
                  transition-all duration-300 ease-out
                  ${isOpen ? 'transform rotate-180 text-blue-500' : ''}
                  ${disabled ? 'text-gray-300' : ''}
                `} 
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
          <div className={`
            absolute z-50 w-full mt-2 bg-white border-2 border-gray-100 rounded-2xl 
            shadow-2xl max-h-80 overflow-hidden backdrop-blur-sm
            transition-all duration-300 ease-out
            ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}
          `}>
            {/* Search Input */}
            {searchable && (
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search options..."
                    className={`
                      w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl 
                      focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 
                      transition-all duration-200 bg-white/80 backdrop-blur-sm
                      placeholder:text-gray-400 ${currentSize.dropdown}
                    `}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {filteredOptions.length === 0 ? (
                <div className={`
                  px-6 py-8 text-center text-gray-500 ${currentSize.dropdown}
                `}>
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="font-medium">
                    {searchTerm ? 'No options found' : 'No options available'}
                  </p>
                  {searchTerm && (
                    <p className="text-sm text-gray-400 mt-1">
                      Try adjusting your search terms
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  {filteredOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`
                        group w-full text-left transition-all duration-200 ease-out
                        hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
                        focus:outline-none focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50
                        flex items-center justify-between relative
                        ${currentSize.option}
                        ${option.value === value 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold' 
                          : 'text-gray-900 hover:text-blue-700'
                        }
                        ${index === 0 ? 'rounded-t-xl' : ''}
                        ${index === filteredOptions.length - 1 ? 'rounded-b-xl' : ''}
                      `}
                    >
                      {/* Option Content */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Option Icon (if provided) */}
                        {option.icon && (
                          <div className={`
                            flex-shrink-0 transition-colors duration-200
                            ${option.value === value ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}
                          `}>
                            {React.cloneElement(option.icon, { className: currentSize.icon })}
                          </div>
                        )}
                        
                        {/* Option Label */}
                        <span className="block truncate transition-colors duration-200">
                          {option.label}
                        </span>
                        
                        {/* Option Description */}
                        {option.description && (
                          <span className="text-xs text-gray-400 truncate ml-2">
                            {option.description}
                          </span>
                        )}
                      </div>
                      
                      {/* Selected Indicator */}
                      {option.value === value && (
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
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
        <div className="mt-2 flex items-center space-x-2 text-red-600">
          <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-2 h-2 text-red-500" />
          </div>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      
    </div>
  )
}

export default CustomDropdown
