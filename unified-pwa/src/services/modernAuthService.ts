// Modern Authentication Service
import { API_BASE } from '../config/api';

// Types
export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  userType: 'CUSTOMER' | 'PROVIDER';
  businessName?: string;
  businessCategory?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
  userType: 'CUSTOMER' | 'PROVIDER';
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  userType: 'CUSTOMER' | 'PROVIDER';
  businessName?: string;
  businessCategory?: string;
}

// API Class
class ModernAuthService {
  private baseURL = API_BASE;

  // Generic API request handler
  private async apiRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<AuthResponse> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`🔥 API Request: ${options.method || 'GET'} ${url}`, options.body);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log(`🔥 API Response: ${response.status} ${response.statusText}`);

      const data = await response.json();
      console.log('🔥 API Data:', data);

      return data;
    } catch (error) {
      console.error('🔥 API Error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
      };
    }
  }

  // Register new user
  async register(userData: RegisterData): Promise<AuthResponse> {
    console.log('🔥 Registering user:', userData);

    const response = await this.apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      // Store authentication data
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('userId', response.data.user.id);
      localStorage.setItem('userType', response.data.user.userType);
      localStorage.setItem('userData', JSON.stringify(response.data.user));

      console.log('🔥 User registered and logged in successfully');
    }

    return response;
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔥 Logging in user:', { ...credentials, password: '[REDACTED]' });

    const response = await this.apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      // Store authentication data
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('userId', response.data.user.id);
      localStorage.setItem('userType', response.data.user.userType);
      localStorage.setItem('userData', JSON.stringify(response.data.user));

      console.log('🔥 User logged in successfully');
    }

    return response;
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await this.apiRequest('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      this.clearAuthData();
      console.log('🔥 User logged out successfully');
    }
  }

  // Refresh access token
  async refreshToken(): Promise<AuthResponse | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    const response = await this.apiRequest('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.success && response.data) {
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response;
    }

    // If refresh fails, clear auth data
    this.clearAuthData();
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    return !!(token && userId && userType);
  }

  // Get current user data
  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Get user type
  getUserType(): 'CUSTOMER' | 'PROVIDER' | null {
    return localStorage.getItem('userType') as 'CUSTOMER' | 'PROVIDER' | null;
  }

  // Get auth token
  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  // Clear all authentication data
  clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
  }

  // Update user profile
  async updateProfile(profileData: Partial<User>): Promise<AuthResponse> {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
      };
    }

    const response = await this.apiRequest('/api/user/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }

    return response;
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
      };
    }

    return this.apiRequest('/api/user/change-password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<AuthResponse> {
    return this.apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    return this.apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Verify email
  async verifyEmail(token: string): Promise<AuthResponse> {
    return this.apiRequest('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Social login (placeholder for future implementation)
  async socialLogin(provider: string, token: string): Promise<AuthResponse> {
    return this.apiRequest(`/api/auth/social/${provider}`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }
}

// Export singleton instance
export const authService = new ModernAuthService();

// Export types
export type { LoginCredentials, RegisterData, User, AuthResponse };

// Export utility functions
export const authUtils = {
  // Format phone number
  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  },

  // Validate email
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  },

  // Calculate password strength
  calculatePasswordStrength: (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  },

  // Get password strength text
  getPasswordStrengthText: (strength: number): string => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  },

  // Get password strength color
  getPasswordStrengthColor: (strength: number): string => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  },
};

console.log('🔥 Modern Auth Service Loaded');
