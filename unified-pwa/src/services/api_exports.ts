import { apiServiceWithFallback } from './api_new';

// All functions here call the real backend only.
// No mock or offline placeholder data is returned.

export const getProviderProfile = async () => {
  return apiServiceWithFallback.get('/api/provider/me');
};

export const updateProviderProfile = async (data: any) => {
  return apiServiceWithFallback.put('/api/provider/profile', data);
};

export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append('image', file); // Match backend field name
  
  // Use the base api instance directly to handle FormData properly
  return api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => ({ success: true, data: res.data }))
    .catch(error => ({ 
      success: false, 
      message: error.message,
      data: null 
    }));
};

// Store avatar as a string (URL or data URL) in Profile.avatar
export const uploadProviderPhoto = (avatar: string) => {
  return apiServiceWithFallback.post('/api/provider/photo', { avatar });
};

export const removeProviderPhoto = () => {
  return apiServiceWithFallback.delete('/api/provider/photo');
};

export const getOffers = () => {
  return apiServiceWithFallback.get('/api/offers');
};

export const updateUserProfile = (id: string, data: any) => {
  return apiServiceWithFallback.put(`/api/users/${id}`, data);
};

export const listService = (data: any) => {
  return apiServiceWithFallback.post('/api/provider/services', data);
};
