import React,   { useState } from 'react'
import axios from 'axios'
import { API_BASE } from '../App'

// DEPRECATED: Use CustomerLoginSignup.tsx instead
export default function Login() {
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [userId, setUserId] = useState('')
	const [code, setCode] = useState('')
	const [step, setStep] = useState<'request' | 'verify'>('request')
	const [error, setError] = useState('')

	type LoginResponse = {
		data: {
			userId: string;
		};
	};

	const requestOtp = async () => {
		setError('');
		try {
			const res = await axios.post<LoginResponse>(`${API_BASE}/api/auth/login`, { email: email || undefined, phone: phone || undefined });
			setUserId(res.data.data.userId);
			setStep('verify');
		} catch (e: any) {
			setError(e?.response?.data?.message || 'Failed to request OTP');
		}
	};

	const verifyOtp = async () => {
		setError('')
		try {
			const res = await axios.post<{ data: { token: string } }>(`${API_BASE}/api/auth/verify-otp`, { userId, code })
			localStorage.setItem('token', res.data.data.token)
			localStorage.setItem('userType', 'CUSTOMER')
			window.location.href = '/services'
		} catch (e: any) {
			setError(e?.response?.data?.message || 'Failed to verify OTP')
		}
	}

	return (
		<div className="max-w-md mx-auto p-6">
			<h1 className="text-2xl font-semibold mb-4">Login</h1>
			{step === 'request' ? (
				<div className="space-y-3">
					<input className="w-full border p-2 rounded" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
					<input className="w-full border p-2 rounded" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
					<button className="w-full bg-blue-600 text-white p-2 rounded" onClick={requestOtp}>Request OTP</button>
				</div>
			) : (
				<div className="space-y-3">
					<input className="w-full border p-2 rounded" placeholder="OTP Code" value={code} onChange={e => setCode(e.target.value)} />
					<button className="w-full bg-green-600 text-white p-2 rounded" onClick={verifyOtp}>Verify</button>
				</div>
			)}
			{error && <p className="text-red-600 mt-3">{error}</p>}
		</div>
	)
}



