import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token || userType !== 'CUSTOMER') {
    // Redirect to the login page with a return url
    return <Navigate to="/customer-login-signup" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
