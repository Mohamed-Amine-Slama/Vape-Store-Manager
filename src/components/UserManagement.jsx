import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Select, Modal, Badge } from './ui'
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Users, 
  Crown, 
  Shield, 
  Calendar,
  Activity,
  Search,
  Filter,
  Eye,
  MoreVertical
} from 'lucide-react'
import './UserManagement.css'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)

  const [userForm, setUserForm] = useState({
    name: '',
    pin: '',
    role: 'worker'
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await loadUsers()
  }


  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('store_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Calculate user stats (removed shifts, sales, revenue)
      const usersWithStats = (data || []).map(user => ({
        ...user,
        lastActivity: null // Removed shift-based activity tracking
      }))
      
      setUsers(usersWithStats)
    } catch (error) {
      console.error('Error loading users:', error)
    }
    setLoading(false)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!userForm.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!userForm.pin.trim()) {
      newErrors.pin = 'PIN is required'
    } else if (!/^\d{4,6}$/.test(userForm.pin)) {
      newErrors.pin = 'PIN must be 4-6 digits'
    } else {
      // Check if PIN is already taken (excluding current user when editing)
      const existingUser = users.find(user => 
        user.pin === userForm.pin && user.id !== editingUser?.id
      )
      if (existingUser) {
        newErrors.pin = 'PIN is already taken'
      }
    }

    // Note: Workers are not assigned to specific stores - they can work at any store with their PIN

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          name: userForm.name.trim(),
          pin: userForm.pin,
          role: userForm.role,
          store_id: null // All workers can work at any store
        }

        console.log('🔍 Updating user with data:', { updateData, userId: editingUser.id })

        const { error } = await supabase
          .from('store_users')
          .update(updateData)
          .eq('id', editingUser.id)

        if (error) throw error
      } else {
        // Create new user
        const insertData = {
          name: userForm.name.trim(),
          pin: userForm.pin,
          role: userForm.role,
          store_id: null // All workers can work at any store
        }

        console.log('🔍 Creating new user with data:', insertData)

        const { error } = await supabase
          .from('store_users')
          .insert([insertData])

        if (error) throw error
      }

      await loadUsers()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving user:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save user'
      if (error.code === '23505') {
        errorMessage = 'PIN already exists. Please choose a different PIN.'
      } else if (error.message) {
        errorMessage = `Failed to save user: ${error.message}`
      }
      
      alert(errorMessage)
    }
    setLoading(false)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setUserForm({
      name: user.name,
      pin: user.pin,
      role: user.role
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const handleDelete = async (userId) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('store_users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      await loadUsers()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
    setLoading(false)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setUserForm({ name: '', pin: '', role: 'worker' })
    setErrors({})
  }

  const handleAddNew = () => {
    setEditingUser(null)
    setUserForm({ name: '', pin: '', role: 'worker' })
    setErrors({})
    setIsModalOpen(true)
  }

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.pin.includes(searchTerm)
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getUserRoleIcon = (role) => {
    return role === 'admin' ? Crown : Shield
  }

  const getUserGradient = (role) => {
    return role === 'admin' 
      ? 'from-amber-500 to-orange-600' 
      : 'from-blue-500 to-purple-600'
  }

  if (loading && users.length === 0) {
    return (
      <div className="um-container">
        <div className="um-header">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Team Management</h2>
              <p className="text-sm text-gray-600">Manage your store workers and administrators</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="um-stats-card animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        <div className="um-glass-card animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="um-container">
      {/* Enhanced Header */}
      <div className="um-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Team Management</h2>
              <p className="text-sm text-gray-600">Manage your store workers and administrators</p>
            </div>
          </div>
          
          <Button
            onClick={handleAddNew}
            className="flex items-center space-x-2 admin-btn hover-lift click-scale"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Team Member</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="um-stats-card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Team Members</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="um-stats-card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Administrators</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'admin').length}</p>
            </div>
          </div>
        </div>
        
        <div className="um-stats-card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Workers</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'worker').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="um-glass-card mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or PIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="worker">Workers</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              {/* Store filter removed - all workers can access any store */}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} team members
          </div>
        </div>
      </div>

      {/* Team Members Grid and Performance Table */}
      {filteredUsers.length === 0 ? (
        <div className="um-glass-card text-center py-16">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || roleFilter !== 'all' ? 'No matching team members' : 'No team members found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || roleFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Add your first team member to get started.'}
          </p>
          {!searchTerm && roleFilter === 'all' && (
            <Button onClick={handleAddNew} className="admin-btn">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="um-performance-table mb-6">
            <table>
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const RoleIcon = getUserRoleIcon(user.role)
                  
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${getUserGradient(user.role)} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">PIN: {user.pin}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <RoleIcon className="h-4 w-4 text-gray-500" />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="um-performance-cards">
            {filteredUsers.map((user) => {
              const RoleIcon = getUserRoleIcon(user.role)
              
              return (
                <div key={user.id} className="um-performance-card">
                  <div className="um-performance-card-header">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getUserGradient(user.role)} rounded-xl flex items-center justify-center text-white font-bold`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="um-performance-card-name">{user.name}</div>
                        <div className="text-sm text-gray-500">PIN: {user.pin}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RoleIcon className="h-4 w-4 text-gray-500" />
                      <span className={`um-performance-card-role ${
                        user.role === 'admin' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="um-performance-card-stats">
                    <div className="um-performance-stat">
                      <div className="um-performance-stat-value">{user.role}</div>
                      <div className="um-performance-stat-label">Role</div>
                    </div>
                    <div className="um-performance-stat">
                      <div className="um-performance-stat-value">{new Date(user.created_at).toLocaleDateString()}</div>
                      <div className="um-performance-stat-label">Joined</div>
                    </div>
                  </div>

                  <div className="um-performance-card-details">
                    <div className="um-performance-detail">
                      <span className="um-performance-detail-label">PIN:</span>
                      <span className="um-performance-detail-value font-mono">{user.pin}</span>
                    </div>
                    <div className="um-performance-detail">
                      <span className="um-performance-detail-label">Access Level:</span>
                      <span className="um-performance-detail-value">
                        {user.role === 'admin' ? 'Full Admin Access' : 'Worker Access'}
                      </span>
                    </div>
                    <div className="um-performance-detail">
                      <span className="um-performance-detail-label">Created:</span>
                      <span className="um-performance-detail-value">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legacy Grid View (kept for backward compatibility) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" style={{display: 'none'}}>
            {filteredUsers.map((user) => {
              const RoleIcon = getUserRoleIcon(user.role)
              const gradient = getUserGradient(user.role)
              
              return (
                <div key={user.id} className="um-team-member-card">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <div className="flex items-center space-x-2 mb-1">
                          <RoleIcon className="h-3 w-3 text-gray-500" />
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        {user.role === 'admin' && (
                          <div className="text-xs text-gray-500">
                            🌐 All Stores Access
                          </div>
                        )}
                        {user.role === 'worker' && (
                          <div className="text-xs text-gray-500">
                            🔑 Multi-Store Access
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">PIN:</span>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{user.pin}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Access Level:</span>
                      <span className="text-sm font-semibold">{user.role === 'admin' ? 'Full Admin' : 'Worker'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Joined:</span>
                      <span className="text-sm text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`${selectedUser.name} - Profile Details`}
        >
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${getUserGradient(selectedUser.role)} rounded-xl flex items-center justify-center text-white font-bold text-xl`}>
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  {React.createElement(getUserRoleIcon(selectedUser.role), { className: "h-4 w-4 text-gray-500" })}
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    selectedUser.role === 'admin' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedUser.role === 'admin' ? 'Administrator' : 'Worker'}
                  </span>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                  {React.createElement(getUserRoleIcon(selectedUser.role), { className: "h-5 w-5 text-white" })}
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Role & Access</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedUser.role === 'admin' ? 'Administrator' : 'Worker'}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">PIN Code</span>
                <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">{selectedUser.pin}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Role</span>
                <span className="text-sm font-semibold">{selectedUser.role === 'admin' ? 'Administrator' : 'Worker'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Access Level</span>
                <span className="text-sm text-gray-900">
                  {selectedUser.role === 'admin' ? 'Full Admin Access' : 'Worker Access'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600">Member Since</span>
                <span className="text-sm text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={() => {
                  setSelectedUser(null)
                  handleEdit(selectedUser)
                }}
                variant="primary"
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
              <Button
                onClick={() => setSelectedUser(null)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? 'Edit Team Member' : 'Add New Team Member'}
      >
        <div style={{ 
          padding: window.innerWidth <= 768 ? '0' : '1.5rem',
          background: window.innerWidth <= 768 
            ? 'transparent' 
            : 'transparent'
        }}>
          <form onSubmit={handleSubmit} className="space-y-4" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: window.innerWidth <= 768 ? '1.25rem' : '1rem' 
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

            <Select
              label="Role"
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              options={[
                { value: 'worker', label: 'Worker' },
                { value: 'admin', label: 'Administrator' }
              ]}
            />

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg" style={{
              padding: window.innerWidth <= 768 ? '1rem' : '0.75rem',
              borderRadius: window.innerWidth <= 768 ? '0.875rem' : '0.5rem',
              backgroundColor: 'rgba(239, 246, 255, 0.8)',
              border: '1px solid rgba(147, 197, 253, 0.3)',
              backdropFilter: window.innerWidth <= 768 ? 'blur(8px)' : 'none'
            }}>
              <p className="text-sm text-blue-800" style={{
                fontSize: window.innerWidth <= 768 ? '0.9rem' : '0.875rem',
                lineHeight: 1.5,
                color: '#1e40af',
                fontWeight: '500'
              }}>
                ℹ️ {userForm.role === 'admin' 
                  ? 'Administrators have access to all stores and the admin dashboard.' 
                  : 'Workers can choose any store to work at during login using their PIN.'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" style={{
              padding: window.innerWidth <= 768 ? '1.25rem' : '1rem',
              borderRadius: window.innerWidth <= 768 ? '0.875rem' : '0.5rem',
              backgroundColor: 'rgba(239, 246, 255, 0.6)',
              border: '1px solid rgba(147, 197, 253, 0.3)',
              backdropFilter: window.innerWidth <= 768 ? 'blur(8px)' : 'none'
            }}>
              <h4 className="text-sm font-medium text-blue-900 mb-2" style={{
                fontSize: window.innerWidth <= 768 ? '0.95rem' : '0.875rem',
                fontWeight: '600',
                color: '#1e3a8a',
                marginBottom: window.innerWidth <= 768 ? '0.75rem' : '0.5rem'
              }}>
                Role Permissions
              </h4>
              <div className="text-xs text-blue-700 space-y-1" style={{
                fontSize: window.innerWidth <= 768 ? '0.85rem' : '0.75rem',
                color: '#1d4ed8',
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

            <div className="flex space-x-3 pt-4" style={{
              display: 'flex',
              gap: window.innerWidth <= 768 ? '0.75rem' : '0.75rem',
              paddingTop: window.innerWidth <= 768 ? '1.5rem' : '1rem',
              flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
            }}>
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 admin-btn"
                style={{ flex: window.innerWidth <= 480 ? 'none' : 1 }}
              >
                {loading ? 'Saving...' : editingUser ? 'Update Member' : 'Add Member'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal} 
                className="flex-1"
                style={{ flex: window.innerWidth <= 480 ? 'none' : 1 }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Remove Team Member"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h4 className="font-medium text-red-900">Permanent Action</h4>
              <p className="text-sm text-red-700">This action cannot be undone</p>
            </div>
          </div>
          
          <p className="text-gray-600">
            Are you sure you want to remove <strong>{deleteConfirm?.name}</strong> from your team? 
            This will permanently delete:
          </p>
          
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• User account and login access</li>
            <li>• User profile and role permissions</li>
            <li>• PIN code and authentication data</li>
          </ul>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="danger"
              onClick={() => handleDelete(deleteConfirm.id)}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Removing...' : 'Remove Team Member'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
