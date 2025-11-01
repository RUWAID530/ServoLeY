
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../App';

interface ApiResponse {
  data: {
    userId: string;
    token: string;
    user: {
      userType: string;
    };
  };
}



interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName?: string;
  businessAddress?: string;
  experience?: string;
}

export default function ProviderLoginSignup() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'request' | 'registered' | 'verify'>('request');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    phone: '',
  });

  // Signup form state
  const [signupData, setSignupData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    experience: '',
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email && !loginData.phone) {
      setError('Please enter email or phone number');
      return;
    }

    setError('');
    setLoading(true);
    try {
    const res = await axios.post<ApiResponse>(`${API_BASE}/api/auth/login`, {
  email: loginData.email || undefined,
  phone: loginData.phone || undefined,
});

      setUserId((res.data as any).data.userId);
      setStep('verify');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.email && !signupData.phone) {
      setError('Please enter email or phone number');
      return;
    }

    if (!signupData.firstName || !signupData.lastName) {
      setError('Please enter your full name');
      return;
    }

    if (!signupData.businessName || !signupData.businessAddress) {
      setError('Please enter your business details');
      return;
    }

    setError('');
    setLoading(true);

    // Prepare registration data
    const registrationData = {
      userType: 'PROVIDER',
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      email: signupData.email,
      phone: signupData.phone,
      businessName: signupData.businessName,
      businessAddress: signupData.businessAddress,
      providerType: 'FREELANCER',
      category: 'General',
      area: 'Not specified',
      panNumber: 'TEMP' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      aadhaarNumber: 'TEMP' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      experience: signupData.experience
    };

    console.log('Sending registration data:', registrationData);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, registrationData);
     


      setUserId((res.data as any).data.userId);
      setStep('registered');
      setSuccess('Registration successful! Please request an OTP to verify your account.');
    } catch (e: any) {
      console.error('Registration error:', e);
      console.error('Error response:', e?.response);
      console.error('Error data:', e?.response?.data);
      console.error('Network error details:', {
        code: e?.code,
        errno: e?.errno,
        syscall: e?.syscall,
        address: e?.address,
        port: e?.port,
        config: e?.config
      });

      // Extract detailed error message
      let errorMessage = 'Registration failed';
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e?.message) {
        errorMessage = e.message;
      } else if (e?.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please make sure the server is running on port 8084.';
      } else if (e?.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Unable to connect to the server. Please make sure the server is running on port 8084.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('Please enter the OTP code');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await axios.post<ApiResponse>(`${API_BASE}/api/auth/verify-otp`, { userId, code });
      localStorage.setItem('token', res.data.data.token);
localStorage.setItem('userType', res.data.data.user.userType);


      window.location.href = '/provider-dashboard';
    } catch (e: any) {
      setError(e?.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/api/auth/resend-otp`, { userId });
      setSuccess('OTP resent successfully');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('request');
    setCode('');
    setError('');
    setSuccess('');
    setLoginData({
      email: '',
      phone: '',
    });
    setSignupData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      businessName: '',
      businessAddress: '',
      experience: '',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A9.002 9.002 0 0112 21c-2.796 0-5.29-1.28-6.933-3.282m15.686 0A9.002 9.002 0 009 3c2.796 0 5.29 1.28 6.933 3.282m0 0a9.002 9.002 0 011.939 5.873 9.002 9.002 0 01-1.939 5.873m-15.686 0A9.002 9.002 0 019 3c2.796 0 5.29 1.28 6.933 3.282"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Provider Login' : 'Provider Sign Up'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin
              ? 'Enter your email or phone number to receive an OTP'
              : 'Create your service provider account'
            }
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`flex-1 py-2 px-4 text-center font-medium ${
              isLogin
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setIsLogin(true);
              resetForm();
            }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center font-medium ${
              !isLogin
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setIsLogin(false);
              resetForm();
            }}
          >
            Sign Up
          </button>
        </div>

        {success && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {step === 'request' ? (
          <form className="mt-8 space-y-6" onSubmit={isLogin ? handleLogin : handleSignup}>
            {!isLogin && (
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="First Name"
                      value={signupData.firstName}
                      onChange={handleSignupChange}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Last Name"
                      value={signupData.lastName}
                      onChange={handleSignupChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Business Name"
                    value={signupData.businessName}
                    onChange={handleSignupChange}
                  />
                </div>

                <div>
                  <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
                    Business Address
                  </label>
                  <textarea
                    id="businessAddress"
                    name="businessAddress"
                    rows={2}
                    required
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Business Address"
                    value={signupData.businessAddress}
                    onChange={handleSignupChange}
                  />
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="text"
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 5+ years"
                    value={signupData.experience}
                    onChange={handleSignupChange}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Email address"
                  value={isLogin ? loginData.email : signupData.email}
                  onChange={isLogin ? handleLoginChange : handleSignupChange}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Phone number"
                  value={isLogin ? loginData.phone : signupData.phone}
                  onChange={isLogin ? handleLoginChange : handleSignupChange}
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <p className="text-xs text-gray-500">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || (isLogin ? (!loginData.email && !loginData.phone) : (!signupData.email && !signupData.phone) || (!isLogin && (!signupData.firstName || !signupData.lastName || !signupData.businessName || !signupData.businessAddress)))}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isLogin ? 'Sending...' : 'Registering...'}
                  </span>
                ) : (
                  <span>{isLogin ? 'Request OTP' : 'Sign Up & Request OTP'}</span>
                )}
              </button>
            </div>
          </form>
        ) : step === 'registered' ? (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Registration Successful!</h3>
              <p className="mt-2 text-sm text-gray-500">Your account has been created. Please request an OTP to verify your account.</p>
            </div>
            <div className="mt-6">
              <button
                onClick={async () => {
                  setError('');
                  setLoading(true);
                  try {
                    await axios.post(`${API_BASE}/api/auth/request-otp`, { userId });
                    setStep('verify');
                    setSuccess('OTP sent successfully! Please check your email or phone.');
                  } catch (e: any) {
                    setError(e?.response?.data?.message || 'Failed to send OTP');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span>Request OTP</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div>
              <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700">
                Enter OTP Code
              </label>
              <div className="mt-1">
                <input
                  id="otp-code"
                  name="otp-code"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  <span>Verify OTP</span>
                )}
              </button>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                onClick={() => {
                  setStep('request')
                  setCode('')
                }}
              >
                Back to {isLogin ? 'Login' : 'Sign Up'}
              </button>
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                onClick={handleResendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
