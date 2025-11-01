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
  providerId: string
  providerName: string
  providerBusinessName?: string
}

interface OrderForm {
  details: string;
  quantity: number;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [orderForm, setOrderForm] = useState<OrderForm>({
    details: '',
    quantity: 1
  })
  const [message, setMessage] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<'CUSTOMER' | 'PROVIDER' | null>(null)
  const [isProvider, setIsProvider] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    isActive: true
  })
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  useEffect(() => {
    fetchServices()
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    const token = localStorage.getItem('token')
    const type = localStorage.getItem('userType')
    setIsAuthenticated(!!token)
    setUserType(type as 'CUSTOMER' | 'PROVIDER' | null)
    setIsProvider(type === 'PROVIDER')
  }

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = isProvider 
        ? `${API_BASE}/api/provider/services`
        : `${API_BASE}/api/services`

      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      const data = await response.json()
      if (data.success) {
        setServices(data.data)
        // Extract unique categories
        const uniqueCategories = [...new Set(data.data.map((service: Service) => service.category))]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService) return

    if (!isAuthenticated || userType !== 'CUSTOMER') {
      setMessage('Please sign up as a customer to order a service')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          details: orderForm.details,
          quantity: orderForm.quantity
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage('Order placed successfully!')
        setSelectedService(null)
        setOrderForm({ details: '', quantity: 1 })
      } else {
        setMessage(data.message || 'Failed to place order')
      }
    } catch (error) {
      setMessage('Error placing order. Please try again.')
      console.error('Error placing order:', error)
    }
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
    setIsCreating(false)
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

  const filteredServices = selectedCategory === 'All' 
    ? services 
    : services.filter(service => service.category === selectedCategory)

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Services</h1>
        <div className="flex gap-2 sm:gap-4">
          {!isAuthenticated && (
            <Link to="/login-signup" className="text-blue-600 hover:underline text-sm sm:text-base">Sign Up / Login</Link>
          )}
          {isProvider && (
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Add New Service
            </button>
          )}
          {isAuthenticated && (
            <Link to="/dashboard" className="text-blue-600 hover:underline text-sm sm:text-base">Back to Dashboard</Link>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Please <Link to="/login-signup" className="font-medium underline">sign up or login</Link> to order services or list your own services.
              </p>
            </div>
          </div>
        </div>
      )}

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
      ) : selectedService ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-medium">{selectedService.title}</h2>
              <p className="text-gray-600">{selectedService.description}</p>
              <p className="text-gray-500 mt-2">Provider: {selectedService.providerName}{selectedService.providerBusinessName && ` - ${selectedService.providerBusinessName}`}</p>
              <p className="text-lg font-bold mt-2">${selectedService.price.toFixed(2)} per unit</p>
              <p className="text-sm text-gray-500">Duration: {selectedService.duration} minutes</p>
            </div>
            <button
              onClick={() => setSelectedService(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Back to Services
            </button>
          </div>

          <form onSubmit={handleOrderService}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={orderForm.quantity}
                onChange={(e) => setOrderForm({...orderForm, quantity: parseInt(e.target.value) || 1})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="details">
                Order Details
              </label>
              <textarea
                id="details"
                value={orderForm.details}
                onChange={(e) => setOrderForm({...orderForm, details: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                placeholder="Please provide any specific details for your order..."
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Place Order
              </button>
              <div className="text-lg font-bold">
                Total: ${(selectedService.price * orderForm.quantity).toFixed(2)}
              </div>
            </div>

            {message && <p className={`mt-4 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
          </form>
        </div>
      ) : (
        <>
          {categories.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Filter by Category</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedCategory === 'All' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category: string) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      selectedCategory === category 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium">{service.title}</h3>
                    {isProvider && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <p className="text-sm text-gray-500 mb-4">Provider: {service.providerName}{service.providerBusinessName && ` - ${service.providerBusinessName}`}</p>
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
                    {isProvider ? (
                      <>
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
                      </>
                    ) : (
                      <button
                        onClick={() => setSelectedService(service)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                      >
                        Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              {isProvider ? (
                <>
                  <p>No services listed yet.</p>
                  <button
                    onClick={handleCreate}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                  >
                    Create Your First Service
                  </button>
                </>
              ) : (
                <p>No services available in this category at the moment.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}