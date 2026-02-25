import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ role }: { role: 'member' | 'librarian' }) {
  const token = role === 'librarian' ? localStorage.getItem('adminToken') : localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // If no token, or role mismatch, redirect to appropriate login
  if (!token || (role === 'librarian' && userRole !== 'librarian')) {
    return <Navigate to={role === 'librarian' ? "/librarian-login" : "/login"} replace />;
  }

  return <Outlet />;
}