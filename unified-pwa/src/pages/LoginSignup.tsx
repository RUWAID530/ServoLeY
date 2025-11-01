import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../App'

export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true)
  const [userType, setUserType] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    address: ''
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    // Validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const url = isLogin 
        ? `${API_BASE}/api/auth/login` 
        : `${API_BASE}/api/auth/register`

      const body = isLogin 
        ? { email: formData.email, password: formData.password, userType }
        : { 
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            userType,
            ...(userType === 'PROVIDER' && { businessName: formData.businessName, address: formData.address })
          }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userType', userType)
        localStorage.setItem('userId', data.user.id)
        setMessage(isLogin ? 'Login successful!' : 'Registration successful!')

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        setMessage(data.message || (isLogin ? 'Login failed' : 'Registration failed'))
      }
    } catch (error) {
      setMessage(`Error: ${isLogin ? 'Login' : 'Registration'} failed. Please try again.`)
      console.error('Authentication error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {isLogin ? 'create a new account' : 'sign in to your existing account'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!isLogin && (
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <div className="flex rounded-md bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setUserType('CUSTOMER')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      userType === 'CUSTOMER'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('PROVIDER')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      userType === 'PROVIDER'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    Service Provider
                  </button>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {userType === 'PROVIDER' && (
                  <>
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                        Business Name
                      </label>
                      <div className="mt-1">
                        <input
                          id="businessName"
                          name="businessName"
                          type="text"
                          required
                          value={formData.businessName}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Business Address
                      </label>
                      <div className="mt-1">
                        <input
                          id="address"
                          name="address"
                          type="text"
                          required
                          value={formData.address}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {message && (
              <div className={`rounded-md p-4 ${message.includes('success') ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className={`text-sm ${message.includes('success') ? 'text-green-800' : 'text-red-800'}`}>
                  {message}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue as</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link to="/services" className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Browse Services
              </Link>
              <Link to="/" className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}