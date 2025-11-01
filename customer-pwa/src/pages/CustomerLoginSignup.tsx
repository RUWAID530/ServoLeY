
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../App';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}


interface SignupResponse {
  userId: string;
}

interface LoginResponse {
  userId: string;
}

interface VerifyOtpResponse {
  token: string;
  user: {
    userType: string;
  };
}


interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}


export default function CustomerLoginSignup() {
  const navigate = useNavigate();
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
    phone: ''});

  // Signup form state
  const [signupData, setSignupData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''});

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      console.log('Login request:', { email: loginData.email || undefined, phone: loginData.phone || undefined });
      const res = await axios.post<ApiResponse<LoginResponse>>(`${API_BASE}/api/auth/login`, {
  email: loginData.email || undefined,
  phone: loginData.phone || undefined});
console.log('Login response:', res.data);
if (res.data.data?.userId) {
  setUserId(res.data.data.userId);
  setStep('verify');
      } else {
        console.error('Invalid API response:', res.data);
        setError('Invalid response from server');
        return;
      }
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to the server. Please make sure the server is running on port 8084.');
      } else {
        setError(e?.response?.data?.message || 'Failed to request OTP');
      }
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

    setError('');
    setLoading(true);
   const requestData = { userType: 'CUSTOMER', ...signupData };
try {
  console.log('Signup request:', requestData);


      const res = await axios.post<ApiResponse<SignupResponse>>(`${API_BASE}/api/auth/register`, requestData);

      console.log('Full API response:', res);
      console.log('Response data:', res.data);
      console.log('Response data.data:', res.data.data);
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);

      if (res.data && res.data.data && res.data.data.userId) {
        console.log('Setting userId to:', res.data.data.userId);
        setUserId(res.data.data.userId);
        setStep('registered');
        setSuccess('Registration successful! Please request an OTP to verify your account.');
      } else {
        console.error('API response structure issue');
        console.error('res.data exists:', !!res.data);
        console.error('res.data.data exists:', !!(res.data && res.data.data));
        console.error('res.data.data.userId exists:', !!(res.data && res.data.data && res.data.data.userId));
        console.error('Full response structure:', JSON.stringify(res, null, 2));
        setError('Invalid response from server - structure issue');
        return;
      }
    } catch (error: any) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error?.response);
      console.error('Error status:', error?.response?.status);
      console.error('Error status text:', error?.response?.statusText);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Request URL:', `${API_BASE}/api/auth/register`);
      console.error('Request data:', requestData);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      console.error('=========================');

      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to the server. Please make sure the server is running on port 8084.');
      } else {
        setError(error?.response?.data?.message || error?.message || 'Registration failed');
      }
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
    console.log('Verify OTP request:', { userId, code });
const res = await axios.post<ApiResponse<VerifyOtpResponse>>(`${API_BASE}/api/auth/verify-otp`, { userId, code });
if (res.data.data?.token) {
  localStorage.setItem('token', res.data.data.token);
  localStorage.setItem('userType', 'CUSTOMER');
} else {
        console.error('Invalid API response:', res.data);
        setError('Invalid response from server');
        return;
      }
      navigate('/dashboard');
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to the server. Please make sure the server is running on port 8084.');
      } else {
        setError(e?.response?.data?.message || 'OTP verification failed');
      }
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
      if (e.code === 'ECONNREFUSED' || e.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to the server. Please make sure the server is running on port 8084.');
      } else {
        setError(e?.response?.data?.message || 'Failed to resend OTP');
      }
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
      phone: ''});
    setSignupData({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''});
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Customer Login' : 'Customer Sign Up'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin
              ? 'Enter your email or phone number to receive an OTP'
              : 'Create your customer account'
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
                disabled={loading || (isLogin ? (!loginData.email && !loginData.phone) : (!signupData.email && !signupData.phone) || (!isLogin && (!signupData.firstName || !signupData.lastName)))}
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
                    await axios.post(`${API_BASE}/api/auth/resend-otp`, { userId });
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
