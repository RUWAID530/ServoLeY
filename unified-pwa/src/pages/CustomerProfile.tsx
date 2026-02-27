import React, { useState, useEffect } from 'react';
import { ChevronRight, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { PasswordModal, AddressModal } from '../components/ProfileModals';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8086';
const DEFAULT_NOTIFICATION_PREFERENCES = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: true,
  orderUpdates: true,
  messages: true,
  promotions: false,
  systemAlerts: true
};

const parseJsonSafe = async (response: Response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_AVATAR_DIMENSION = 720;
const AVATAR_OUTPUT_QUALITY = 0.82;

const readImageFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read selected image'));
    };
    image.src = objectUrl;
  });

const resizeAvatarToDataUrl = async (file: File): Promise<string> => {
  const image = await readImageFile(file);
  const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(image.width, image.height));
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Image processing is unavailable in this browser');
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL('image/jpeg', AVATAR_OUTPUT_QUALITY);
};

interface SecuritySession {
  id: string;
  label: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface SecuritySummary {
  twoFactorEnabled: boolean;
  accountVerified: boolean;
  accountBlocked: boolean;
  passwordLastChangedAt: string | null;
  activeSessions: SecuritySession[];
}

const normalizeUser = (rawUser: any) => {
  if (!rawUser) return null;

  const profile = rawUser.profile || rawUser.profiles || {};
  const avatar = profile.avatar || rawUser.avatar || null;
  const resolvedAvatar = avatar && avatar.startsWith('/uploads')
    ? `${API_BASE}${avatar}`
    : avatar;

  return {
    id: rawUser.id,
    userType: rawUser.userType,
    email: rawUser.email || '',
    phone: rawUser.phone || '',
    firstName: profile.firstName || rawUser.firstName || '',
    lastName: profile.lastName || rawUser.lastName || '',
    avatar: resolvedAvatar
  };
};

const persistUserProfile = (nextUser: any) => {
  if (!nextUser) return;

  const existingRaw = localStorage.getItem('userData');
  let existing = {};
  if (existingRaw) {
    try {
      existing = JSON.parse(existingRaw) || {};
    } catch {
      existing = {};
    }
  }

  const merged = { ...existing, ...nextUser };
  localStorage.setItem('userData', JSON.stringify(merged));
  localStorage.setItem('firstName', merged.firstName || '');
  localStorage.setItem('lastName', merged.lastName || '');
  localStorage.setItem('email', merged.email || '');
  localStorage.setItem('phone', merged.phone || '');

  window.dispatchEvent(new CustomEvent('customer-profile-updated', { detail: merged }));
};

const getAuthToken = () => {
  const directToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (directToken) return directToken;

  const userId = localStorage.getItem('userId');
  const sessionId = localStorage.getItem('currentSessionId') || 'default';
  if (userId) {
    const scopedToken =
      localStorage.getItem(`token_${userId}_${sessionId}`) ||
      localStorage.getItem(`token_${userId}`) ||
      localStorage.getItem(`accessToken_${userId}_${sessionId}`) ||
      localStorage.getItem(`accessToken_${userId}`);
    if (scopedToken) return scopedToken;
  }

  const tokenKey = Object.keys(localStorage).find((key) => key.startsWith('token_') || key.startsWith('accessToken_'));
  return tokenKey ? localStorage.getItem(tokenKey) || '' : '';
};

const getStoredUser = () => {
  const raw = localStorage.getItem('userData');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed) return null;
    return {
      id: parsed.id || localStorage.getItem('userId') || '',
      userType: parsed.userType || 'CUSTOMER',
      email: parsed.email || localStorage.getItem('email') || '',
      phone: parsed.phone || localStorage.getItem('phone') || '',
      firstName: parsed.firstName || localStorage.getItem('firstName') || '',
      lastName: parsed.lastName || localStorage.getItem('lastName') || '',
      avatar: parsed.avatar || null
    };
  } catch {
    return null;
  }
};

const fetchWithFallback = async (path: string, options: RequestInit = {}) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseCandidates = [API_BASE, 'http://localhost:8086', 'http://localhost:8084', 'http://localhost:8083']
    .filter(Boolean)
    .map((base) => String(base).replace(/\/$/, ''));
  const endpoints = [...new Set(baseCandidates)].map((base) => `${base}${normalizedPath}`);

  let lastError: any = null;
  for (let i = 0; i < endpoints.length; i += 1) {
    try {
      const response = await fetch(endpoints[i], options);
      if (response.status === 404 && i < endpoints.length - 1) {
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Network error. Backend not reachable.');
};

const formatSecurityTime = (isoDate?: string | null) => {
  if (!isoDate) return 'Not available';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const CustomerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [active, setActive] = useState<'home' | 'services' | 'wallet' | 'support' | 'profile'>('profile');
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    language: 'English'
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({ type: 'Home', address: '' });
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState('');
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securityNotice, setSecurityNotice] = useState('');
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  const handleNavigate = (page: 'home' | 'services' | 'wallet' | 'support' | 'profile') => {
    setActive(page);
    
    // Navigate to the appropriate route
    switch (page) {
      case 'home':
        window.location.href = '/customer/home';
        break;
      case 'services':
        window.location.href = '/customer/services';
        break;
      case 'wallet':
        window.location.href = '/customer/wallet';
        break;
      case 'support':
        window.location.href = '/customer/support/dashboard';
        break;
      case 'profile':
        window.location.href = '/customer/profile';
        break;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const fallbackUser = getStoredUser();
      try {
        const token = getAuthToken();
        if (!token) {
          if (fallbackUser) {
            setUserData(fallbackUser);
            setSecurityNotice('Using saved profile data. Please login again to sync latest details.');
          } else {
            setUserData(null);
          }
          return;
        }

        const response = await fetchWithFallback('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const result = await parseJsonSafe(response);
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to fetch user profile');
        }

        const normalized = normalizeUser(result?.data?.user);
        if (!normalized) {
          throw new Error('Profile data missing in response');
        }
        setUserData(normalized);
        persistUserProfile(normalized);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (fallbackUser) {
          setUserData(fallbackUser);
          setSecurityNotice('Unable to reach server. Showing saved profile data.');
        } else {
          setUserData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setPreferencesLoading(true);
        const token = getAuthToken();
        if (!token) {
          return;
        }

        const response = await fetchWithFallback('/api/communication/notifications/preferences', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const result = await parseJsonSafe(response);
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to load preferences');
        }

        setPreferences({
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...(result?.data?.preferences || {})
        });
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setPreferencesLoading(false);
      }
    };

    loadPreferences();
  }, []);

  useEffect(() => {
    loadSecuritySummary();
  }, []);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      alert('Image is too large. Please use an image smaller than 5 MB.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      console.log('Uploading profile photo:', file.name);
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setUserData(prev => ({ ...prev, avatar: previewUrl }));

      // Upload to server
      const fileDataUrl = await resizeAvatarToDataUrl(file);

      const response = await fetchWithFallback('/api/auth/me/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ avatar: fileDataUrl })
      });

      const result = await parseJsonSafe(response);
      
      if (!response.ok || !result?.success) {
        const validationMessage = Array.isArray(result?.errors) && result.errors.length > 0
          ? String(result.errors[0]?.msg || '')
          : '';
        throw new Error(validationMessage || result?.message || 'Upload failed');
      }

      const updatedAvatar = result?.data?.avatar || fileDataUrl;
      const normalizedAvatar = updatedAvatar.startsWith('/uploads')
        ? `${API_BASE}${updatedAvatar}`
        : updatedAvatar;
      const nextUserData = { ...(userData || {}), avatar: normalizedAvatar };
      setUserData(nextUserData);
      persistUserProfile(nextUserData);
      alert('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload profile photo. Please try again.';
      alert(message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const loadSecuritySummary = async () => {
    try {
      setSecurityLoading(true);
      const token = getAuthToken();
      if (!token) {
        setSecuritySummary(null);
        return;
      }

      const response = await fetchWithFallback('/api/auth/me/security', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await parseJsonSafe(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to load security information');
      }

      const security = result?.data?.security || {};
      setSecuritySummary({
        twoFactorEnabled: !!security.twoFactorEnabled,
        accountVerified: !!security.accountVerified,
        accountBlocked: !!security.accountBlocked,
        passwordLastChangedAt: security.passwordLastChangedAt || null,
        activeSessions: Array.isArray(security.activeSessions) ? security.activeSessions : []
      });
    } catch (error: any) {
      console.error('Error loading security summary:', error);
      setSecurityNotice(error?.message || 'Failed to load security details.');
      setSecuritySummary(null);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handlePersonalDataChange = (field: string, value: string) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePersonal = async () => {
    try {
      console.log('Saving personal data:', personalData);
      
      const response = await fetchWithFallback('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(personalData)
      });

      const result = await parseJsonSafe(response);
      
      if (response.ok && result?.success) {
        const normalizedUser = normalizeUser(result?.data?.user);

        // Update local state with saved data
        setUserData(normalizedUser);
        persistUserProfile(normalizedUser);
        
        alert('Personal details saved successfully!');
        setEditingPersonal(false);
      } else {
        throw new Error(result.message || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving personal data:', error);
      alert('Failed to save personal details. Please try again.');
    }
  };

  const handleResetPersonal = () => {
    setPersonalData({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      phone: userData?.phone || '',
      email: userData?.email || '',
      language: 'English'
    });
    setEditingPersonal(false);
  };

  const handleEditPersonal = () => {
    setPersonalData({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      phone: userData?.phone || '',
      email: userData?.email || '',
      language: 'English'
    });
    setEditingPersonal(true);
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetchWithFallback('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const result = await parseJsonSafe(response);
      if (response.ok && result?.success) {
        setSecurityNotice(result?.message || 'Password changed successfully.');
        setShowPasswordModal(false);
        await loadSecuritySummary();
      } else {
        setSecurityNotice(result?.message || 'Failed to change password. Please check your current password.');
      }
    } catch (error) {
      setSecurityNotice('Error changing password. Please try again.');
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({ type: address.type, address: address.addr });
    setShowAddressModal(true);
  };

  const handleRemoveAddress = (address) => {
    if (confirm(`Are you sure you want to remove the ${address.type} address?`)) {
      alert('Address removed successfully!');
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ type: 'Home', address: '' });
    setShowAddressModal(true);
  };

  const handleAddressSubmit = () => {
    if (editingAddress) {
      alert('Address updated successfully!');
    } else {
      alert('New address added successfully!');
    }
    setShowAddressModal(false);
    setAddressForm({ type: 'Home', address: '' });
  };

  const updatePreference = (key: keyof typeof DEFAULT_NOTIFICATION_PREFERENCES, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setPreferencesMessage('');
  };

  const handleUpdatePreferences = async () => {
    try {
      setSavingPreferences(true);
      setPreferencesMessage('');
      const token = getAuthToken();
      if (!token) {
        throw new Error('Please login again to update preferences.');
      }

      const response = await fetchWithFallback('/api/communication/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      const result = await parseJsonSafe(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to update preferences');
      }

      setPreferences({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(result?.data?.preferences || preferences)
      });
      setPreferencesMessage('Preferences updated successfully.');
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      setPreferencesMessage(error?.message || 'Failed to update preferences.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleManagePassword = () => {
    setShowPasswordModal(true);
  };

  const handleToggle2FA = () => {
    setSecurityNotice('2FA enrollment will be enabled by support verification. Contact support to activate it for your account.');
    navigate('/customer/support/dashboard');
  };

  const handleReviewDevices = () => {
    setShowSessionsModal(true);
  };

  const handleSupportTickets = () => {
    navigate('/customer/support/dashboard');
  };

  const handleTermsOfService = () => {
    window.open('/terms-of-service', '_blank');
  };

  const handlePrivacyPolicy = () => {
    window.open('/privacy-policy', '_blank');
  };

  if (loading) {
    return (
      <div className="pb-32 flex justify-center items-center h-64">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="pb-32 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-white">Unable to load profile</div>
          <button
            onClick={() => navigate('/auth')}
            className="mt-3 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Profile Header Gradient */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 -mt-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={userData?.avatar || "https://picsum.photos/seed/user123/100/100.jpg"} 
                alt="Profile" 
                className="w-16 h-16 rounded-full border-4 border-white/20 object-cover cursor-pointer"
                onClick={() => document.getElementById('profile-photo-upload')?.click()}
              />
              <button 
                onClick={() => document.getElementById('profile-photo-upload')?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white border-2 border-white/30 transition-colors"
                disabled={uploading}
              >
                {uploading ? (
                  <div className="w-3 h-3 border-2 border-white/50 border-t-transparent animate-spin"></div>
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                id="profile-photo-upload"
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoUpload}
                className="hidden"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{userData.firstName} {userData.lastName}</h1>
              <p className="text-white/80 text-sm">{userData.phone} | {userData.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleEditPersonal}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full backdrop-blur-sm transition-colors border border-white/30"
            >
              Edit Profile
            </button>
            <button 
              onClick={handleChangePassword}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full backdrop-blur-sm transition-colors border border-white/30"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Top Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Personal Details */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">Personal Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 px-4">
                   <label className="text-xs text-gray-400 block mb-1">First Name</label>
                   {editingPersonal ? (
                     <input
                       type="text"
                       value={personalData.firstName}
                       onChange={(e) => handlePersonalDataChange('firstName', e.target.value)}
                       className="w-full bg-transparent text-sm text-white border-b border-gray-600 focus:border-purple-500 outline-none"
                     />
                   ) : (
                     <div className="text-sm text-white">{userData.firstName}</div>
                   )}
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 px-4">
                   <label className="text-xs text-gray-400 block mb-1">Last Name</label>
                   {editingPersonal ? (
                     <input
                       type="text"
                       value={personalData.lastName}
                       onChange={(e) => handlePersonalDataChange('lastName', e.target.value)}
                       className="w-full bg-transparent text-sm text-white border-b border-gray-600 focus:border-purple-500 outline-none"
                     />
                   ) : (
                     <div className="text-sm text-white">{userData.lastName}</div>
                   )}
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 px-4">
                   <label className="text-xs text-gray-400 block mb-1">Phone</label>
                   {editingPersonal ? (
                     <input
                       type="tel"
                       value={personalData.phone}
                       onChange={(e) => handlePersonalDataChange('phone', e.target.value)}
                       className="w-full bg-transparent text-sm text-white border-b border-gray-600 focus:border-purple-500 outline-none"
                     />
                   ) : (
                     <div className="text-sm text-white">{userData.phone}</div>
                   )}
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 px-4">
                   <label className="text-xs text-gray-400 block mb-1">Email</label>
                   {editingPersonal ? (
                     <input
                       type="email"
                       value={personalData.email}
                       onChange={(e) => handlePersonalDataChange('email', e.target.value)}
                       className="w-full bg-transparent text-sm text-white border-b border-gray-600 focus:border-purple-500 outline-none"
                     />
                   ) : (
                     <div className="text-sm truncate text-white">{userData.email}</div>
                   )}
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 px-4">
                   <label className="text-xs text-gray-400 block mb-1">Preferred Language</label>
                   {editingPersonal ? (
                     <select
                       value={personalData.language}
                       onChange={(e) => handlePersonalDataChange('language', e.target.value)}
                       className="w-full bg-transparent text-sm text-white border-b border-gray-600 focus:border-purple-500 outline-none"
                     >
                       <option value="English">English</option>
                       <option value="Tamil">Tamil</option>
                       <option value="Hindi">Hindi</option>
                     </select>
                   ) : (
                     <div className="text-sm text-white">English</div>
                   )}
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                {editingPersonal ? (
                  <>
                    <button 
                      onClick={handleSavePersonal}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-full font-medium transition-colors"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={handleResetPersonal}
                      className="flex-1 bg-pink-100 hover:bg-pink-200 text-slate-900 py-2.5 rounded-full font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleEditPersonal}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-full font-medium transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Wallet Summary */}
          <div className="bg-pink-50 rounded-3xl p-6 flex flex-col justify-between text-slate-900 relative overflow-hidden">
             <div className="z-10 relative">
               <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-slate-800">Wallet</h2>
                  </div>
                  <button 
                    onClick={() => navigate('/customer/wallet')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full text-sm font-medium"
                  >
                    Add Money
                  </button>
               </div>
               
               <div className="mt-8">
                 <div className="text-sm text-slate-600 mb-1">Balance</div>
                 <div className="text-3xl font-bold text-slate-900">Rs 0</div>
               </div>
               
               <div className="mt-6 text-sm text-slate-700">
                 Rewards: No active offers
               </div>
             </div>
             {/* Decorative circle */}
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-200 rounded-full opacity-50 z-0"></div>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4">Saved Addresses</h2>
          <div className="space-y-4">
            {[
              { type: 'Home', addr: '12, River View Apartments, Tirunelveli 627001' },
              { type: 'Work', addr: 'B-204, Tech Park, Palayamkottai 627011' }
            ].map((addr, idx) => (
              <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-700 gap-4">
                <div>
                  <div className="font-bold text-white mb-1">{addr.type}</div>
                  <div className="text-sm text-gray-400">{addr.addr}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditAddress(addr)}
                    className="px-4 py-1.5 bg-purple-600 text-white text-xs rounded-full font-medium"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleRemoveAddress(addr)}
                    className="px-4 py-1.5 bg-pink-100 text-slate-900 text-xs rounded-full font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={handleAddAddress}
              className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors"
            >
              Add New Address
            </button>
          </div>
        </div>

        {/* Preferences & Security Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Preferences */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 h-full">
            <h2 className="text-lg font-bold text-white mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: 'pushEnabled',
                    label: 'Push Notifications',
                    value: preferences.pushEnabled
                  },
                  {
                    key: 'emailEnabled',
                    label: 'Email Notifications',
                    value: preferences.emailEnabled
                  },
                  {
                    key: 'smsEnabled',
                    label: 'SMS Notifications',
                    value: preferences.smsEnabled
                  },
                  {
                    key: 'orderUpdates',
                    label: 'Service Reminders',
                    value: preferences.orderUpdates
                  },
                  {
                    key: 'messages',
                    label: 'Chat Messages',
                    value: preferences.messages
                  },
                  {
                    key: 'promotions',
                    label: 'Offers & Promotions',
                    value: preferences.promotions
                  },
                  {
                    key: 'systemAlerts',
                    label: 'System Alerts',
                    value: preferences.systemAlerts
                  }
                ].map((item) => (
                  <div key={item.key} className="bg-slate-900 border border-slate-700 rounded-2xl p-3 text-sm">
                    <div className="text-gray-400 text-xs mb-2">{item.label}</div>
                    <button
                      type="button"
                      disabled={preferencesLoading}
                      onClick={() => updatePreference(item.key as keyof typeof DEFAULT_NOTIFICATION_PREFERENCES, !item.value)}
                      className={`w-full py-2 rounded-full text-xs font-semibold transition-colors ${
                        item.value
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      } disabled:opacity-60`}
                    >
                      {item.value ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
              {preferencesMessage && (
                <p className="text-xs text-cyan-300">{preferencesMessage}</p>
              )}
              <button 
                onClick={handleUpdatePreferences}
                disabled={preferencesLoading || savingPreferences}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-3 rounded-full font-medium mt-2"
              >
                {savingPreferences ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 h-full">
            <h2 className="text-lg font-bold text-white mb-4">Security</h2>
            <div className="space-y-3">
              {securityNotice && (
                <p className="text-xs text-cyan-300">{securityNotice}</p>
              )}
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex justify-between items-center">
                <div>
                   <div className="font-bold text-sm text-white">Two-Factor Authentication</div>
                   <div className="text-xs text-gray-400 mt-1">
                     {securityLoading
                       ? 'Checking status...'
                       : securitySummary?.twoFactorEnabled
                         ? 'Enabled for this account'
                         : 'Currently not enabled. Activate through support verification.'}
                   </div>
                </div>
                <button 
                  onClick={handleToggle2FA}
                  className="bg-pink-100 text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold"
                >
                  {securitySummary?.twoFactorEnabled ? 'Manage' : 'Enable'}
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex justify-between items-center">
                <div>
                   <div className="font-bold text-sm text-white">Manage Password</div>
                   <div className="text-xs text-gray-400 mt-1">
                     Last changed {formatSecurityTime(securitySummary?.passwordLastChangedAt)}
                   </div>
                </div>
                <button 
                  onClick={handleManagePassword}
                  className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-bold"
                >
                  Update
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex justify-between items-center">
                <div>
                   <div className="font-bold text-sm text-white">Logged-in Devices</div>
                   <div className="text-xs text-gray-400 mt-1">
                     {securityLoading
                       ? 'Checking active sessions...'
                       : `${securitySummary?.activeSessions?.length || 0} active session(s)`}
                   </div>
                </div>
                <button 
                  onClick={handleReviewDevices}
                  className="bg-pink-100 text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Support Banner */}
        <div className="rounded-3xl p-1 bg-gradient-to-r from-purple-500 to-pink-500">
           <div className="bg-slate-900 rounded-[22px] p-6">
              <h2 className="text-lg font-bold text-white mb-4">Need Help With Your Account?</h2>
              <div className="space-y-3">
                 <button 
                    onClick={handleSupportTickets}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors group"
                 >
                    <div className="text-left">
                       <div className="font-bold text-sm text-white">Contact Support</div>
                       <div className="text-xs text-gray-400">Chat, call or email our team</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white" />
                 </button>
                 <button 
                    onClick={handleSupportTickets}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors group"
                 >
                    <div className="text-left">
                       <div className="font-bold text-sm text-white">My Support Tickets</div>
                       <div className="text-xs text-gray-400">Track and manage requests</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white" />
                 </button>
              </div>
           </div>
        </div>

        {/* Footer Links & Logout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
                <h2 className="text-lg font-bold text-white mb-4">Legal</h2>
                <div className="space-y-3">
                    <button 
                      onClick={handleTermsOfService}
                      className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-900 text-left font-medium text-sm text-white"
                    >
                      Terms of Service
                    </button>
                    <button 
                      onClick={handlePrivacyPolicy}
                      className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-900 text-left font-medium text-sm text-white"
                    >
                      Privacy Policy
                    </button>
                </div>
            </div>
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 flex flex-col justify-center items-start">
               <h2 className="text-lg font-bold text-white mb-2">Log out of ServoLey</h2>
               <p className="text-gray-400 text-sm mb-4">You can log back in anytime</p>
               <button 
                 onClick={() => {
                   localStorage.clear();
                   navigate('/auth');
                 }}
                 className="w-full md:w-auto self-end bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold"
               >
                 Sign Out
               </button>
            </div>
        </div>

      </div>
      
      {/* Navigation */}
      <Navigation 
        active={active}
        onNavigate={handleNavigate}
      />
      
      {/* Modals */}
      <PasswordModal
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
      />

      {showSessionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Active Sessions</h3>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {(securitySummary?.activeSessions || []).length === 0 ? (
                <p className="text-sm text-slate-400">No active session data available.</p>
              ) : (
                (securitySummary?.activeSessions || []).map((session) => (
                  <div key={session.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-3">
                    <p className="text-sm font-semibold text-white">
                      {session.label}{session.isCurrent ? ' (Current)' : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">IP: {session.ipAddress || 'Unknown'}</p>
                    <p className="text-xs text-slate-400 mt-1 break-all">Device: {session.userAgent || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 mt-1">Last active: {formatSecurityTime(session.lastActiveAt)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setShowSessionsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AddressModal
        show={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSubmit={handleAddressSubmit}
        addressForm={addressForm}
        setAddressForm={setAddressForm}
        isEditing={!!editingAddress}
      />
    </div>
  );
}
export default CustomerProfile;
