import React from 'react'
import { Navigate } from 'react-router-dom'

interface RoleBasedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, allowedRoles }) => {
  // Get user-specific token
  const userId = localStorage.getItem('userId');
  const sessionId = localStorage.getItem('currentSessionId') || 'default';
  const token = localStorage.getItem(`token_${userId}_${sessionId}`) || localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  const storedUserType = localStorage.getItem('userType'); // <— add this

  const isAdminRoute = allowedRoles.includes('ADMIN') || allowedRoles.includes('admin');

  const redirectTo = allowedRoles.includes('PROVIDER') || allowedRoles.includes('provider')
    ? '/auth'
    : isAdminRoute 
      ? '/admin/login'
      : '/auth';

  if (isAdminRoute) {
    if (!adminToken) return <Navigate to={redirectTo} replace />;
  } else if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  let userTypeFromToken: string | null = null;

  try {
    if (isAdminRoute) {
      const adminUser = localStorage.getItem('adminUser');
      if (adminUser) {
        const user = JSON.parse(adminUser);
        userTypeFromToken = user.role;
      }
    } else if (token && token.includes('.')) {
      const payloadPart = token.split('.')[1];
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const payloadJson = atob(padded);
      const payload = JSON.parse(payloadJson);
      userTypeFromToken = payload.userType || payload.role || payload.userType; // handle either key
    }
  } catch (error) {
    // fall through to storedUserType
  }

  const effectiveUserType = (userTypeFromToken || storedUserType || '').toUpperCase();
  const normalizedAllowedRoles = allowedRoles.map(r => String(r).toUpperCase());

  if (!effectiveUserType || !normalizedAllowedRoles.includes(effectiveUserType)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};


export default RoleBasedRoute
