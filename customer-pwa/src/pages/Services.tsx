import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
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

  React.useEffect(() => {
    fetchServices()
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    setIsAuthenticated(!!(token && userType === 'CUSTOMER'))
  }

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token')
      // First try to get all available services (without authentication)
      const response = await fetch(`${API_BASE}/api/services/all`)
      const data = await response.json()

      if (data.success) {
        setServices(data.data)
      } else {
        // Fallback to customer-specific endpoint if available
        const customerResponse = await fetch(`${API_BASE}/api/customer/services`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const customerData = await customerResponse.json()
        if (customerData.success) {
          setServices(customerData.data)
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      // Try with customer endpoint as fallback
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/api/customer/services`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        if (data.success) {
          setServices(data.data)
        }
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOrderService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService) return
    
    if (!isAuthenticated) {
      setMessage('Please sign up or login to order a service')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/customer/orders`, {
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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Services</h1>
        <div className="flex gap-2 sm:gap-4">
          {!isAuthenticated && (
            <Link to="/customer-login-signup" className="text-blue-600 hover:underline text-sm sm:text-base">Sign Up / Login</Link>
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
                Please <Link to="/customer-login-signup" className="font-medium underline">sign up or login</Link> to order services.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading services...</p>
        </div>
      ) : (
        <>
          {selectedService ? (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-medium">{selectedService.name}</h2>
                  <p className="text-gray-600">{selectedService.description}</p>
                  <p className="text-lg font-bold mt-2">${selectedService.price.toFixed(2)} per unit</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h2 className="text-xl font-medium mb-2">{service.name}</h2>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">${service.price.toFixed(2)}</span>
                      {isAuthenticated ? (
                        <button
                          onClick={() => setSelectedService(service)}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                        >
                          Order
                        </button>
                      ) : (
                        <Link
                          to="/customer-login-signup"
                          className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-center"
                        >
                          Sign Up to Order
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {services.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p>No services available at the moment.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
