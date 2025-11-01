import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import LoginSignup from './pages/LoginSignup'
import Services from './pages/Services'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import PrivateRoute from './components/PrivateRoute'

// Use environment variable for API base URL to support Project IDX
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8084'

export default function App() {
	return (
		<div className="min-h-full bg-gray-50">
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/login-signup" element={<LoginSignup />} />

				{/* Private routes for all authenticated users */}
				<Route path="/services" element={
					<PrivateRoute>
						<Services />
					</PrivateRoute>
				} />

				<Route path="/dashboard" element={
					<PrivateRoute>
						<Dashboard />
					</PrivateRoute>
				} />

				<Route path="/orders" element={
					<PrivateRoute>
						<Orders />
					</PrivateRoute>
				} />

				<Route path="/profile" element={
					<PrivateRoute>
						<Profile />
					</PrivateRoute>
				} />

				<Route path="/chat/:orderId" element={
					<PrivateRoute>
						<Chat />
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