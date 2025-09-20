import React, { useState, useEffect } from 'react'
import { Modal, Button, Input, CustomDropdown, AddButton } from './index'
import { Users, Crown, Shield } from 'lucide-react'

const UserFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingUser = null,
  loading = false,
  errors = {},
  title = null
}) => {
  const [userForm, setUserForm] = useState({
    name: '',
    pin: '',
    role: 'worker'
  })

  // Reset form when modal opens/closes or when editingUser changes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setUserForm({
          name: editingUser.name || '',
          pin: editingUser.pin || '',
          role: editingUser.role || 'worker'
        })
      } else {
        setUserForm({
          name: '',
          pin: '',
          role: 'worker'
        })
      }
    }
  }, [isOpen, editingUser])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(userForm)
  }

  const handleClose = () => {
    setUserForm({
      name: '',
      pin: '',
      role: 'worker'
    })
    onClose()
  }

  const isMobile = window.innerWidth <= 768

  // Don't render if not open
  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title || (editingUser ? 'Edit Team Member' : 'Add New Team Member')}
    >
      <div style={{ 
        padding: isMobile ? '0' : '1.5rem',
        background: 'transparent'
      }}>
        <form onSubmit={handleSubmit} className="space-y-4" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? '1.25rem' : '1rem' 
        }}>
          <Input
            label="Full Name"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            error={errors.name}
            placeholder="Enter full name"
            required
          />

          <Input
            label="PIN Code (4-6 digits)"
            value={userForm.pin}
            onChange={(e) => setUserForm({ ...userForm, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            error={errors.pin}
            placeholder="Enter 4-6 digit PIN"
            required
          />

          <CustomDropdown
            label="Role"
            value={userForm.role}
            onChange={(value) => setUserForm({ ...userForm, role: value })}
            options={[
              { value: 'worker', label: '👤 Worker', icon: <Users />, description: 'Regular employee access' },
              { value: 'admin', label: '👑 Administrator', icon: <Crown />, description: 'Full system access' }
            ]}
            placeholder="Select user role..."
            icon={<Shield />}
          />

          {/* Role Information Card */}
          <div style={{
            padding: isMobile ? '1rem' : '0.75rem',
            borderRadius: isMobile ? '0.875rem' : '0.5rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            backdropFilter: isMobile ? 'blur(8px)' : 'none'
          }}>
            <p style={{
              fontSize: isMobile ? '0.9rem' : '0.875rem',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              ℹ️ {userForm.role === 'admin' 
                ? 'Administrators have access to all stores and the admin dashboard.' 
                : 'Workers can choose any store to work at during login using their PIN.'}
            </p>
          </div>

          {/* Role Permissions Card */}
          <div style={{
            padding: isMobile ? '1.25rem' : '1rem',
            borderRadius: isMobile ? '0.875rem' : '0.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-secondary)',
            backdropFilter: isMobile ? 'blur(8px)' : 'none'
          }}>
            <h4 style={{
              fontSize: isMobile ? '0.95rem' : '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: isMobile ? '0.75rem' : '0.5rem'
            }}>
              Role Permissions
            </h4>
            <div style={{
              fontSize: isMobile ? '0.85rem' : '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              {userForm.role === 'admin' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <p>• Full access to admin dashboard</p>
                  <p>• Can manage products and team members</p>
                  <p>• Access to sales reports from all stores</p>
                  <p>• Can export data and manage shifts</p>
                  <p>• Can work at any store with admin privileges</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <p>• Access to worker dashboard</p>
                  <p>• Can record sales and manage shifts</p>
                  <p>• Can choose any store to work at during login</p>
                  <p>• View products catalog and process sales</p>
                  <p>• Limited to sales and shift activities only</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.75rem' : '0.75rem',
            paddingTop: isMobile ? '1.5rem' : '1rem',
            flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
          }}>
            <AddButton 
              type="submit" 
              disabled={loading} 
              loading={loading}
              className="flex-1"
              style={{ flex: window.innerWidth <= 480 ? 'none' : 1 }}
              icon={editingUser ? <Shield /> : <Users />}
              variant={editingUser ? "secondary" : "primary"}
            >
              {editingUser ? 'Update Member' : 'Add Member'}
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
        </form>
      </div>
    </Modal>
  )
}

export default UserFormModal
