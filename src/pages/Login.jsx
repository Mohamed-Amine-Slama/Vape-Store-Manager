import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../components/ui'
import { supabase } from '../lib/supabase'
import { Store, Shield, Zap, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import './Login.css'

export default function Login() {
  const [pin, setPin] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('store') // 'store' or 'pin'
  const [showPin, setShowPin] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name')
      
      if (error && error.code !== 'PGRST116') {
        // If it's not a "no rows" error, throw it
        throw error
      }
      
      setStores(data || [])
      
      // If no stores found, we can still allow admin login
      if (!data || data.length === 0) {
        setError('⚠️ Database not set up yet. Please run the schema.sql file in Supabase, then use Admin Dashboard.')
      } else {
        setError('') // Clear any previous errors
      }
    } catch (error) {
      setError('Failed to load stores, but you can still try admin login')
      setStores([]) // Set empty array so the UI still works
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be 4-6 digits')
      return
    }

    setLoading(true)
    setError('')

    const result = await login(pin, selectedStore)
    
    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/worker')
      }
    } else {
      setError('Invalid PIN or wrong store. Please try again.')
    }
    
    setLoading(false)
  }

  const handleStoreSelect = (storeId) => {
    setIsAnimating(true)
    setTimeout(() => {
      setSelectedStore(storeId)
      setStep('pin')
      setError('')
      setIsAnimating(false)
    }, 300)
  }

  const handleBackToStores = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setStep('store')
      setPin('')
      setSelectedStore('')
      setError('')
      setShowPin(false)
      setIsAnimating(false)
    }, 300)
  }

  const handlePinInput = (digit) => {
    if (pin.length < 6) {
      setPin(pin + digit)
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
  }

  const handleClear = () => {
    setPin('')
    setError('')
  }

  const selectedStoreName = selectedStore === 'admin' 
    ? 'Admin Dashboard' 
    : stores.find(store => store.id === selectedStore)?.name || ''

  return (
    <div className="login-container">
      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-element floating-element-1"></div>
        <div className="floating-element floating-element-2"></div>
        <div className="floating-element floating-element-3"></div>
        <div className="floating-element floating-element-4"></div>
      </div>
      
      <div className="container flex items-center justify-center min-h-screen">
        <div className={`login-card ${isAnimating ? 'animating' : ''}`}>
          {/* Logo Section */}
          <div className="login-header">
            <div className="logo-container">
              <div className="logo-icon">
                <Zap className="logo-svg" />
              </div>
              <div className="logo-glow"></div>
            </div>
            <h1 className="login-title">
              Vape Store Manager
            </h1>
            <div className="title-underline"></div>
            <p className="login-subtitle">
              {step === 'store' ? (
                <><Store className="subtitle-icon" /> Select your store location</>
              ) : (
                <><Shield className="subtitle-icon" /> Enter PIN for {selectedStoreName}</>
              )}
            </p>
          </div>

          <div className="login-content">
            {step === 'store' ? (
              // Store Selection Step
              <div className="store-selection">
                {error && (
                  <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="login-stores-grid">
                  {stores.map((store, index) => (
                    <button
                      key={store.id}
                      onClick={() => handleStoreSelect(store.id)}
                      className="login-store-card"
                      disabled={loading}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="login-store-icon">
                        <Store />
                      </div>
                      <div className="login-store-info">
                        <h3>{store.name}</h3>
                      </div>
                      <div className="login-store-arrow">→</div>
                    </button>
                  ))}
                </div>
                
                {/* Special Access Buttons */}
                <div className="special-access">
                  <div className="divider">
                    <span>Special Access</span>
                  </div>
                  
                  <button
                    onClick={() => handleStoreSelect('admin')}
                    className="login-store-card login-admin-access"
                    disabled={loading}
                  >
                    <div className="login-store-icon login-admin">
                      <Shield />
                    </div>
                    <div className="login-store-info">
                      <h3>Admin Dashboard</h3>
                      <p>Full system access & analytics</p>
                    </div>
                    <div className="login-store-arrow">→</div>
                  </button>

                </div>
              </div>
            ) : (
              // PIN Entry Step
              <div className="pin-entry">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBackToStores}
                  className="back-button"
                  disabled={loading}
                >
                  <ArrowLeft className="back-icon" />
                  <span>Back to store selection</span>
                </button>

                {/* PIN Display */}
                <div className="pin-display-container">
                  <div className="pin-display">
                    <div className="pin-dots">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className={`pin-dot ${
                            index < pin.length ? 'filled' : ''
                          } ${index === pin.length ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="pin-toggle"
                      disabled={loading}
                    >
                      {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {showPin && pin && (
                    <div className="pin-preview">{pin}</div>
                  )}
                </div>

                {error && (
                  <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <span>{error}</span>
                  </div>
                )}

                {/* Number Pad */}
                <form onSubmit={handleSubmit} className="pin-form">
                  <div className="pin-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handlePinInput(digit.toString())}
                        className="pin-button"
                        disabled={loading || pin.length >= 6}
                      >
                        <span className="pin-button-text">{digit}</span>
                        <div className="pin-button-ripple"></div>
                      </button>
                    ))}
                    
                    {/* Bottom row */}
                    <button
                      type="button"
                      onClick={handleClear}
                      className="pin-button action-button"
                      disabled={loading}
                    >
                      <span className="pin-button-text">Clear</span>
                      <div className="pin-button-ripple"></div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handlePinInput('0')}
                      className="pin-button"
                      disabled={loading || pin.length >= 6}
                    >
                      <span className="pin-button-text">0</span>
                      <div className="pin-button-ripple"></div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleBackspace}
                      className="pin-button action-button"
                      disabled={loading || pin.length === 0}
                    >
                      <span className="pin-button-text">⌫</span>
                      <div className="pin-button-ripple"></div>
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className={`submit-button ${loading ? 'loading' : ''} ${pin.length >= 4 ? 'ready' : ''}`}
                    disabled={loading || pin.length < 4}
                  >
                    <div className="submit-content">
                      {loading ? (
                        <>
                          <div className="loading-spinner"></div>
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="submit-icon" />
                          <span>Sign In</span>
                        </>
                      )}
                    </div>
                    <div className="submit-ripple"></div>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
