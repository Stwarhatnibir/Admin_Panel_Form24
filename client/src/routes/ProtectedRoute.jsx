import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Gate for any route that requires a logged-in admin. Optionally restrict
 * further to specific roles - e.g. <ProtectedRoute roles={[ROLES.SUPER_ADMIN]} />.
 *
 * IMPORTANT: this is a UI convenience only. The backend independently
 * enforces every permission via authenticate + authorize middleware, since
 * a client-side check can always be bypassed.
 */
export default function ProtectedRoute({ roles }) {
  const { admin, status } = useAuth();
  const location = useLocation();

  if (status === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-ink-900" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(admin.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
