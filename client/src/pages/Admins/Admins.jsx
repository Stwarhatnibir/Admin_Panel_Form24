import { useCallback, useEffect, useState } from 'react';
import { Plus, History, Trash2 } from 'lucide-react';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import ErrorState from '../../components/common/ErrorState';
import Toast from '../../components/common/Toast';
import StatusBadge from '../../components/applications/StatusBadge';
import { SkeletonBlock } from '../../components/common/Skeleton';
import AddAdminModal from './AddAdminModal';
import RemoveAdminDialog from './RemoveAdminDialog';
import AdminActivityModal from './AdminActivityModal';
import { ROLES } from '../../constants/roles';

const ROLE_LABELS = { [ROLES.ADMIN]: 'Admin', [ROLES.SUPER_ADMIN]: 'Super Admin' };
const ROLE_TONES = {
  [ROLES.ADMIN]: 'bg-slate-100 text-slate-700',
  [ROLES.SUPER_ADMIN]: 'bg-accent-light text-accent-dark',
};
const STATUS_TONES = {
  ACTIVE: 'bg-teal-light text-teal',
  REMOVED: 'bg-rose-light text-rose',
};

function formatDate(value) {
  if (!value) return 'Never';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Admins() {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [activityTarget, setActivityTarget] = useState(null);

  const load = useCallback(() => {
    adminService
      .listAdmins()
      .then(setAdmins)
      .catch((err) => setError(err.message || 'Unable to load admins.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (payload) => {
    await adminService.createAdmin(payload);
    setShowAddModal(false);
    load();
    setToast({ type: 'success', message: 'Admin added.' });
  };

  const handleRemove = async () => {
    try {
      await adminService.removeAdmin(removeTarget.id);
      setRemoveTarget(null);
      load();
      setToast({ type: 'success', message: 'Admin removed.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to remove this admin.' });
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-950">Admins</h2>
          <p className="text-sm text-slate-500">Manage who has access to this admin panel.</p>
        </div>
        <button type="button" onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={15} /> Add Admin
        </button>
      </div>

      <div className="card overflow-hidden">
        {admins === null ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-surface-muted text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Last Active</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-surface-muted">
                  <td className="px-4 py-3 font-medium text-slate-950">
                    {a.name} {a.id === currentAdmin.id && <span className="text-xs text-slate-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{a.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={ROLE_LABELS[a.role] || a.role} tone={ROLE_TONES[a.role] || 'bg-slate-100 text-slate-700'} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={a.status} tone={STATUS_TONES[a.status] || 'bg-slate-100 text-slate-700'} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(a.lastActiveAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setActivityTarget(a)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-surface-muted hover:text-slate-950"
                        title="View activity"
                      >
                        <History size={15} />
                      </button>
                      {a.id !== currentAdmin.id && a.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(a)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-light hover:text-rose"
                          title="Remove admin"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && <AddAdminModal onClose={() => setShowAddModal(false)} onSubmit={handleAdd} />}
      {removeTarget && <RemoveAdminDialog admin={removeTarget} onCancel={() => setRemoveTarget(null)} onConfirm={handleRemove} />}
      {activityTarget && <AdminActivityModal admin={activityTarget} onClose={() => setActivityTarget(null)} />}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
