import { useCallback, useEffect, useState } from 'react';
import notificationService from '../../services/notificationService';
import NotificationComposer from '../../components/notifications/NotificationComposer';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { SkeletonBlock } from '../../components/common/Skeleton';

const RECIPIENT_LABELS = { INDIVIDUAL: 'Individual', GROUP: 'Selected Group', EVERYONE: 'Everyone' };

function formatDate(value) {
  if (!value) return '—';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    notificationService
      .listNotifications({ page: 1, limit: 20 })
      .then((result) => setNotifications(result.notifications))
      .catch((err) => setError(err.message || 'Unable to load notifications.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <NotificationComposer onSent={load} />
      </div>

      <div className="lg:col-span-2">
        <p className="mb-3 font-display text-sm font-semibold text-slate-950">Sent notifications</p>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : notifications === null ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications sent yet." />
        ) : (
          <div className="card divide-y divide-slate-100">
            {notifications.map((n) => (
              <div key={n.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-950">{n.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-slate-500">
                    {RECIPIENT_LABELS[n.recipientType] || n.recipientType}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  {n.createdByName} &middot; {formatDate(n.createdAt)} &middot; {n.deliveryStatus?.sent || 0} delivered,{' '}
                  {n.deliveryStatus?.skipped || 0} skipped, {n.deliveryStatus?.failed || 0} failed
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
