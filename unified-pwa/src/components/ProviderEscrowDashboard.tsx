import React, { useState, useEffect } from 'react';
import { escrowService, EscrowTransaction, EscrowAccount } from '../services/escrowService';
import { IndianRupee, Shield, Clock, CheckCircle, AlertCircle, TrendingUp, Users, Eye } from 'lucide-react';

interface ProviderEscrowDashboardProps {
  providerId: string;
}

const ProviderEscrowDashboard: React.FC<ProviderEscrowDashboardProps> = ({ providerId }) => {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [accountBalance, setAccountBalance] = useState<EscrowAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'held' | 'released' | 'disputed'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [providerId, filter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load transactions for this provider
      const allTransactions = await escrowService.getTransactionHistory(providerId, 
        filter === 'all' ? undefined : filter);
      setTransactions(allTransactions);

      // Load escrow account balance
      const balance = await escrowService.getEscrowAccountBalance();
      setAccountBalance(balance);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'held':
        return 'bg-yellow-100 text-yellow-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'held':
        return <Clock className="w-4 h-4" />;
      case 'released':
        return <CheckCircle className="w-4 h-4" />;
      case 'disputed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const calculateStats = () => {
    const totalEarnings = transactions
      .filter(t => t.status === 'released')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingAmount = transactions
      .filter(t => t.status === 'held')
      .reduce((sum, t) => sum + t.amount, 0);

    const disputedAmount = transactions
      .filter(t => t.status === 'disputed')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalEarnings,
      pendingAmount,
      disputedAmount,
      totalTransactions: transactions.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Escrow Dashboard</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Shield className="w-5 h-5" />
          <span>Secure Payment Management</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalEarnings.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">₹{stats.pendingAmount.toFixed(2)}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disputed</p>
              <p className="text-2xl font-bold text-red-600">₹{stats.disputedAmount.toFixed(2)}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Account Balance */}
      {accountBalance && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Escrow Account Balance</h3>
              <div className="space-y-1">
                <p className="text-sm opacity-90">
                  Available Balance: <span className="font-bold">₹{accountBalance.availableAmount.toFixed(2)}</span>
                </p>
                <p className="text-sm opacity-90">
                  Held in Escrow: <span className="font-bold">₹{accountBalance.heldAmount.toFixed(2)}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">₹{accountBalance.balance.toFixed(2)}</p>
              <p className="text-sm opacity-75">Total Balance</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { key: 'all', label: 'All Transactions' },
              { key: 'held', label: 'Pending' },
              { key: 'released', label: 'Completed' },
              { key: 'disputed', label: 'Disputed' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Transactions List */}
        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Service #{transaction.serviceId}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{transaction.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        Platform Fee: ₹{transaction.platformFee.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Transaction Details</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Payment Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-medium">{selectedTransaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service ID</span>
                    <span className="font-medium">#{selectedTransaction.serviceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium">₹{selectedTransaction.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-medium">₹{selectedTransaction.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Amount</span>
                    <span className="font-bold text-green-600">
                      ₹{(selectedTransaction.amount - selectedTransaction.platformFee).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span>{new Date(selectedTransaction.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedTransaction.releasedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Released</span>
                      <span>{new Date(selectedTransaction.releasedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedTransaction.disputeReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Dispute Reason</h4>
                  <p className="text-sm text-red-700">{selectedTransaction.disputeReason}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
                >
                  Close
                </button>
                {selectedTransaction.status === 'disputed' && (
                  <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                    Respond to Dispute
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderEscrowDashboard;
