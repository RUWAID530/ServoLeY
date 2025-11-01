import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  timestamp: string
  status: 'completed' | 'pending' | 'failed'
}

interface WalletData {
  balance: number
  pendingBalance: number
  currency: string
}

export default function Wallet() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchWalletData()
    fetchTransactions()
  }, [])

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setWalletData({
          balance: data.data.balance,
          pendingBalance: 0, // This would need to be added to the API if needed
          currency: data.data.currency || 'INR'
        })
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/wallet/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setTransactions(data.data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount))) {
      setMessage('Please enter a valid amount')
      return
    }

    if (walletData && parseFloat(withdrawAmount) > walletData.balance) {
      setMessage('Insufficient balance')
      return
    }

    setIsWithdrawing(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) })
      })

      const data = await response.json()
      if (data.success) {
        setMessage('Withdrawal request submitted successfully!')
        setWithdrawAmount('')
        fetchWalletData()
        fetchTransactions()
      } else {
        setMessage(data.message || 'Failed to process withdrawal')
      }
    } catch (error) {
      setMessage('Error processing withdrawal. Please try again.')
      console.error('Error processing withdrawal:', error)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Wallet</h1>
        <Link to="/inbox" className="text-blue-600 hover:underline">Back to Inbox</Link>
      </div>
      
      {walletData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Available Balance</h2>
            <div className="text-3xl font-bold text-gray-900">
              {walletData.currency} {walletData.balance.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Balance</h2>
            <div className="text-3xl font-bold text-gray-600">
              {walletData.currency} {walletData.pendingBalance.toFixed(2)}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p>Loading wallet data...</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Withdraw Funds</h2>
        <form onSubmit={handleWithdraw}>
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter amount"
              className="flex-1 border p-2 rounded"
              min="1"
              step="0.01"
            />
            <button
              type="submit"
              disabled={isWithdrawing}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
            >
              {isWithdrawing ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
          {message && <p className={`mt-2 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
        </div>
        
        {loading ? (
          <div className="p-6">
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}
                      {walletData?.currency} {transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
