import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

const AdminServiceVerification: React.FC = () => {
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastServiceCount, setLastServiceCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Fetch pending services from API
    fetchPendingServices();
    
    // Set up automatic polling for real-time updates
    const interval = setInterval(() => {
      fetchPendingServices();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show notification when new services are added
    if (pendingServices.length > lastServiceCount && lastServiceCount > 0) {
      const newServicesCount = pendingServices.length - lastServiceCount;
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Service Pending', {
          body: `${newServicesCount} new service(s) waiting for approval`,
          icon: '/favicon.ico'
        });
      }
      // Show in-app notification
      alert(`🔔 ${newServicesCount} new service(s) pending approval!`);
    }
    setLastServiceCount(pendingServices.length);
  }, [pendingServices, lastServiceCount]);

  const fetchPendingServices = async () => {
    try {
      // Get admin token
      const token = localStorage.getItem('adminToken');

      
      if (!token) {
        throw new Error('Admin authentication required');
      }

      const response = await fetch(`${API_BASE}/api/admin/services/pending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch pending services');
      }

      console.log('🔍 Pending services fetched:', data.data);
      setPendingServices(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching pending services:', error);
      setLoading(false);
      // Fallback to empty array if API fails
      setPendingServices([]);
    }
  };

  const handleApproveService = async (serviceId: string) => {
    try {
      // Get admin token
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('Admin authentication required');
      }

      console.log('📋 Approving service:', serviceId);
      
      const response = await fetch(`${API_BASE}/api/admin/services/${serviceId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to approve service');
      }

      console.log('✅ Service approved successfully:', serviceId);
      
      // Update local state
      setPendingServices(prev => prev.filter(service => service.id !== serviceId));
      
      // Show success message
      alert('Service approved successfully! It will now be available to customers.');
      
      // If no more pending services, redirect to admin dashboard
      if (pendingServices.length === 1) {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('❌ Error approving service:', error);
      alert(`Failed to approve service: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleRejectService = async (serviceId: string) => {
    try {
      // Get admin token
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('Admin authentication required');
      }

      const reason = prompt('Please provide a reason for rejection (optional):');
      
      console.log('❌ Rejecting service:', serviceId, 'Reason:', reason);
      
      const response = await fetch(`${API_BASE}/api/admin/services/${serviceId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reason || 'Service does not meet platform requirements' })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to reject service');
      }

      console.log('❌ Service rejected successfully:', serviceId);
      
      // Update local state
      setPendingServices(prev => prev.filter(service => service.id !== serviceId));
      
      // Show success message
      alert('Service rejected. The provider has been notified.');
      
      // If no more pending services, redirect to admin dashboard
      if (pendingServices.length === 1) {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('❌ Error rejecting service:', error);
      alert(`Failed to reject service: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Service Verification</h1>
                <p className="text-gray-600">Review and approve provider services</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {pendingServices.length} pending services
              </span>
              {/* Real-time indicator */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">Live</span>
              </div>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pendingServices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600 mb-4">No pending services to review.</p>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.category}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                    Pending Verification
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Service Details</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Description:</span> {service.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Price:</span> ₹{service.price}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Submitted:</span> {new Date(service.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Provider Information</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Name:</span> {service.providerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {service.providerEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleRejectService(service.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject Service
                  </button>
                  <button
                    onClick={() => handleApproveService(service.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminServiceVerification;
