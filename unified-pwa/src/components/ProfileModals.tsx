import React, { useState } from 'react';

// Password Modal Component
export const PasswordModal = ({ show, onClose, onSubmit }: {
  show: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => void;
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPassword.test(newPassword)) {
      alert('Password must be 8+ chars with uppercase, lowercase, number, and special character.');
      return;
    }
    onSubmit(currentPassword, newPassword);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">Change Password</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
              placeholder="Enter current password"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
};

// Address Modal Component
export const AddressModal = ({ 
  show, 
  onClose, 
  onSubmit, 
  addressForm, 
  setAddressForm, 
  isEditing 
}: {
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
  addressForm: { type: string; address: string };
  setAddressForm: (form: { type: string; address: string }) => void;
  isEditing: boolean;
}) => {
  const handleSubmit = () => {
    if (!addressForm.address.trim()) {
      alert('Please enter an address!');
      return;
    }
    onSubmit();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">
          {isEditing ? 'Edit Address' : 'Add New Address'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Address Type</label>
            <select
              value={addressForm.type}
              onChange={(e) => setAddressForm({...addressForm, type: e.target.value})}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
            >
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-2">Address</label>
            <textarea
              value={addressForm.address}
              onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none resize-none"
              rows={3}
              placeholder="Enter complete address"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors"
          >
            {isEditing ? 'Update Address' : 'Add Address'}
          </button>
        </div>
      </div>
    </div>
  );
};
