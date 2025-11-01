import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

interface Service {
  id: string
  title: string
  description: string
  price: number
  duration: number // in minutes
  isActive: boolean
  category: string
  imageUrl?: string
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    isActive: true
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/provider/services`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setServices(data.data)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
      isActive: service.isActive
    })
  }

  const handleCreate = () => {
    setEditingService(null)
    setFormData({
      title: '',
      description: '',
      price: '',
      duration: '',
      category: '',
      isActive: true
    })
    setIsCreating(true)
  }

  const handleCancel = () => {
    setEditingService(null)
    setIsCreating(false)
    setMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.price || !formData.duration || !formData.category) {
      setMessage('Please fill in all required fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const url = editingService 
        ? `${API_BASE}/api/provider/services/${editingService.id}`
        : `${API_BASE}/api/provider/services`
      
      const method = editingService ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
          category: formData.category,
          isActive: formData.isActive
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage(editingService ? 'Service updated successfully!' : 'Service created successfully!')
        fetchServices()
        handleCancel()
      } else {
        setMessage(data.message || 'Failed to save service')
      }
    } catch (error) {
      setMessage('Error saving service. Please try again.')
      console.error('Error saving service:', error)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/provider/services/${id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchServices()
      } else {
        console.error('Failed to toggle service status')
      }
    } catch (error) {
      console.error('Error toggling service status:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/provider/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchServices()
      } else {
        console.error('Failed to delete service')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  const categories: string[] = [...new Set(services.map((service: Service) => service.category))] as string[]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Services</h1>
        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Add New Service
          </button>
          <Link to="/inbox" className="text-blue-600 hover:underline">Back to Inbox</Link>
        </div>
      </div>
      
      {(editingService || isCreating) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">
            {editingService ? 'Edit Service' : 'Create New Service'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Service Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                  Category *
                </label>
                <input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                  Price ($) *
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
                  Duration (minutes) *
                </label>
                <input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
              />
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">Active</span>
              </label>
            </div>
            
            {message && <p className={`mb-4 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
            
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
                {editingService ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading services...</p>
        </div>
      ) : services.length > 0 ? (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Filter by Category</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {}}
                className="px-3 py-1 text-sm rounded-full bg-blue-600 text-white"
              >
                All Categories
              </button>
              {categories.map((category: string) => (
                <button
                  key={category}
                  onClick={() => {}}
                  className="px-3 py-1 text-sm rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium">{service.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-lg font-bold">${service.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{service.duration} minutes</p>
                    </div>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      {service.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleToggleStatus(service.id, service.isActive)}
                        className={`text-sm ${
                          service.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {service.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No services</h3>
          <p className="mt-1 text-gray-500">You haven't created any services yet.</p>
          <div className="mt-6">
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Your First Service
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
