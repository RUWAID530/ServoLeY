import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProviderProfile } from '../contexts/ProviderProfileContext';

const ProviderServices: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state: profileState } = useProviderProfile();

  useEffect(() => {
    const status = searchParams.get('status');
    
    if (status === 'pending_verification') {
      // Show pending verification UI
      console.log('📋 Services pending admin verification');
    } else if (status === 'offline') {
      // Show offline mode UI
      console.log('📴 Services saved offline');
    } else {
      // Show normal services list
      console.log('✅ Services loaded normally');
    }
  }, [searchParams]);

  const getStatusMessage = () => {
    const status = searchParams.get('status');
    
    switch (status) {
      case 'pending_verification':
        return {
          type: 'warning',
          title: 'Services Under Review',
          message: 'Your services are currently under admin verification. You will be notified once they are approved.',
          action: 'Contact support if you have questions'
        };
      case 'offline':
        return {
          type: 'info',
          title: 'Offline Mode',
          message: 'Your services are saved offline and will sync when connection is restored.',
          action: 'Check connection status'
        };
      default:
        return {
          type: 'success',
          title: 'Your Services',
          message: 'Manage your services and track their performance.',
          action: 'Create new service'
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 bg-[#010816]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Service Management</h1>
                <p className="text-slate-400">Manage and track your service listings</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Welcome back, {profileState.profile?.displayName || 'Provider'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div className={`mx-auto max-w-4xl mt-8 p-6 rounded-xl border ${
          statusMessage.type === 'warning' ? 'border-yellow-500/20 bg-yellow-500/10' :
          statusMessage.type === 'info' ? 'border-blue-500/20 bg-blue-500/10' :
          'border-green-500/20 bg-green-500/10'
        }`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                statusMessage.type === 'warning' ? 'bg-yellow-100' :
                statusMessage.type === 'info' ? 'bg-blue-100' :
                'bg-green-100'
              }`}>
                {statusMessage.type === 'warning' && (
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2a1 1 0 0 0-2h6a1 1 0 0 0-2 0 1v2a1 1 0 0 0 2z"/>
                  </svg>
                )}
                {statusMessage.type === 'info' && (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-1a1 1 0 0-0-2h6a1 1 0 0 0-2 0 1v2a1 1 0 0 0 2z"/>
                  </svg>
                )}
                {statusMessage.type === 'success' && (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 0 0 0-2l2 2a2 2 0 0 0 2z"/>
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div>
                <h3 className={`text-lg font-semibold ${
                  statusMessage.type === 'warning' ? 'text-yellow-600' :
                  statusMessage.type === 'info' ? 'text-blue-600' :
                  'text-green-600'
                }`}>
                  {statusMessage.title}
                </h3>
                <p className="text-slate-300 mt-2">
                  {statusMessage.message}
                </p>
                <button
                  onClick={() => {
                    if (statusMessage.type === 'warning' || statusMessage.type === 'info') {
                      navigate('/provider/new-listing');
                    } else {
                      navigate('/provider/new-listing');
                    }
                  }}
                  className={`mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusMessage.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                    statusMessage.type === 'info' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {statusMessage.action}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Services</h2>
          <p className="text-slate-400">Create, edit, and manage your service offerings</p>
        </div>

        {/* Services List Placeholder */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v16a1 1 0 0 0-1.01 1.01-1.41 0 0-1.41-1.41 0A2.83 2.83 0 0 0-2.83C6.28 9 5.17 5.17 0 0 5.17-5.17 0-2.83C9.5 16 17 2 17 0 0 2.17S16 17 2 17 0 0z"/>
              </svg>
              <p className="mt-2 text-slate-600">Loading your services...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderServices;
