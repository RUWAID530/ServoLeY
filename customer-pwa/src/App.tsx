import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'

import CustomerLoginSignup from './pages/CustomerLoginSignup'
import Dashboard from './pages/DashboardNew'
import PostRequirement from './pages/PostRequirement'
import Profile from './pages/Profile'
import Wallet from './pages/Wallet'
import Services from './pages/Services'
import Orders from './pages/Orders'
import Chat from './pages/Chat'
import Notifications from './pages/Notification'
import PrivateRoute from './components/PrivateRoute'

// Use environment variable for API base URL to support Project IDX
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8084'


// Then define the component
export default function App() {
	return (
		<div className="min-h-full bg-gray-50">
			<Routes>
				<Route path="/" element={<Landing />} />
				
				<Route path="/customer-login-signup" element={<CustomerLoginSignup />} />
				<Route path="/post-requirement" element={
					<PrivateRoute>
						<PostRequirement />
					</PrivateRoute>
				} />
				<Route path="/dashboard" element={
					<PrivateRoute>
						<Dashboard />
					</PrivateRoute>
				} />
				<Route path="/wallet" element={
					<PrivateRoute>
						<Wallet />
					</PrivateRoute>
				} />
				<Route path="/services" element={
					<PrivateRoute>
						<Services />
					</PrivateRoute>
				} />
				<Route path="/orders" element={
					<PrivateRoute>
						<Orders />
					</PrivateRoute>
				} />
				<Route path="/chat/:orderId" element={
					<PrivateRoute>
						<Chat />
					</PrivateRoute>
				} />
				<Route path="/profile" element={
					<PrivateRoute>
						<Profile />
					</PrivateRoute>
				} />
				<Route path="/notifications" element={
					<PrivateRoute>
						<Notifications />
					</PrivateRoute>
				} />
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</div>
	)
}



