import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/modernAuthService';
import { sanitizeRedirectPath } from '../utils/redirectAllowlist';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: ('CUSTOMER' | 'PROVIDER')[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedUserTypes, 
  redirectTo = '/login' 
}) => {
  const location = useLocation();
  const safeRedirectTo = sanitizeRedirectPath(redirectTo, '/auth');

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    // Redirect to login with return URL
    return <Navigate to={safeRedirectTo} state={{ from: location }} replace />;
  }

  // Check user type if specified
  if (allowedUserTypes) {
    const userType = authService.getUserType();
    if (!userType || !allowedUserTypes.includes(userType)) {
      // Redirect to appropriate dashboard or unauthorized page
      if (userType === 'CUSTOMER') {
        return <Navigate to="/customer/dashboard" replace />;
      } else if (userType === 'PROVIDER') {
        return <Navigate to="/provider/dashboard" replace />;
      } else {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
