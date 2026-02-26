import React, { useState, useRef, useEffect } from 'react';
import { Bell, Shield, Palette, CreditCard, User, Lock, HelpCircle, Camera, Upload, RefreshCw, Send } from 'lucide-react';
import { EventManager } from '../utils/events';
import { useProviderProfile } from '../contexts/ProviderProfileContext';
import { API_BASE } from '../config/api';

interface SupportChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

const ProviderSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    bookingReminders: true,
    marketingEmails: false
  });

  const [profile, setProfile] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    description: '',
    profilePhoto: ''
  });

  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [supportAdminId, setSupportAdminId] = useState('');
  const [supportAdminName, setSupportAdminName] = useState('Admin Support');
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>([]);
  const [supportDraft, setSupportDraft] = useState('');
  const [supportChatLoading, setSupportChatLoading] = useState(false);
  const [supportChatSending, setSupportChatSending] = useState(false);
  const [supportChatError, setSupportChatError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supportChatEndRef = useRef<HTMLDivElement>(null);
  const { state: providerState, updateProfile, updateProfilePhoto } = useProviderProfile();
  const userId = localStorage.getItem('userId') || 'anonymous';
  const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL || 'support@servoley.com').trim();
  const profileStorageKey = `providerProfile:${userId}`;
  const notificationsStorageKey = `providerNotifications:${userId}`;

  const settingsTabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ];

  const handleProfilePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Local preview for settings page
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, profilePhoto: reader.result as string }));
    };
    reader.readAsDataURL(file);

    // Update shared provider profile (context + backend)
    try {
      const url = await updateProfilePhoto(file);
      setProfile(prev => ({ ...prev, profilePhoto: url }));
    } catch (err) {
      console.error('Failed to update provider profile photo', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const saveChanges = async () => {
    setIsLoading(true);
    setSaveMessage('');
    
    try {
      await updateProfile({
        displayName: profile.businessName,
        companyName: profile.businessName,
        contactEmail: profile.email,
        phoneNumber: profile.phone,
        serviceArea: profile.address,
        serviceCategories: profile.category ? [profile.category] : [],
        profilePhoto: profile.profilePhoto,
        emailNotifications: notifications.email,
        smsNotifications: notifications.sms
      });
      
      // Save to localStorage for persistence
      localStorage.setItem(profileStorageKey, JSON.stringify(profile));
      localStorage.setItem(notificationsStorageKey, JSON.stringify(notifications));
      
      // Emit event to notify other components
      EventManager.getInstance().emit('PROFILE_UPDATED');
      
      setSaveMessage('Changes saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save changes. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('appTheme', newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (theme: 'dark' | 'light' | 'system') => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('dark', 'light');
    
    // Apply new theme class
    if (theme !== 'system') {
      root.classList.add(theme);
    }
    
    // Set theme color meta tag
    const themeColor = theme === 'dark' ? '#0f172a' : theme === 'light' ? '#ffffff' : '#0f172a';
    root.style.setProperty('--theme-bg', themeColor);
    root.style.setProperty('--theme-text', theme === 'dark' ? '#ffffff' : '#000000');
  };

  const parseJsonSafely = async (response: Response) => {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const loadSupportConversation = async (adminId: string, silent = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSupportChatError('Session expired. Please login again.');
      return;
    }

    try {
      if (!silent) setSupportChatLoading(true);
      const response = await fetch(
        `${API_BASE}/communication/messages/conversation/${encodeURIComponent(adminId)}?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || `Failed to load live chat (${response.status})`);
      }

      const messages = Array.isArray(payload?.data?.messages) ? payload.data.messages : [];
      setSupportMessages(messages);
      setSupportChatError('');
    } catch (error: any) {
      setSupportChatError(error?.message || 'Failed to load live chat conversation.');
    } finally {
      if (!silent) setSupportChatLoading(false);
    }
  };

  const initializeSupportChat = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSupportChatError('Session expired. Please login again.');
      return;
    }

    try {
      setSupportChatLoading(true);
      const response = await fetch(`${API_BASE}/communication/support/admin-contact`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || `Failed to connect support chat (${response.status})`);
      }

      const admin = payload?.data?.admin;
      if (!admin?.id) {
        throw new Error('Support admin is not available right now.');
      }

      setSupportAdminId(String(admin.id));
      setSupportAdminName(String(admin.name || 'Admin Support'));
      await loadSupportConversation(String(admin.id), true);
      setSupportChatError('');
    } catch (error: any) {
      setSupportChatError(error?.message || 'Failed to connect support chat.');
    } finally {
      setSupportChatLoading(false);
    }
  };

  const sendSupportMessage = async () => {
    const token = localStorage.getItem('token');
    const trimmed = supportDraft.trim();

    if (!token) {
      setSupportChatError('Session expired. Please login again.');
      return;
    }

    if (!supportAdminId) {
      setSupportChatError('Support admin contact is not loaded yet.');
      return;
    }

    if (!trimmed) return;

    try {
      setSupportChatSending(true);
      const response = await fetch(`${API_BASE}/communication/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: supportAdminId,
          content: trimmed
        })
      });
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || `Failed to send message (${response.status})`);
      }

      const createdMessage = payload?.data?.message;
      setSupportDraft('');
      setSupportChatError('');

      if (createdMessage?.id) {
        setSupportMessages((prev) => [...prev, createdMessage]);
      } else {
        await loadSupportConversation(supportAdminId, true);
      }
    } catch (error: any) {
      setSupportChatError(error?.message || 'Failed to send support message.');
    } finally {
      setSupportChatSending(false);
    }
  };

  // Load saved data on component mount
  React.useEffect(() => {
    const savedProfile = localStorage.getItem(profileStorageKey);
    const savedNotifications = localStorage.getItem(notificationsStorageKey);
    
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    // Listen for profile updates from settings
    const eventManager = EventManager.getInstance();
    
    const handleProfileUpdate = () => {
      const savedProfile = localStorage.getItem(profileStorageKey);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
      }
    };
    
    eventManager.subscribe('PROFILE_UPDATED', handleProfileUpdate);
    
    return () => {
      eventManager.unsubscribe('PROFILE_UPDATED', handleProfileUpdate);
    };
  }, [profileStorageKey, notificationsStorageKey]);

  useEffect(() => {
    if (!providerState.profile) return;

    setProfile((prev) => ({
      ...prev,
      businessName: providerState.profile.companyName || providerState.profile.displayName || prev.businessName,
      email: providerState.profile.contactEmail || prev.email,
      phone: providerState.profile.phoneNumber || prev.phone,
      address: providerState.profile.serviceArea || prev.address,
      category: providerState.profile.serviceCategories?.[0] || prev.category,
      profilePhoto: providerState.profile.profilePhoto || prev.profilePhoto
    }));

    setNotifications((prev) => ({
      ...prev,
      email: providerState.profile?.emailNotifications ?? prev.email,
      sms: providerState.profile?.smsNotifications ?? prev.sms
    }));
  }, [providerState.profile]);

  useEffect(() => {
    if (activeTab !== 'help') return;
    initializeSupportChat();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'help' || !supportAdminId) return;

    const interval = window.setInterval(() => {
      loadSupportConversation(supportAdminId, true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [activeTab, supportAdminId]);

  useEffect(() => {
    if (activeTab !== 'help') return;
    supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages, activeTab]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400">Manage your account settings and preferences</p>
          </div>
          {saveMessage && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              saveMessage.includes('success') 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-3 sm:p-4">
              <nav className="space-y-1 max-h-[65vh] overflow-auto lg:max-h-none">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-400 border-l-4 border-cyan-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <tab.icon size={18} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sm:p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <User size={20} className="text-cyan-400" />
                    Profile Settings
                  </h2>
                  <div className="space-y-6">
                    {/* Profile Photo */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-4">Profile Photo</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden">
                            {profile.profilePhoto ? (
                              <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User size={40} className="text-slate-500" />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center text-white border-2 border-slate-800"
                          >
                            <Camera size={14} />
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePhotoChange}
                            className="hidden"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-2">Upload a new profile photo</p>
                          <p className="text-xs text-slate-500">Recommended: Square image, at least 400x400px</p>
                        </div>
                      </div>
                    </div>

                    {/* Profile Fields */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Business Name</label>
                      <input
                        type="text"
                        value={profile.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                      <textarea
                        value={profile.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows={3}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Business Category</label>
                      <select
                        value={profile.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option>Home Services</option>
                        <option>Electrical</option>
                        <option>Plumbing</option>
                        <option>Cleaning</option>
                        <option>Landscaping</option>
                        <option>Painting</option>
                        <option>HVAC</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Business Description</label>
                      <textarea
                        value={profile.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    
                    {/* Save Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
                      <button
                        onClick={saveChanges}
                        disabled={isLoading}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setProfile({
                            businessName: 'Pro Services',
                            email: 'provider@example.com',
                            phone: '+1234567890',
                            address: '123 Business St, City, State 12345',
                            category: 'Home Services',
                            description: 'Professional home services provider with 5+ years of experience',
                            profilePhoto: ''
                          });
                          setSaveMessage('Changes reverted to defaults');
                          setTimeout(() => setSaveMessage(''), 3000);
                        }}
                        className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Reset to Defaults
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Bell size={20} className="text-cyan-400" />
                    Notification Preferences
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-slate-700">
                        <div>
                          <p className="text-white font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-slate-400 text-sm">
                            {key === 'email' && 'Receive email notifications about bookings and updates'}
                            {key === 'sms' && 'Get SMS alerts for urgent booking requests'}
                            {key === 'push' && 'Browser push notifications for real-time updates'}
                            {key === 'bookingReminders' && 'Reminders before scheduled bookings'}
                            {key === 'marketingEmails' && 'Promotional offers and feature updates'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleNotificationChange(key, e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            value ? 'bg-cyan-500' : 'bg-slate-600'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                              value ? 'translate-x-5' : 'translate-x-0'
                            }`}></div>
                          </div>
                        </label>
                      </div>
                    ))}
                    <div className="pt-4">
                      <button
                        onClick={saveChanges}
                        disabled={isLoading}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Save Notification Settings
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Lock size={20} className="text-cyan-400" />
                    Security Settings
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-3">Password</h3>
                      <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors">
                        Change Password
                      </button>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-3">Two-Factor Authentication</h3>
                      <p className="text-slate-400 mb-3">Add an extra layer of security to your account</p>
                      <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CreditCard size={20} className="text-cyan-400" />
                    Payment Methods
                  </h2>
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">Manage your payment methods in the Wallet section</p>
                    <button 
                      onClick={() => window.location.href = '/provider/payouts'}
                      className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Go to Wallet
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Palette size={20} className="text-cyan-400" />
                    Appearance
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                      <select 
                        value={theme}
                        onChange={(e) => handleThemeChange(e.target.value as 'dark' | 'light' | 'system')}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="dark">Dark (Default)</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                      <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Spanish</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Shield size={20} className="text-cyan-400" />
                    Privacy Settings
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-3">Profile Visibility</h3>
                      <p className="text-slate-400 mb-3">Control who can see your profile and information</p>
                      <select className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        <option>Public - Everyone can see</option>
                        <option>Registered users only</option>
                        <option>Private - Hidden</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'help' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <HelpCircle size={20} className="text-cyan-400" />
                    Help & Support
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-3">Contact Support</h3>
                      <p className="text-slate-400 mb-4">Reach support team by email or live chat.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={() => {
                            window.location.href = `mailto:${supportEmail}`;
                          }}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Email Support
                        </button>
                        <button
                          onClick={initializeSupportChat}
                          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={16} />
                          Reconnect Live Chat
                        </button>
                        <button
                          onClick={() => {
                            setSaveMessage('Help Center content is being prepared. Use live chat for immediate support.');
                            setTimeout(() => setSaveMessage(''), 4000);
                          }}
                          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
                        >
                          Help Center
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <div>
                          <h3 className="text-white font-medium">Live Chat with Admin</h3>
                          <p className="text-slate-400 text-sm">
                            Connected to: <span className="text-slate-200">{supportAdminName}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => supportAdminId && loadSupportConversation(supportAdminId)}
                          disabled={!supportAdminId || supportChatLoading}
                          className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                        >
                          Refresh Chat
                        </button>
                      </div>

                      {supportChatError && (
                        <div className="mb-3 px-3 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm">
                          {supportChatError}
                        </div>
                      )}

                      <div className="h-72 overflow-y-auto rounded-lg border border-slate-600 bg-slate-800/70 p-3 space-y-3">
                        {supportChatLoading ? (
                          <p className="text-slate-400 text-sm">Loading live chat...</p>
                        ) : supportMessages.length === 0 ? (
                          <p className="text-slate-400 text-sm">No messages yet. Start a conversation with admin support.</p>
                        ) : (
                          supportMessages.map((message) => {
                            const isMine = message.senderId === userId;
                            return (
                              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div
                                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                                    isMine ? 'bg-cyan-600 text-white' : 'bg-slate-600 text-slate-100'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                  <p className={`text-[11px] mt-1 ${isMine ? 'text-cyan-100' : 'text-slate-300'}`}>
                                    {new Date(message.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={supportChatEndRef} />
                      </div>

                      <div className="mt-3 flex gap-2">
                        <textarea
                          value={supportDraft}
                          onChange={(e) => setSupportDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (!supportChatSending) {
                                sendSupportMessage();
                              }
                            }
                          }}
                          rows={2}
                          placeholder="Write your message to admin support..."
                          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button
                          onClick={sendSupportMessage}
                          disabled={!supportDraft.trim() || supportChatSending || !supportAdminId}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          {supportChatSending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send size={16} />
                          )}
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderSettings;

