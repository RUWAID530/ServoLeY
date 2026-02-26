import { useState, useEffect } from 'react';

const DEFAULT_USER_IMAGE = "https://picsum.photos/seed/user123/100/100.jpg";

const resolveUserImage = () => {
  try {
    const userData = localStorage.getItem('userData');
    if (!userData) return DEFAULT_USER_IMAGE;

    const parsedUserData = JSON.parse(userData);
    return parsedUserData?.avatar || DEFAULT_USER_IMAGE;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return DEFAULT_USER_IMAGE;
  }
};

export const useUserImage = () => {
  const [userImage, setUserImage] = useState(DEFAULT_USER_IMAGE);

  useEffect(() => {
    const refreshUserImage = () => {
      setUserImage(resolveUserImage());
    };

    refreshUserImage();

    const onProfileUpdated = () => refreshUserImage();
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'userData') refreshUserImage();
    };

    window.addEventListener('customer-profile-updated', onProfileUpdated as EventListener);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('customer-profile-updated', onProfileUpdated as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return userImage;
};
