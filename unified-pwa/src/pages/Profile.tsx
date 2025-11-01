import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

interface User {
  id: string
  name: string
  email: string
  phone: string
  userType: 'CUSTOMER' | 'PROVIDER'
  businessName?: string
  address?: string
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    address: ''
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setUser(data.data)
        setFormData({
          name: data.data.name,
          email: data.data.email,
          phone: data.data.phone,
          businessName: data.data.businessName || '',
          address: data.data.address || ''
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        setUser(data.data)
        setMessage('Profile updated successfully!')
        setEditMode(false)
      } else {
        setMessage(data.message || 'Failed to update profile')
      }
    } catch (error) {
      setMessage('Error updating profile. Please try again.')
      console.error('Error updating profile:', error)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessName: user.businessName || '',
        address: user.address || ''
      })
    }
    setEditMode(false)
    setMessage('')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  const isProvider = user?.userType === 'PROVIDER'

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        <div className="p-6">
          {!editMode ? (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="mt-1 text-sm text-gray-900">{user?.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Type</p>
                      <p className="mt-1 text-sm text-gray-900">{isProvider ? 'Service Provider' : 'Customer'}</p>
                    </div>
                    {isProvider && (
                      <>
                        {user?.businessName && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Business Name</p>
                            <p className="mt-1 text-sm text-gray-900">{user.businessName}</p>
                          </div>
                        )}
                        {user?.address && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Business Address</p>
                            <p className="mt-1 text-sm text-gray-900">{user.address}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Profile</h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  {isProvider && (
                    <>
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessName">
                          Business Name
                        </label>
                        <input
                          id="businessName"
                          name="businessName"
                          type="text"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                          Business Address
                        </label>
                        <input
                          id="address"
                          name="address"
                          type="text"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>
                    </>
                  )}
                </div>

                {message && (
                  <div className={`mb-4 rounded-md p-4 ${message.includes('success') ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-sm ${message.includes('success') ? 'text-green-800' : 'text-red-800'}`}>
                      {message}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}