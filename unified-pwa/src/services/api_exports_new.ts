import { apiServiceWithFallback } from './api_new';

// Export commonly used functions with real API calls only
export const getProviderProfile = async () => {
  try {
    // Try real API
    const response = await apiServiceWithFallback.get('/api/provider/me');
    if (response.success) {
      return response;
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch provider profile',
      data: null
    };
  } catch (error: any) {
    console.error('Error fetching provider profile:', error);

    // Check if it's a network error
    if (error.message && (error.message.includes('Network error') || 
        error.message.includes('Backend not running') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NETWORK'))) {

      return {
        success: false,
        message: 'Cannot connect to server. Please make sure the backend server is running on localhost:8086',
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
    // Try real API
    const response = await apiServiceWithFallback.put('/api/provider/profile', data);
    if (response.success) {
      return response;
    }

    return {
      success: false,
      message: response.message || 'Failed to update provider profile',
      data: null
    };
  } catch (error: any) {
    console.error('Error updating provider profile:', error);

    // Check if it's a network error
    if (error.message && (error.message.includes('Network error') || 
        error.message.includes('Backend not running') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NETWORK'))) {

      return {
        success: false,
        message: 'Cannot connect to server. Please make sure the backend server is running on localhost:8086',
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
export const uploadProviderPhoto = (avatar: string) => {
  // Real photo upload
  return apiServiceWithFallback.post('/api/provider/photo', { avatar });
};

export const removeProviderPhoto = () => {
  // Real photo removal
  return apiServiceWithFallback.delete('/api/provider/photo');
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
  return apiServiceWithFallback.post('/api/provider/services', data);
};
