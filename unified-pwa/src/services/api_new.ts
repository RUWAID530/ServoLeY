import axios from 'axios'
import {
  Service,
  Provider,
  Category,
  Offer,
  Transaction,
  PaymentMethod
} from '../types/Index'



// api_new.ts
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
});


// IMPORTANT:
// Do NOT mask network/server errors as a successful response.
// This was causing UI to show "Updated successfully" even when nothing was saved.

/* =========================
   REQUEST INTERCEPTOR
========================= */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log('API REQUEST:', {
      method: config.method,
      url: config.url,
      data: config.data
    })

    return config
  },
  (error) => Promise.reject(error)
)

/* =========================
   RESPONSE INTERCEPTOR
========================= */

// Flag to prevent multiple token refresh attempts
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

api.interceptors.response.use(
  (response) => {
    console.log('API RESPONSE:', response.data)
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    console.error('API ERROR:', error)
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch((err) => {
          return Promise.reject(err)
        })
      }
      
      originalRequest._retry = true
      isRefreshing = true
      
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }
        
        const response = await api.post('/api/auth/refresh', {
        refreshToken
    })

        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data
        
        // Store new tokens
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        
        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        
        // Process the queue with the new token
        processQueue(null, accessToken)
        
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Process the queue with the error
        processQueue(refreshError, null)
        
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('token')
        
        // Redirect to login page
        window.location.href = '/login'
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.'
    } else if (error.response) {
      error.message =
        error.response.data?.message ||
        `Server error: ${error.response.status}`
    } else if (error.request || error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      error.message = 'Network error. Backend not running or wrong port.'
    }

    return Promise.reject(error)
  }
)

/* =========================
   RETRY FUNCTION (KEPT)
========================= */

const retryRequest = async (
  fn: Function,
  retries = 2,
  delay = 1000
): Promise<any> => {
  try {
    return await fn()
  } catch (error: any) {
    // If it's a network error and we have retries left
    if (retries > 0 && !error.response && 
        (error.message.includes('Network Error') || 
         error.message.includes('Network error') ||
         error.message.includes('ERR_CONNECTION_REFUSED') ||
         error.message.includes('ERR_NETWORK') ||
         error.code === 'ERR_NETWORK' ||
         error.code === 'ERR_CONNECTION_REFUSED' ||
         (error.name === 'TypeError' && error.message.includes('Failed to fetch')))) {

      console.log(`Network error, retrying request... ${retries} attempts left`)
      await new Promise((res) => setTimeout(res, delay))
      return retryRequest(fn, retries - 1, delay * 2)
    }

    // For other errors or when no retries left, throw the error
    throw error
  }
}

/* =========================
   CATEGORIES
========================= */

export const getCategories = async (): Promise<Category[]> => {
  const res = await api.get('/categories')
  return res.data
}

/* =========================
   PROVIDERS
========================= */

export const getMyProviderProfile = async () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await res.json();
  return data;
}


export const getProviders = async (
  categoryId?: string
): Promise<Provider[]> => {
  const res = await api.get('/providers', {
    params: categoryId ? { category: categoryId } : {}
  })
  return res.data
}

export const getProviderById = async (id: string): Promise<Provider> => {
  const res = await api.get(`/providers/${id}`)
  return res.data
}

export const updateProvider = async (
  id: string,
  data: Partial<Provider>
): Promise<Provider> => {
  const res = await api.put(`/providers/${id}`, data)
  return res.data
}

/* =========================
   SERVICES
========================= */

export const getServices = async (
  providerId?: string
): Promise<Service[]> => {
  const res = await api.get('/api/services', {
    params: providerId ? { provider: providerId } : {}
  })
  const payload = res.data

  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data?.services)) return payload.data.services
  if (Array.isArray(payload?.services)) return payload.services
  if (Array.isArray(payload?.data)) return payload.data

  return []
}

/* =========================
   OFFERS
========================= */

export const getOffers = async (): Promise<Offer[]> => {
  const res = await api.get('/offers')
  return res.data
}

/* =========================
   TRANSACTIONS
========================= */

export const getTransactions = async (): Promise<Transaction[]> => {
  const res = await api.get('/transactions')
  return res.data
}

export const createTransaction = async (
  transaction: Partial<Transaction>
): Promise<Transaction> => {
  const res = await api.post('/transactions', transaction)
  return res.data
}

/* =========================
   PAYMENT METHODS
========================= */

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const res = await api.get('/payment-methods')
  return res.data
}

export const addPaymentMethod = async (
  method: Partial<PaymentMethod>
): Promise<PaymentMethod> => {
  const res = await api.post('/payment-methods', method)
  return res.data
}

export const deletePaymentMethod = async (id: string): Promise<void> => {
  await api.delete(`/payment-methods/${id}`)
}

/* =========================
   USER PROFILE
========================= */

export const getUserProfile = async () => {
  const res = await api.get('/user/profile')
  return res.data
}

export const updateUserProfile = async (profile: any) => {
  const res = await api.put('/user/profile', profile)
  return res.data
}

/* =========================
   AUTH
========================= */

export const login = async (phone: string, password: string, userType: string) => {
  console.log('🌐 API Login - Request:', { phone, password, userType });
  
  const res = await api.post('/api/auth/login', { phone, password, userType })
  
  console.log('🌐 API Login - Full response:', res);
  console.log('🌐 API Login - Response data:', res.data);
  console.log('🌐 API Login - Response structure:', {
    hasData: !!res.data,
    hasDataData: !!res.data?.data,
    hasAccessToken: !!res.data?.data?.accessToken,
    success: res.data?.success
  });

  // Store tokens directly since we removed OTP
  if (res.data?.data?.accessToken) {
    console.log('🔐 Storing tokens:', {
      accessToken: res.data.data.accessToken.substring(0, 20) + '...',
      refreshToken: res.data.data.refreshToken.substring(0, 20) + '...'
    });
    localStorage.setItem('accessToken', res.data.data.accessToken)
    localStorage.setItem('refreshToken', res.data.data.refreshToken)
    localStorage.setItem('token', res.data.data.accessToken)
  } else {
    console.log('❌ No access token found in response!');
  }

  return res.data
}

// Forgot password - send OTP
export const forgotPassword = async (phone: string, userType: string) => {
  console.log('🌐 API Forgot Password - Request:', { phone, userType });
  
  const res = await api.post('/api/auth/forgot-password', { phone, userType })
  
  console.log('🌐 API Forgot Password - Response:', res.data);
  
  return res.data
}

// Reset password with OTP
export const resetPassword = async (phone: string, otp: string, newPassword: string, confirmPassword: string) => {
  console.log('🌐 API Reset Password - Request:', { phone, otp, newPasswordLength: newPassword.length });
  
  const res = await api.post('/api/auth/reset-password', { 
    phone, 
    otp, 
    newPassword, 
    confirmPassword 
  })
  
  console.log('🌐 API Reset Password - Response:', res.data);
  
  return res.data
}

// Verify OTP and get tokens
export const verifyOTP = async (userId: string, code: string) => {
  const res = await api.post('/api/auth/verify-otp', { userId, code })

  if (res.data?.data?.accessToken) {
    localStorage.setItem('accessToken', res.data.data.accessToken)
    localStorage.setItem('refreshToken', res.data.data.refreshToken)
    // Keep backward compatibility
    localStorage.setItem('token', res.data.data.accessToken)
  }

  return res.data
}

export const signup = async (userData: any) => {
  const res = await api.post('/api/auth/register', userData)
  return res.data
}

export const logout = async () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('token')
}

/* =========================
   FALLBACK SERVICE (KEPT)
========================= */

export const apiServiceWithFallback = {
  get: async (url: string) => {
    try {
      const res = await retryRequest(() => api.get(url))
      return { success: true, data: res.data }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: null
      }
    }
  },

  post: async (url: string, data?: any) => {
    try {
      const res = await retryRequest(() => api.post(url, data))
      return { success: true, data: res.data }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: null
      }
    }
  },

  put: async (url: string, data?: any) => {
    try {
      const res = await retryRequest(() => api.put(url, data))
      return { success: true, data: res.data }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: null
      }
    }
  },

  delete: async (url: string) => {
    try {
      const res = await retryRequest(() => api.delete(url))
      return { success: true, data: res.data }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: null
      }
    }
  }
}
