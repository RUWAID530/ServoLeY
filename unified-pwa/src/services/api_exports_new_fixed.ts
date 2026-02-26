import { apiServiceWithFallback } from './api_new';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

// Export commonly used functions with real API calls only
export const getProviderProfile = async () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found',
        data: null
      };
    }

    // Try real API with /api/auth/me
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: 'Profile fetched successfully',
        data: data.data
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to fetch provider profile',
      data: null
    };
  } catch (error: any) {
    console.error('Error fetching provider profile:', error);

    // Check if it's a network error
    if (error.message && (error.message.includes('Network error') || 
        error.message.includes('Backend not running') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NETWORK')) ||
        (error.name === 'TypeError' && error.message.includes('Failed to fetch'))) {

      return {
        success: false,
        message: 'Cannot connect to server. Please make sure VITE_API_URL points to a running backend.',
        data: null
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to fetch provider profile',
      data: null
    };
  }
};

export const updateProviderProfile = async (data: any) => {
  try {
    // Get user-specific token
    const userId = localStorage.getItem('userId');
    const sessionId = localStorage.getItem('currentSessionId') || 'default';
    const token = localStorage.getItem(`token_${userId}_${sessionId}`) || localStorage.getItem('token') || localStorage.getItem('accessToken');
    
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found',
        data: null
      };
    }

    const response = await fetch(`${API_BASE}/api/provider/profile`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      return {
        success: true,
        message: 'Profile updated successfully',
        data: result.data
      };
    }

    return {
      success: false,
      message: result.message || 'Failed to update provider profile',
      data: null
    };
  } catch (error: any) {
    console.error('Error updating provider profile:', error);

    // Check if it's a network error
    if (error.message && (error.message.includes('Network error') || 
        error.message.includes('Backend not running') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NETWORK')) ||
        (error.name === 'TypeError' && error.message.includes('Failed to fetch'))) {

      return {
        success: false,
        message: 'Cannot connect to server. Please make sure VITE_API_URL points to a running backend.',
        data: null
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to update provider profile',
      data: null
    };
  }
};

export const uploadImage = (file: File) => {
  // Real image upload
  return apiServiceWithFallback.post('/api/upload', { file });
};

// Store avatar as a string (URL or data URL) in Profile.avatar
export const uploadProviderPhoto = async (avatar: string) => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found',
        data: null
      };
    }

    const response = await fetch(`${API_BASE}/api/provider/profile`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ avatar })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      return {
        success: true,
        message: 'Avatar uploaded successfully',
        data: result.data
      };
    }

    return {
      success: false,
      message: result.message || 'Failed to upload avatar',
      data: null
    };
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return {
      success: false,
      message: error.message || 'Failed to upload avatar',
      data: null
    };
  }
};

export const removeProviderPhoto = async () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found',
        data: null
      };
    }

    const response = await fetch(`${API_BASE}/api/provider/profile`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ avatar: '' })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      return {
        success: true,
        message: 'Avatar removed successfully',
        data: result.data
      };
    }

    return {
      success: false,
      message: result.message || 'Failed to remove avatar',
      data: null
    };
  } catch (error: any) {
    console.error('Error removing avatar:', error);
    return {
      success: false,
      message: error.message || 'Failed to remove avatar',
      data: null
    };
  }
};

export const getOffers = () => {
  // Real offers API
  return apiServiceWithFallback.get('/api/offers');
};

export const updateUserProfile = (id: string, data: any) => {
  // Real user update
  return apiServiceWithFallback.put(`/api/users/${id}`, data);
};

export const listService = (data: any) => {
  // Real service listing
  console.log('🔍 Frontend creating service with data:', data);
  
  const response = apiServiceWithFallback.post('/api/provider/services', data);
  
  // Add logging for response
  response.then(res => {
    console.log('✅ Service creation response:', res);
  }).catch(err => {
    console.error('❌ Service creation error:', err);
  });
  
  return response;
};
