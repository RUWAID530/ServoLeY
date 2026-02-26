import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface SecurityMetrics {
  totalTransactions: number;
  blockedTransactions: number;
  suspiciousActivities: number;
  securityScore: number;
  activeThreats: number;
  resolvedThreats: number;
}

interface SecurityAlert {
  id: string;
  type: 'high' | 'medium' | 'low';
  message: string;
  timestamp: Date;
  resolved: boolean;
  userId?: string;
  transactionId?: string;
}

interface SecurityLog {
  id: string;
  action: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  deviceFingerprint: string;
  riskScore: number;
  status: 'success' | 'blocked' | 'investigating';
}

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalTransactions: 0,
    blockedTransactions: 0,
    suspiciousActivities: 0,
    securityScore: 0,
    activeThreats: 0,
    resolvedThreats: 0
  });

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSecurityData();
    
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls to security service
      const mockMetrics: SecurityMetrics = {
        totalTransactions: 15420,
        blockedTransactions: 23,
        suspiciousActivities: 8,
        securityScore: 94.2,
        activeThreats: 3,
        resolvedThreats: 156
      };

      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'high',
          message: 'Multiple failed login attempts detected',
          timestamp: new Date(Date.now() - 300000),
          resolved: false,
          userId: 'user_12345'
        },
        {
          id: '2',
          type: 'medium',
          message: 'Unusual transaction pattern detected',
          timestamp: new Date(Date.now() - 600000),
          resolved: false,
          transactionId: 'txn_67890'
        },
        {
          id: '3',
          type: 'low',
          message: 'New device login from different location',
          timestamp: new Date(Date.now() - 900000),
          resolved: true,
          userId: 'user_54321'
        }
      ];

      const mockLogs: SecurityLog[] = [
        {
          id: '1',
          action: 'Transaction Created',
          userId: 'cust_001',
          timestamp: new Date(Date.now() - 120000),
          ipAddress: showSensitiveData ? '192.168.1.100' : '***.***.***.***',
          deviceFingerprint: 'fp_abc123',
          riskScore: 12,
          status: 'success'
        },
        {
          id: '2',
          action: 'Payment Blocked',
          userId: 'cust_002',
          timestamp: new Date(Date.now() - 240000),
          ipAddress: showSensitiveData ? '10.0.0.50' : '***.***.***.***',
          deviceFingerprint: 'fp_def456',
          riskScore: 87,
          status: 'blocked'
        },
        {
          id: '3',
          action: 'Fraud Detection Triggered',
          userId: 'cust_003',
          timestamp: new Date(Date.now() - 360000),
          ipAddress: showSensitiveData ? '172.16.0.10' : '***.***.***.***',
          deviceFingerprint: 'fp_ghi789',
          riskScore: 65,
          status: 'investigating'
        }
      ];

      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'blocked':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'investigating':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const resolveAlert = async (alertId: string) => {
    try {
      // Simulate API call to resolve alert
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        activeThreats: Math.max(0, prev.activeThreats - 1),
        resolvedThreats: prev.resolvedThreats + 1
      }));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

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
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showSensitiveData ? 'Hide' : 'Show'} Sensitive Data
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${
              autoRefresh ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>
        </div>
      </div>

      {/* Security Score Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Overall Security Score</h3>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getSecurityScoreColor(metrics.securityScore)}`}>
                {metrics.securityScore}%
              </span>
              <span className="text-sm opacity-75">Excellent</span>
            </div>
            <p className="text-sm opacity-90 mt-2">
              Your platform security is performing at optimal levels
            </p>
          </div>
          <div className="text-right">
            <Lock className="w-16 h-16 opacity-50" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalTransactions.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blocked Transactions</p>
              <p className="text-2xl font-bold text-red-600">{metrics.blockedTransactions}</p>
              <p className="text-xs text-gray-500">
                {((metrics.blockedTransactions / metrics.totalTransactions) * 100).toFixed(2)}% of total
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Threats</p>
              <p className="text-2xl font-bold text-yellow-600">{metrics.activeThreats}</p>
              <p className="text-xs text-gray-500">Requires attention</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
        </div>
        <div className="p-6">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No security alerts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getAlertColor(alert.type)} ${
                    alert.resolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium capitalize">{alert.type} Priority</span>
                        {alert.resolved && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <div className="mt-2 text-xs opacity-75">
                        {alert.timestamp.toLocaleString()}
                        {alert.userId && ` • User: ${alert.userId}`}
                        {alert.transactionId && ` • Transaction: ${alert.transactionId}`}
                      </div>
                    </div>
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="ml-4 px-3 py-1 bg-white text-gray-700 text-sm rounded hover:bg-gray-50"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Security Logs</h3>
        </div>
        <div className="p-6">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No security logs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(log.status)}
                      <div>
                        <p className="font-medium text-gray-900">{log.action}</p>
                        <p className="text-sm text-gray-500">
                          User: {log.userId} • IP: {log.ipAddress} • Device: {log.deviceFingerprint}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{log.timestamp.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">Risk Score:</span>
                        <span className={`text-xs font-medium ${
                          log.riskScore < 30 ? 'text-green-600' : 
                          log.riskScore < 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {log.riskScore}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Features Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { feature: '256-bit Encryption', status: 'active' },
            { feature: 'Real-time Fraud Detection', status: 'active' },
            { feature: 'Rate Limiting', status: 'active' },
            { feature: 'Multi-factor Authentication', status: 'active' },
            { feature: 'API Security', status: 'active' },
            { feature: 'Database Encryption', status: 'active' },
            { feature: 'Audit Logging', status: 'active' },
            { feature: 'Threat Intelligence', status: 'active' }
          ].map((item) => (
            <div key={item.feature} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{item.feature}</span>
              <span className={`px-2 py-1 text-xs rounded ${
                item.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
