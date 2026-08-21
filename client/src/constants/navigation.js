import { ROLES } from './roles';

// Single source of truth for sidebar nav. `implemented: false` routes to a
// placeholder page instead of a broken link - each becomes `true` as its
// build phase lands, per PHASES.md. `roles` restricts visibility/access;
// omit to show for both roles.
export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', implemented: true },
  { key: 'applications', label: 'Applications', path: '/applications', implemented: true },
  { key: 'users', label: 'Users', path: '/users', implemented: true },
  { key: 'conversations', label: 'Conversations', path: '/conversations', implemented: true },
  { key: 'documents', label: 'Documents', path: '/documents', implemented: false },
  { key: 'schemes', label: 'Schemes', path: '/schemes', implemented: true },
  { key: 'payments', label: 'Payments', path: '/payments', implemented: false },
  { key: 'refunds', label: 'Refunds', path: '/refunds', implemented: false },
  { key: 'notifications', label: 'Notifications', path: '/notifications', implemented: false },
  { key: 'audit', label: 'Audit Logs', path: '/audit-logs', implemented: false },
  { key: 'admins', label: 'Admins', path: '/admins', implemented: false, roles: [ROLES.SUPER_ADMIN] },
];
