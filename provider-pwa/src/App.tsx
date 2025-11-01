import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProviderLoginSignup from './pages/ProviderLoginSignup'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import ProviderDashboard from './pages/ProviderDashboard'
import Inbox from './pages/Inbox'
import Wallet from './pages/Wallet'
import Services from './pages/Services'
import Reviews from './pages/Reviews'
import Availability from './pages/Availability'
import Notifications from './pages/Notifications'

// Use environment variable for API base URL to support Project IDX
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8084'

export default function App() {
	return (
		<div className="min-h-full bg-gray-50">
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/signup" element={<Signup />} />
				<Route path="/provider-login-signup" element={<ProviderLoginSignup />} />
				<Route path="/landing" element={<Landing />} />
				<Route path="/customer-dashboard" element={<CustomerDashboard />} />
				<Route path="/provider-dashboard" element={<ProviderDashboard />}>
					<Route path="orders" element={<div>Orders Page</div>} />
					<Route path="services" element={<Services />} />
					<Route path="wallet" element={<Wallet />} />
					<Route path="notifications" element={<Notifications />} />
					<Route path="availability" element={<Availability />} />
					<Route path="profile" element={<div>Profile Page</div>} />
				</Route>
				<Route path="/dashboard" element={<Dashboard />}>
					<Route path="inbox" element={<Inbox />} />
					<Route path="wallet" element={<Wallet />} />
					<Route path="services" element={<Services />} />
					<Route path="reviews" element={<Reviews />} />
					<Route path="availability" element={<Availability />} />
					<Route path="notifications" element={<Notifications />} />
				</Route>
				<Route path="*" element={<Navigate to="/landing" />} />
			</Routes>
		</div>
	)
}



