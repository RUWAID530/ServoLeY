import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Users from './pages/Users'
import Wallets from './pages/Wallet'
import Tickets from './pages/Tickets'

export const API_BASE = 'http://localhost:3000' // Replace with your actual API base URL

export default function App() {
  return (
    <div className="min-h-full bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/users" element={<Users />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  )
}
