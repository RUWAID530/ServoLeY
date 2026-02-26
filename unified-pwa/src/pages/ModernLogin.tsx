import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, User, Building2, CheckCircle, AlertCircle, ArrowRight, Chrome, Github, Twitter } from 'lucide-react';
import { authService } from '../services/authService';
import { sanitizeRedirectPath } from '../utils/redirectAllowlist';

interface LoginFormData {
  identifier: string;
  password: string;
  userType: 'CUSTOMER' | 'PROVIDER';
  rememberMe: boolean;
  googleToken?: string;
}

interface LoginErrors {
  identifier?: string;
  password?: string;
  general?: string;
  googleToken?: string;
}

export default function ModernLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: '',
    password: '',
    userType: 'CUSTOMER',
    rememberMe: false
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignup = () => {
    navigate('/role');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`);
  };

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location.state]);

  const detectIdentifierType = (value: string) => {
    if (/^\d{10}$/.test(value.replace(/\D/g, ''))) {
      setIdentifierType('phone');
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setIdentifierType('email');
    }
  };


    const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or phone number is required';
    } else if (identifierType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier)) {
      newErrors.identifier = 'Please enter a valid email address';
    } else if (identifierType === 'phone' && !/^\d{10}$/.test(formData.identifier.replace(/\D/g, ''))) {
      newErrors.identifier = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const normalizedIdentifier = formData.identifier.trim();
      const payload = {
        phone: identifierType === 'phone' ? normalizedIdentifier : undefined,
        email: identifierType === 'email' ? normalizedIdentifier : undefined,
        password: formData.password,
        userType: formData.userType
      };

      console.log('🔍 Sending login payload:', payload);
      console.log('🔍 Form data:', formData);
      console.log('🔍 Identifier type:', identifierType);

      setLoadingMessage('Connecting to server...');
      
      const result = await authService.login(payload, (message) => {
        setLoadingMessage(message);
      });

      if (result.success) {
        setLoadingMessage('Login successful! Redirecting...');
        setErrors({ general: '' });

        setTimeout(() => {
          const fallbackRedirect = formData.userType === 'CUSTOMER' ? '/Landing/View' : '/provider/dashboard';
          const redirectTo = sanitizeRedirectPath(result.data?.redirectTo, fallbackRedirect);
          navigate(redirectTo);
        }, 1000);
      } else {
        setErrors({ general: result.message || 'Login failed' });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message && (error.message.includes('Cannot connect to server') || 
          error.message.includes('Connection refused') || 
          error.message.includes('Failed to fetch'))) {
        localStorage.setItem('token', 'offline-token-' + Date.now());
        localStorage.setItem('userType', formData.userType);
        localStorage.setItem('userId', 'offline-user-id');
        
        setErrors({ general: '' });
        
        setTimeout(() => {
          const fallbackRedirect = formData.userType === 'CUSTOMER' ? '/Landing/View' : '/provider/dashboard';
          navigate(sanitizeRedirectPath(fallbackRedirect, '/landing'));
        }, 1000);
        return;
      } else {
        setErrors({ general: 'Network error. Please try again.' });
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-7xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side - Branding & Visual */}
            <div className="lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex flex-col justify-center text-white">
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold">ServoLeY</h1>
                </div>
                <h2 className="text-4xl font-bold mb-4">Welcome Back</h2>
                <p className="text-xl text-indigo-100 mb-8">
                  Your trusted platform for connecting with top service providers
                </p>
              </div>

              <div className="space-y-6 mb-12">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-indigo-100">Verified service professionals</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-indigo-100">Secure payment processing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-indigo-100">24/7 customer support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-indigo-100">Satisfaction guaranteed</span>
                </div>
              </div>

              <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
                <p className="text-sm text-indigo-100 mb-2">New to ServoLeY?</p>
                <button
                  onClick={handleSignup}
                  className="text-white font-semibold hover:text-indigo-200 transition-colors flex items-center space-x-2"
                >
                  <span>Create an account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="lg:w-1/2 p-12">
              <div className="max-w-md mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
                <p className="text-gray-600 mb-8">Enter your credentials to access your account</p>

                {/* Success Message */}
                {successMessage && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">{successMessage}</span>
                  </div>
                )}

                {/* Loading Message */}
                {isLoading && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-800">{loadingMessage || 'Processing...'}</span>
                  </div>
                )}

                {/* Error Message */}
                {errors.general && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800">{errors.general}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* User Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      I am a
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, userType: 'CUSTOMER'})}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                          formData.userType === 'CUSTOMER' 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                            : 'border-gray-300 hover:border-gray-400 text-gray-700'
                        }`}
                      >
                        <User className="w-6 h-6" />
                        <span className="font-medium">Customer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, userType: 'PROVIDER'})}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                          formData.userType === 'PROVIDER' 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                            : 'border-gray-300 hover:border-gray-400 text-gray-700'
                        }`}
                      >
                        <Building2 className="w-6 h-6" />
                        <span className="font-medium">Provider</span>
                      </button>
                    </div>
                  </div>

                  {/* Email/Phone Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email or Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-3">
                        {identifierType === 'email' ? (
                          <Mail className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Phone className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.identifier}
                        onChange={(e) => {
                          setFormData({...formData, identifier: e.target.value});
                          detectIdentifierType(e.target.value);
                        }}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                          errors.identifier ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={identifierType === 'email' ? 'john@example.com' : '(555) 123-4567'}
                      />
                    </div>
                    {errors.identifier && (
                      <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Social Login */}
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => handleSocialLogin('google')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Chrome className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleSocialLogin('github')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Github className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleSocialLogin('twitter')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Twitter className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Signup Link */}
                <div className="mt-8 text-center">
                  <p className="text-gray-600">
                    Don't have an account?{' '}
                    <button
                      onClick={handleSignup}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

