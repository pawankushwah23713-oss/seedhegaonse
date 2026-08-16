// src/components/ProtectedRoutes.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Normal Logged-in User Guard
export const UserRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/auth" replace />;
};

// Admin Only Guard
export const AdminRoute = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

  if (token && user.role === 'admin') {
    return <Outlet />;
  }
  // Agar admin nahi hai to home ya auth par bhej do
  return <Navigate to="/auth" replace />;
};