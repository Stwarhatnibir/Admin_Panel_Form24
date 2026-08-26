import { useCallback, useEffect, useState } from 'react';
import paymentService from '../../services/paymentService';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { SkeletonBlock } from '../../components/common/Skeleton';
import StatusBadge from '../../components/applications/StatusBadge';
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from '../../constants/applicationStatuses';

const LIMIT = 20;

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Payments() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const result = await paymentService.listPayments({ status, page, limit: LIMIT });
      setPayments(result.payments);
      setPagination(result.pagination);
      setLoadState('loaded');
    } catch (err) {
      setError(err.message || 'Unable to load payments.');
      setLoadState('error');
    }
  }, [status, page]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">Payments</h2>
        <p className="text-sm text-slate-500">Every payment record, verified by the backend before an application enters processing.</p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="w-52">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Status</label>
          <Select
            value={status}
            onChange={setStatus}
            placeholder="All statuses"
            options={PAYMENT_STATUSES.map((s) => ({ value: s, label: PAYMENT_STATUS_LABELS[s] }))}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loadState === 'error' ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : loadState === 'loading' ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No payments found." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-surface-muted text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Payment ID</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">User</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Amount</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Provider</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-surface-muted">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{p.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">{p.userName}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{formatCurrency(p.amount)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{p.provider}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge label={PAYMENT_STATUS_LABELS[p.status] || p.status} tone={PAYMENT_STATUS_TONES[p.status] || 'bg-slate-100 text-slate-700'} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} limit={LIMIT} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
