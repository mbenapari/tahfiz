import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // You can replace this with a proper LoadingSpinner component
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-dark text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle role-based redirection for the root path (if user is authenticated but hits /)
  if (location.pathname === '/') {
    if (user.role === 'owner') {
      return <Navigate to="/owner" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Prevent non-owners from accessing owner routes
  if (location.pathname.startsWith('/owner') && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  // Prevent owners from accessing normal user dashboard routes
  if (location.pathname.startsWith('/dashboard') && user.role === 'owner') {
    return <Navigate to="/owner" replace />;
  }

  return <Outlet />;
};
