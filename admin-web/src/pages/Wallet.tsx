import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API_BASE from '../App'


interface Wallet {
  id: string
  userId: string
  userName: string
  userType: 'customer' | 'provider'
  balance: number
  currency: string
  status: 'active' | 'frozen' | 'closed'
  createdAt: string
}

interface Transaction {
  id: string
  walletId: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  status: 'completed' | 'pending' | 'failed'
  createdAt: string
}

export default function Wallets() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<'all' | 'customer' | 'provider'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'frozen' | 'closed'>('all')

  useEffect(() => {
    fetchWallets()
  }, [])

  useEffect(() => {
    if (selectedWallet) {
      fetchTransactions(selectedWallet)
    }
  }, [selectedWallet])

  const fetchWallets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/admin/wallets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setWallets(data.data)
        if (data.data.length > 0 && !selectedWallet) {
          setSelectedWallet(data.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching wallets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (walletId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/admin/wallets/${walletId}/transactions`, {
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

  const updateWalletStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/admin/wallets/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchWallets()
      } else {
        console.error('Failed to update wallet status')
      }
    } catch (error) {
      console.error('Error updating wallet status:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'frozen':
        return 'bg-yellow-100 text-yellow-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionTypeColor = (type: string) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600'
  }

  const filteredWallets = wallets.filter(wallet => 
    (userFilter === 'all' || wallet.userType === userFilter) &&
    (statusFilter === 'all' || wallet.status === statusFilter)
  )

  const selectedWalletData = wallets.find(w => w.id === selectedWallet)

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Wallets</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setUserFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  userFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setUserFilter('customer')}
                className={`px-3 py-1 text-sm rounded-full ${
                  userFilter === 'customer' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Customers
              </button>
              <button
                onClick={() => setUserFilter('provider')}
                className={`px-3 py-1 text-sm rounded-full ${
                  userFilter === 'provider' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Providers
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'active' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('frozen')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'frozen' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Frozen
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'closed' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Closed
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading wallets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Wallets</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredWallets.length > 0 ? (
                  filteredWallets.map((wallet) => (
                    <div 
                      key={wallet.id} 
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedWallet === wallet.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedWallet(wallet.id)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{wallet.userName}</h3>
                          <p className="text-xs text-gray-500">
                            {wallet.userType === 'customer' ? 'Customer' : 'Provider'} • {wallet.currency}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(wallet.status)}`}>
                          {wallet.status}
                        </span>
                      </div>
                      <div className="mt-2 text-lg font-bold">
                        {wallet.currency} {wallet.balance.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No wallets found
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {selectedWalletData ? (
              <>
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedWalletData.userName}'s Wallet
                    </h2>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedWalletData.status)}`}>
                        {selectedWalletData.status}
                      </span>
                      <select
                        value={selectedWalletData.status}
                        onChange={(e) => updateWalletStatus(selectedWalletData.id, e.target.value)}
                        className="text-sm border rounded p-1"
                      >
                        <option value="active">Active</option>
                        <option value="frozen">Frozen</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold">
                        {selectedWalletData.currency} {selectedWalletData.balance.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">Current Balance</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">User Type</p>
                        <p className="font-medium">
                          {selectedWalletData.userType === 'customer' ? 'Customer' : 'Provider'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Currency</p>
                        <p className="font-medium">{selectedWalletData.currency}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-medium">{selectedWalletData.status}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-medium">{formatDate(selectedWalletData.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
                  </div>
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
                        {transactions.length > 0 ? (
                          transactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(transaction.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {transaction.description}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTransactionTypeColor(transaction.type)}`}>
                                {transaction.type === 'credit' ? '+' : '-'}{selectedWalletData.currency} {transaction.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                              No transactions found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 4h.01M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 4h.01" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No wallet selected</h3>
                <p className="mt-1 text-gray-500">Select a wallet from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
