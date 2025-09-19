/**
 * Safe data access utilities to prevent null/undefined errors
 */

/**
 * Safely access nested object properties
 * @param {Object} obj - The object to access
 * @param {string} path - The path to access (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} - The value at path or defaultValue
 */
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || typeof obj !== 'object') return defaultValue
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return defaultValue
    }
    current = current[key]
  }
  
  return current
}

/**
 * Check if a value is null or undefined
 * @param {any} value - Value to check
 * @returns {boolean} - True if null or undefined
 */
export const isNullish = (value) => {
  return value === null || value === undefined
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {any} value - Value to check
 * @returns {boolean} - True if empty
 */
export const isEmpty = (value) => {
  if (isNullish(value)) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Safely parse a number, returning default if invalid
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} - Parsed number or default
 */
export const safeParseNumber = (value, defaultValue = 0) => {
  if (isNullish(value)) return defaultValue
  const parsed = Number(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Safely parse a float, returning default if invalid
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} - Parsed float or default
 */
export const safeParseFloat = (value, defaultValue = 0.0) => {
  if (isNullish(value)) return defaultValue
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Safely convert value to string
 * @param {any} value - Value to convert
 * @param {string} defaultValue - Default value if conversion fails
 * @returns {string} - String value or default
 */
export const safeString = (value, defaultValue = '') => {
  if (isNullish(value)) return defaultValue
  return String(value)
}

/**
 * Safely access array element by index
 * @param {Array} array - Array to access
 * @param {number} index - Index to access
 * @param {any} defaultValue - Default value if index doesn't exist
 * @returns {any} - Array element or default
 */
export const safeArrayGet = (array, index, defaultValue = null) => {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    return defaultValue
  }
  return array[index]
}

/**
 * Safely execute a function with error handling
 * @param {Function} fn - Function to execute
 * @param {any} defaultValue - Default value if function throws
 * @param {...any} args - Arguments to pass to function
 * @returns {any} - Function result or default
 */
export const safeFn = (fn, defaultValue = null, ...args) => {
  try {
    if (typeof fn !== 'function') return defaultValue
    return fn(...args)
  } catch (error) {
    return defaultValue
  }
}

/**
 * Create a safe version of an object with null-safe property access
 * @param {Object} obj - Object to make safe
 * @returns {Proxy} - Proxy object with safe access
 */
export const createSafeObject = (obj) => {
  return new Proxy(obj || {}, {
    get(target, prop) {
      return target[prop] ?? null
    }
  })
}

export default {
  safeGet,
  isNullish,
  isEmpty,
  safeParseNumber,
  safeParseFloat,
  safeString,
  safeArrayGet,
  safeFn,
  createSafeObject
}
