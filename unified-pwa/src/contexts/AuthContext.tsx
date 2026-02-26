
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserProfile {
  user_id_display: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  member_since: string;
  is_premium: boolean;
  is_verified: boolean;
  push_enabled: boolean;
  total_bookings: number;
  active_subscriptions: number;
  language: string;
}

interface AuthContextType {
  profile: UserProfile | null;
  signOut: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user profile from storage or API
    const loadProfile = async () => {
      try {
        // In a real app, this would be an API call or local storage check
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);





  const signOut = () => {
    setProfile(null);
    localStorage.removeItem('userProfile');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (profile) {
        const updatedProfile = { ...profile, ...data };
        setProfile(updatedProfile);
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      }
    } catch (error) {
      throw new Error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ profile, signOut, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
