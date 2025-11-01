import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../App'
import { Link } from 'react-router-dom'

export default function Login() {
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [userId, setUserId] = useState('')
	const [code, setCode] = useState('')
	const [step, setStep] = useState<'request' | 'verify'>('request')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	type RequestOtpResponse = {
		data: {
			userId: string;
		};
	};

	const requestOtp = async () => {
		if (!email && !phone) {
			setError('Please enter email or phone number');
			return;
		}

		setError('');
		setLoading(true);
		try {
			const res = await axios.post(`${API_BASE}/api/auth/login`, {
				email: email || undefined,
				phone: phone || undefined,
			});
			const responseData = res.data as RequestOtpResponse;
			setUserId(responseData.data.userId);
			setStep('verify');
		} catch (e: any) {
			setError(e?.response?.data?.message || 'Failed to request OTP');
		} finally {
			setLoading(false);
		}
	};

	const verifyOtp = async () => {
		if (!code) {
			setError('Please enter the OTP code')
			return
		}
		
		setError('')
		setLoading(true)
		try {
			type VerifyOtpResponse = {
				data: {
					token: string;
					user: {
						userType: string;
					};
				};
			};
			const res = await axios.post<VerifyOtpResponse>(`${API_BASE}/api/auth/verify-otp`, { userId, code });
			localStorage.setItem('token', res.data.data.token);
			localStorage.setItem('userType', res.data.data.user.userType);
			window.location.href = '/customer-dashboard';
		} catch (e: any) {
			setError(e?.response?.data?.message || 'Failed to verify OTP');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Provider Login</h2>
					<p className="mt-2 text-center text-sm text-gray-600">Enter your email or phone number to receive an OTP</p>
				</div>
				
				{step === 'request' ? (
					<div className="space-y-6">
						<div className="rounded-md shadow-sm -space-y-px">
							<div>
								<label htmlFor="email-address" className="sr-only">Email address</label>
								<input
									id="email-address"
									name="email"
									type="email"
									autoComplete="email"
									required
									className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Email address"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>
							<div>
								<label htmlFor="phone" className="sr-only">Phone number</label>
								<input
									id="phone"
									name="phone"
									type="tel"
									autoComplete="tel"
									required
									className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Phone number"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
								/>
							</div>
						</div>
						
						<div>
							<button
								type="button"
								className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								onClick={requestOtp}
								disabled={loading}
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
					<div className="space-y-6">
						<div>
							<label htmlFor="otp-code" className="block text-sm font-medium text-gray-700">Enter OTP Code</label>
							<div className="mt-1">
								<input
									id="otp-code"
									name="otp-code"
									type="text"
									autoComplete="one-time-code"
									required
									className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
									placeholder="Enter 6-digit OTP"
									maxLength={6}
									value={code}
									onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
								/>
							</div>
						</div>
						
						<div>
							<button
								type="button"
								className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
								onClick={verifyOtp}
								disabled={loading || code.length !== 6}
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
						
						<div>
							<button
								type="button"
								className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
								onClick={() => {
									setStep('request')
									setCode('')
								}}
							>
								Back to Login
							</button>
						</div>

						<div className="mt-4 text-center">
							<span className="text-sm text-gray-600">
								Don't have an account?{' '}
								<Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
									Sign up
								</Link>
							</span>
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
			</div>
		</div>
	)
}

