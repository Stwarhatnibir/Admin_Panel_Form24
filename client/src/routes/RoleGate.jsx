import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Restricts a nested route (rendered inside ProtectedRoute's tree) to
// specific roles - used for stub/"coming soon" destinations like /admins
// that shouldn't be reachable by a plain Admin even before they're built.
export default function RoleGate({ roles, children }) {
  const { admin } = useAuth();
  if (!roles.includes(admin.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
