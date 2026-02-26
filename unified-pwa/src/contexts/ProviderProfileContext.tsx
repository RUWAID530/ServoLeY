import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ProfileData } from '../types/Index';
import { updateProviderProfile, removeProviderPhoto } from '../services/api_exports_new_fixed';
import { API_BASE } from '../App';

// Define the shape of our provider profile state
interface ProviderProfileState {
  profile: ProfileData | null;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
}

// Define actions for our reducer
type ProviderProfileAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROFILE'; payload: ProfileData }
  | { type: 'UPDATE_PROFILE'; payload: Partial<ProfileData> }
  | { type: 'SET_UPDATING'; payload: boolean };

// Initial state
const initialState: ProviderProfileState = {
  profile: null,
  isLoading: true,
  error: null,
  isUpdating: false
};

// Reducer function
const providerProfileReducer = (
  state: ProviderProfileState,
  action: ProviderProfileAction
): ProviderProfileState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload, isLoading: false, error: null };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: state.profile ? { ...state.profile, ...action.payload } : null,
        isUpdating: false
      };
    case 'SET_UPDATING':
      return { ...state, isUpdating: action.payload };
    default:
      return state;
  }
};

// Create the context
const ProviderProfileContext = createContext<{
  state: ProviderProfileState;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<ProfileData>) => Promise<void>;
  optimisticUpdate: (updates: Partial<ProfileData>) => void;
  updateProfilePhoto: (file: File) => Promise<string>;
  removeProfilePhoto: () => Promise<void>;
}>({
  state: initialState,
  fetchProfile: async () => {},
  updateProfile: async () => {},
  optimisticUpdate: () => {},
  updateProfilePhoto: async () => "",
  removeProfilePhoto: async () => {}
});

// Provider component
export const ProviderProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(providerProfileReducer, initialState);
  const getProfileStorageKey = () => {
    const userId = localStorage.getItem('userId');
    const sessionId = localStorage.getItem('currentSessionId') || 'default';
    return userId ? `providerProfile:${userId}_${sessionId}` : 'providerProfile';
  };

  // Fetch provider profile from API
  const fetchProfile = useCallback(async () => {
    if (!state.isLoading) return; // Prevent multiple simultaneous fetches
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    const userId = localStorage.getItem('userId');
    const sessionId = localStorage.getItem('currentSessionId') || 'default';
    const token = localStorage.getItem(`token_${userId}_${sessionId}`) || localStorage.getItem('token');
    
    if (!token || !userId) {
      console.log('🔒 No token or userId, skipping profile fetch');
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      // Direct API call instead of using authService to avoid caching issues
      const response = await fetch(`${API_BASE}/api/auth/me?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('🔥 API Response Error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 Profile data received:', data);

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to fetch provider profile');
      }

      const userData = data.data.user || data.data;
      const providerData = userData.provider || {};
      const profileFields = userData.profile || {};
      
      const profileData: ProfileData = {
        displayName: providerData.businessName || userData.displayName || '',
        contactEmail: userData.email || '',
        phoneNumber: userData.phone || '',
        profilePhoto: profileFields.avatar || userData.avatar || providerData.avatar || '',
        companyName: providerData.businessName || userData.companyName || '',
        serviceCategories: [providerData.category || userData.category || ''],
        serviceArea: providerData.area || userData.serviceArea || '',
        emailNotifications: userData.emailNotifications !== undefined ? userData.emailNotifications : true,
        smsNotifications: userData.smsNotifications !== undefined ? userData.smsNotifications : true,
        workingDays: userData.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startTime: userData.startTime || '09:00',
        endTime: userData.endTime || '18:00'
      };

      dispatch({ type: 'SET_PROFILE', payload: profileData });
      
      // Also update localStorage to keep it in sync
      localStorage.setItem(getProfileStorageKey(), JSON.stringify(profileData));
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle AbortError (timeout) gracefully
      if (fetchError.name === 'AbortError') {
        console.log('⚠️ Profile fetch timed out - server may not be running');
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Server connection timed out. Please ensure the backend server is running on localhost:8086' 
        });
      } else {
        throw fetchError; // Re-throw other errors to be caught by outer catch
      }
    }
  }, []);

  // Update provider profile in API
  const updateProfile = useCallback(async (updates: Partial<ProfileData>) => {
    try {
      dispatch({ type: 'SET_UPDATING', payload: true });

      // Convert frontend profile data to backend format (provider profile basics)
      const backendUpdates: any = {};

      if (updates.displayName || updates.companyName) {
        backendUpdates.businessName = updates.displayName || updates.companyName;
      }
      if (updates.serviceCategories) {
        backendUpdates.category = updates.serviceCategories[0];
      }
      if (updates.serviceArea) {
        backendUpdates.area = updates.serviceArea;
        backendUpdates.address = updates.serviceArea;
      }
      if (updates.phoneNumber) {
        backendUpdates.phoneNumber = updates.phoneNumber;
      }
      backendUpdates.notificationPreferences = {};
      if (updates.emailNotifications !== undefined) {
        backendUpdates.notificationPreferences.emailEnabled = !!updates.emailNotifications;
      }
      if (updates.smsNotifications !== undefined) {
        backendUpdates.notificationPreferences.smsEnabled = !!updates.smsNotifications;
      }

      // Try to update profile with fallback handling for connection errors
      let serverData: any = {};
      
      try {
        const response = await updateProviderProfile(backendUpdates);
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to update provider profile');
        }
        if (response?.data) {
          serverData = response.data;
        }
      } catch (error) {
        console.error('API update failed:', error);
        throw error;
      }
      const serverUser = serverData?.user || {};
      const serverProvider = serverData?.provider || {};
      const serverProfile = serverData?.profile || serverUser?.profile || {};
      
      const updatedProfile: ProfileData = {
        ...state.profile,
        ...updates,
        // Use server data if available, otherwise use local updates
        displayName: serverProvider.businessName || serverData.businessName || updates.displayName || state.profile?.displayName || '',
        companyName: serverProvider.businessName || serverData.businessName || updates.companyName || state.profile?.companyName || '',
        contactEmail: serverUser.email || updates.contactEmail || state.profile?.contactEmail || '',
        phoneNumber: serverUser.phone || updates.phoneNumber || state.profile?.phoneNumber || '',
        profilePhoto: serverProfile.avatar || updates.profilePhoto || state.profile?.profilePhoto || '',
        serviceCategories: serverProvider.category
          ? [serverProvider.category]
          : (serverData.category ? [serverData.category] : (updates.serviceCategories || state.profile?.serviceCategories || [''])),
        serviceArea: serverProvider.area || serverProvider.address || serverData.area || updates.serviceArea || state.profile?.serviceArea || '',
      } as ProfileData;

      dispatch({ type: 'UPDATE_PROFILE', payload: updatedProfile });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      dispatch({ type: 'SET_UPDATING', payload: false });
      throw error; // Re-throw to let the component handle the error
    }
  }, [state.profile]);

  // Optimistic update without API call
  const optimisticUpdate = useCallback(async (updates: Partial<ProfileData>) => {
    if (state.profile) {
      // Create a copy of the current state with updates
      const updatedProfile = { ...state.profile, ...updates };
      dispatch({ type: 'UPDATE_PROFILE', payload: updatedProfile });
      // Try to sync with backend if possible
      try {
        await updateProfile(updates);
      } catch (error) {
        console.warn('Background sync failed:', error);
        // Revert to original state on error
        dispatch({ type: 'SET_PROFILE', payload: state.profile });
      }
    }
  }, [state.profile, updateProfile]);
  
  // Update profile photo
  const updateProfilePhoto = useCallback(async (file: File) => {
    try {
      // Create immediate preview for fast UI update
      const tempUrl = URL.createObjectURL(file);
      
      // Update UI immediately with preview
      if (state.profile) {
        const updatedProfile = { ...state.profile, profilePhoto: tempUrl };
        dispatch({ type: 'UPDATE_PROFILE', payload: updatedProfile });
        
        // Also update localStorage immediately
        localStorage.setItem(getProfileStorageKey(), JSON.stringify(updatedProfile));
      }
      
      // Convert file to base64 and send to profile update endpoint
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
      
      // Use the existing updateProviderProfile function with avatar data
      const response = await updateProviderProfile({ avatar: dataUrl });
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update profile photo');
      }
      
      const photoUrl =
        response?.data?.profile?.avatar ||
        response?.data?.user?.profile?.avatar ||
        response?.data?.avatar ||
        response?.data?.profilePhoto ||
        tempUrl;
      
      // Update with final URL from server
      if (state.profile) {
        const finalProfile = { ...state.profile, profilePhoto: photoUrl };
        dispatch({ type: 'UPDATE_PROFILE', payload: finalProfile });
        
        // Update localStorage with final URL
        localStorage.setItem(getProfileStorageKey(), JSON.stringify(finalProfile));
        
        // Force a refresh of the profile by fetching again
        setTimeout(() => {
          fetchProfile();
        }, 500);
      }
      
      // Clean up temporary URL
      URL.revokeObjectURL(tempUrl);
      
      return photoUrl;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }, [state.profile, updateProviderProfile, fetchProfile]);
  
  // Remove profile photo
  const removeProfilePhoto = useCallback(async () => {
    try {
      // Remove photo from server using API service
      await removeProviderPhoto();
      
      // Update profile photo URL to empty string in state
      if (state.profile) {
        const updatedProfile = { ...state.profile, profilePhoto: '' };
        dispatch({ type: 'UPDATE_PROFILE', payload: updatedProfile });
        
        // Update localStorage
        localStorage.setItem(getProfileStorageKey(), JSON.stringify(updatedProfile));
        
        // Force a refresh of profile
        setTimeout(() => {
          fetchProfile();
        }, 500);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }, [state.profile, fetchProfile]);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <ProviderProfileContext.Provider
      value={{
        state,
        fetchProfile,
        updateProfile,
        optimisticUpdate,
        updateProfilePhoto,
        removeProfilePhoto
      }}
    >
      {children}
    </ProviderProfileContext.Provider>
  );
};

// Custom hook to use the context
export const useProviderProfile = () => {
  const context = useContext(ProviderProfileContext);
  if (!context) {
    throw new Error('useProviderProfile must be used within a ProviderProfileProvider');
  }
  return context;
};
