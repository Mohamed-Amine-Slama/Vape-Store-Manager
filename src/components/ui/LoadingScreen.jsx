import React, { useState, useEffect } from 'react'
import { Zap, Store, Shield, TrendingUp } from 'lucide-react'
import './LoadingScreen.css'

export default function LoadingScreen() {
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Progressive loading steps animation
    const stepTimings = [
      { step: 0, delay: 500 },   // Start with "Connecting to database" after 0.5s
      { step: 1, delay: 1500 },  // Move to "Loading store data" after 1.5s
      { step: 2, delay: 2500 },  // Move to "Preparing interface" after 2.5s
    ]

    const timeouts = stepTimings.map(({ step, delay }) => 
      setTimeout(() => setCurrentStep(step), delay)
    )

    // Cleanup timeouts on unmount
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  const handleVideoError = () => {
    console.warn('Video failed to load, falling back to animated background')
    setVideoError(true)
  }

  const handleVideoLoaded = () => {
    setVideoLoaded(true)
  }

  return (
    <div className="loading-screen">
      {/* Video Background */}
      {!videoError && (
        <div className="loading-video-container">
          <video
            className="loading-video"
            autoPlay
            muted
            loop
            playsInline
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
          >
            <source src="/Generated%20File%20September%2022,%202025%20-%206_20PM.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="loading-video-overlay"></div>
        </div>
      )}

      {/* Fallback Animated Background (shown if video fails to load) */}
      {videoError && (
        <>
          <div className="loading-background">
            <div className="loading-gradient-orb loading-orb-1"></div>
            <div className="loading-gradient-orb loading-orb-2"></div>
            <div className="loading-gradient-orb loading-orb-3"></div>
            <div className="loading-gradient-orb loading-orb-4"></div>
          </div>

          {/* Floating Elements */}
          <div className="loading-floating-elements">
            <div className="loading-floating-element loading-element-1">
              <Store size={24} />
            </div>
            <div className="loading-floating-element loading-element-2">
              <Shield size={20} />
            </div>
            <div className="loading-floating-element loading-element-3">
              <TrendingUp size={18} />
            </div>
            <div className="loading-floating-element loading-element-4">
              <Zap size={22} />
            </div>
          </div>
        </>
      )}

      {/* Main Loading Content */}
      <div className="loading-content">
        {/* Logo Section */}
        <div className="loading-logo-container">
          <div className="loading-logo-icon">
            <Zap className="loading-logo-svg" />
            <div className="loading-logo-glow"></div>
          </div>
          <div className="loading-logo-pulse"></div>
        </div>

        {/* Brand Title */}
        <div className="loading-brand">
          <h1 className="loading-title">Vape Store Manager</h1>
          <div className="loading-title-underline"></div>
        </div>

        {/* Loading Animation */}
        <div className="loading-animation-container">
          <div className="loading-spinner-container">
            <div className="loading-spinner">
              <div className="loading-spinner-inner"></div>
              <div className="loading-spinner-outer"></div>
            </div>
          </div>
          
          <div className="loading-text-container">
            <p className="loading-text">Initializing system...</p>
            <div className="loading-dots">
              <span className="loading-dot loading-dot-1">.</span>
              <span className="loading-dot loading-dot-2">.</span>
              <span className="loading-dot loading-dot-3">.</span>
            </div>
          </div>
        </div>

        {/* Loading Progress Bar */}
        <div className="loading-progress-container">
          <div className="loading-progress-bar">
            <div 
              className="loading-progress-fill" 
              style={{ 
                width: `${((currentStep + 1) / 3) * 100}%`,
                transition: 'width 0.8s ease-out'
              }}
            ></div>
            <div className="loading-progress-glow"></div>
          </div>
        </div>

        {/* Loading Steps */}
        <div className="loading-steps">
          <div className={`loading-step ${currentStep >= 0 ? 'loading-step-active' : ''} ${currentStep > 0 ? 'loading-step-completed' : ''}`}>
            <div className="loading-step-icon">
              <div className="loading-step-dot"></div>
            </div>
            <span className="loading-step-text">Connecting to database</span>
          </div>
          <div className={`loading-step ${currentStep >= 1 ? 'loading-step-active' : ''} ${currentStep > 1 ? 'loading-step-completed' : ''}`}>
            <div className="loading-step-icon">
              <div className="loading-step-dot"></div>
            </div>
            <span className="loading-step-text">Loading store data</span>
          </div>
          <div className={`loading-step ${currentStep >= 2 ? 'loading-step-active' : ''} ${currentStep > 2 ? 'loading-step-completed' : ''}`}>
            <div className="loading-step-icon">
              <div className="loading-step-dot"></div>
            </div>
            <span className="loading-step-text">Preparing interface</span>
          </div>
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="loading-footer">
        <p className="loading-footer-text">
          Professional Vape Store Management System
        </p>
        <div className="loading-footer-version">v2.0</div>
      </div>
    </div>
  )
}
