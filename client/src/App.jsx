import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleGate from './routes/RoleGate';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Users from './pages/Users/Users';
import UserProfile from './pages/Users/UserProfile';
import Applications from './pages/Applications/Applications';
import ApplicationDetail from './pages/Applications/ApplicationDetail';
import Conversations from './pages/Conversations/Conversations';
import Documents from './pages/Documents/Documents';
import ConversationDetail from './pages/Conversations/ConversationDetail';
import Schemes from './pages/Schemes/Schemes';
import Payments from './pages/Payments/Payments';
import Refunds from './pages/Refunds/Refunds';
import Notifications from './pages/Notifications/Notifications';
import Admins from './pages/Admins/Admins';
import AuditLogs from './pages/AuditLogs/AuditLogs';
import ComingSoon from './pages/ComingSoon';
import { NAV_ITEMS } from './constants/navigation';
import { ROLES } from './constants/roles';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:id" element={<UserProfile />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/applications/:id" element={<ApplicationDetail />} />
              <Route path="/conversations" element={<Conversations />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/conversations/:id" element={<ConversationDetail />} />
              <Route path="/schemes" element={<Schemes />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/refunds" element={<Refunds />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route
                path="/admins"
                element={
                  <RoleGate roles={[ROLES.SUPER_ADMIN]}>
                    <Admins />
                  </RoleGate>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <RoleGate roles={[ROLES.SUPER_ADMIN]}>
                    <AuditLogs />
                  </RoleGate>
                }
              />
              {NAV_ITEMS.filter((item) => !item.implemented).map((item) => (
                <Route
                  key={item.key}
                  path={`${item.path}/*`}
                  element={
                    item.roles ? (
                      <RoleGate roles={item.roles}>
                        <ComingSoon />
                      </RoleGate>
                    ) : (
                      <ComingSoon />
                    )
                  }
                />
              ))}
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
