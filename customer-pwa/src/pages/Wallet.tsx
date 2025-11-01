/**
 * Wallet component - Displays user wallet information and transaction history
 * Allows users to add funds to their wallet
 */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

export default function Wallet() {

  // State hooks for managing wallet data, transactions, form inputs, and UI feedback
  const [walletData, setWalletData] = useState<any>(null) // Array of transaction objects // Stores wallet balance and other wallet information
  const [transactions, setTransactions] = useState<any[]>([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  React.useEffect(() => {
    fetchWalletData()
    fetchTransactions()
  }, [])

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/customer/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setWalletData(data.data)
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/customer/wallet/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setTransactions(data.data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(parseFloat(amount))) {
      setMessage('Please enter a valid amount')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/customer/wallet/add-funds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })

      const data = await response.json()
      if (data.success) {
        setMessage('Funds added successfully!')
        setAmount('')
        fetchWalletData()
        fetchTransactions()
      } else {
        setMessage(data.message || 'Failed to add funds')
      }
    } catch (error) {
      setMessage('Error adding funds. Please try again.')
      console.error('Error adding funds:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Wallet</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
      </div>
      
      {walletData ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Wallet Balance</h2>
            <span className="text-2xl font-bold">${walletData.balance.toFixed(2)}</span>
          </div>
          
          <form onSubmit={handleAddFunds} className="mb-6">
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 border p-2 rounded"
                min="1"
                step="0.01"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
              >
                {loading ? 'Processing...' : 'Add Funds'}
              </button>
            </div>
            {message && <p className={`mt-2 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p>Loading wallet data...</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-medium mb-4">Transaction History</h2>
        
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No transactions found.</p>
        )}
      </div>
    </div>
  )
}
