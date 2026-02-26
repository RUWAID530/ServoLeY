import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

export interface ProviderRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  dob: string;
  providerType: 'freelancer' | 'shop';
  businessName: string;
  businessAddress: string;
  businessDescription?: string;
  profilePhoto?: File;
  idProof: File;
  addressProof: File;
  businessProof?: File;
}

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  providerType: 'freelancer' | 'shop';
  businessName: string;
  businessAddress: string;
  businessDescription?: string;
  profilePhoto?: string;
  isVerified: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

class ProviderService {
  // Register new provider
  async registerProvider(data: ProviderRegistrationData): Promise<{ message: string; provider?: Provider }> {
    try {
      const formData = new FormData();
      
      // Add all text fields
      Object.keys(data).forEach(key => {
        if (key !== 'profilePhoto' && key !== 'idProof' && key !== 'addressProof' && key !== 'businessProof') {
          formData.append(key, data[key as keyof ProviderRegistrationData]);
        }
      });

      // Add files
      if (data.profilePhoto) {
        formData.append('profilePhoto', data.profilePhoto);
      }
      if (data.idProof) {
        formData.append('idProof', data.idProof);
      }
      if (data.addressProof) {
        formData.append('addressProof', data.addressProof);
      }
      if (data.businessProof) {
        formData.append('businessProof', data.businessProof);
      }

      const response = await axios.post(`${API_BASE_URL}/providers/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/providers/verify-email/${token}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/providers/resend-verification`, 
        { email },
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to resend verification email');
    }
  }

  // Login provider
  async loginProvider(email: string, password: string): Promise<{ provider: Provider; token: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/providers/login`, 
        { email, password },
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  // Get provider profile
  async getProviderProfile(): Promise<Provider> {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_ORIGIN}/api/auth/me`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch provider profile');
      }
      
      return data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch provider profile');
    }
  }

  // Update provider profile
  async updateProviderProfile(data: Partial<Provider>): Promise<Provider> {
    try {
      const response = await axios.put(`${API_BASE_URL}/providers/profile`, 
        data,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  // Upload additional documents
  async uploadDocument(file: File, documentType: string): Promise<{ message: string }> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      const response = await axios.post(`${API_BASE_URL}/providers/upload-document`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Document upload failed');
    }
  }

  // Check verification status
  async checkVerificationStatus(): Promise<{ isVerified: boolean; isEmailVerified: boolean; verificationStatus: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/providers/verification-status`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check verification status');
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/providers/request-password-reset`, 
        { email },
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to request password reset');
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/providers/reset-password/${token}`, 
        { newPassword },
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  }

  // Logout provider
  async logout(): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/providers/logout`, 
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Logout failed');
    }
  }
}

export const providerService = new ProviderService();
