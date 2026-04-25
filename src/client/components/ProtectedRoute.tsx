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
    // If the unauthenticated user lands on the app root, send them to the public landing page.
    const { pathname } = location;
    if (pathname === '/' || pathname === '') {
      return <Navigate to="/landing" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
