import React, { useState, useEffect } from 'react';
import EscrowPayment from '../components/EscrowPayment';
import ProviderEscrowDashboard from '../components/ProviderEscrowDashboard';
import SecurityDashboard from '../components/SecurityDashboard';
import { secureEscrowService } from '../services/secureEscrowService';
import { Shield, CreditCard, Users, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const EscrowIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customer' | 'provider' | 'security'>('customer');
  const [mockData, setMockData] = useState({
    customerId: 'cust_demo_001',
    providerId: 'prov_demo_001',
    serviceId: 'service_demo_001',
    amount: 1000,
    serviceName: 'Home Cleaning Service'
  });

  const [systemStatus, setSystemStatus] = useState({
    escrowActive: true,
    securityEnabled: true,
    fraudDetectionActive: true,
    apiConnected: false,
    lastCheck: new Date()
  });

  useEffect(() => {
    // Check system status
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Simulate system status check
      const status = await secureEscrowService.createSecureTransaction(
        mockData.customerId,
        mockData.providerId,
        1, // Test amount
        'test_service'
      );
      
      setSystemStatus(prev => ({
        ...prev,
        apiConnected: true,
        lastCheck: new Date()
      }));
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        apiConnected: false,
        lastCheck: new Date()
      }));
    }
  };

  const handlePaymentComplete = (transaction: any) => {
    console.log('Payment completed successfully:', transaction);
    alert(`✅ Payment secured in escrow!\nTransaction ID: ${transaction.id}\nAmount: ₹${transaction.amount}`);
  };

  const handlePaymentFailed = (error: string) => {
    console.error('Payment failed:', error);
    alert(`❌ Payment failed: ${error}`);
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Servoley Escrow System</h1>
                <p className="text-sm text-gray-500">Maximum Security Payment Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">System Status</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.escrowActive)}
                  <span className={`text-sm font-medium ${getStatusColor(systemStatus.escrowActive)}`}>
                    {systemStatus.escrowActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'customer', label: 'Customer Payment', icon: CreditCard },
              { id: 'provider', label: 'Provider Dashboard', icon: Users },
              { id: 'security', label: 'Security Monitor', icon: Lock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* System Status Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.escrowActive)}
                <span className="text-sm">Escrow System</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.securityEnabled)}
                <span className="text-sm">Security Features</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.fraudDetectionActive)}
                <span className="text-sm">Fraud Detection</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.apiConnected)}
                <span className="text-sm">API Connection</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Last checked</p>
              <p className="text-sm">{systemStatus.lastCheck.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'customer' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Payment Flow</h2>
              <p className="text-gray-600 mb-6">
                Test the complete escrow payment flow from customer perspective. Money will be held securely until service completion.
              </p>
              
              <EscrowPayment
                serviceId={mockData.serviceId}
                providerId={mockData.providerId}
                customerId={mockData.customerId}
                amount={mockData.amount}
                serviceName={mockData.serviceName}
                onPaymentComplete={handlePaymentComplete}
                onPaymentFailed={handlePaymentFailed}
              />
            </div>

            {/* Demo Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Controls</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Amount</label>
                  <input
                    type="number"
                    value={mockData.amount}
                    onChange={(e) => setMockData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="100"
                    max="100000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                  <input
                    type="text"
                    value={mockData.serviceName}
                    onChange={(e) => setMockData(prev => ({ ...prev, serviceName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setMockData({
                    customerId: 'cust_demo_' + Math.random().toString(36).substr(2, 9),
                    providerId: 'prov_demo_' + Math.random().toString(36).substr(2, 9),
                    serviceId: 'service_demo_' + Math.random().toString(36).substr(2, 9),
                    amount: 1000,
                    serviceName: 'Home Cleaning Service'
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate New IDs
                </button>
                <button
                  onClick={checkSystemStatus}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Check System Status
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'provider' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider Dashboard</h2>
              <p className="text-gray-600 mb-6">
                View and manage escrow transactions from provider perspective. Track earnings, pending payments, and disputes.
              </p>
              
              <ProviderEscrowDashboard providerId={mockData.providerId} />
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Monitoring</h2>
              <p className="text-gray-600 mb-6">
                Real-time security monitoring, fraud detection, and threat management dashboard.
              </p>
              
              <SecurityDashboard />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Servoley Escrow System - Maximum Security Payment Platform</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>RBI Compliant</span>
              <span>•</span>
              <span>256-bit Encryption</span>
              <span>•</span>
              <span>AI Fraud Detection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowIntegration;
