import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import adminService from '../../services/adminService';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { SkeletonBlock } from '../../components/common/Skeleton';

function formatDate(value) {
  if (!value) return '—';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminActivityModal({ admin, onClose }) {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService
      .getAdminActivity(admin.id)
      .then(setLogs)
      .catch((err) => setError(err.message || 'Unable to load activity.'));
  }, [admin.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-semibold text-slate-950">{admin.name}'s activity</p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-950">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4">
          {error ? (
            <ErrorState message={error} />
          ) : logs === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState title="No activity yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm text-slate-950">
                      <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                      {log.entityType && <span className="text-slate-500"> — {log.entityType}</span>}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-xs text-slate-500">{formatDate(log.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
