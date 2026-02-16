import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Secured with: JWT + Redirect logic
 * ProtectedRoute ensures that only authenticated users can access specific routes.
 * It also handles the loading state of the AuthContext.
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Return a simple loading state or null while checking auth
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated, preserving the path the user tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated and profile is missing, and we are not on profile setup (if applicable)
  // But for now, just render the child routes (Outlet)
  return <Outlet />;
}