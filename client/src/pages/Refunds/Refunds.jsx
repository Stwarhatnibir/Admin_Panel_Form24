import { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import refundService from '../../services/refundService';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Toast from '../../components/common/Toast';
import { SkeletonBlock } from '../../components/common/Skeleton';
import StatusBadge from '../../components/applications/StatusBadge';
import { REFUND_STATUSES, REFUND_STATUS_LABELS, REFUND_STATUS_TONES } from '../../constants/refundStatuses';

const LIMIT = 20;

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RejectModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(reason.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-card">
        <p className="font-display text-sm font-semibold text-slate-950">Reject refund request</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this refund being rejected?"
          rows={3}
          className="input-field mt-3 w-full resize-none"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting || !reason.trim()} className="btn-primary">
            {submitting ? 'Rejecting…' : 'Reject request'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Refunds() {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === ROLES.SUPER_ADMIN;

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refunds, setRefunds] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const result = await refundService.listRefunds({ status, page, limit: LIMIT });
      setRefunds(result.refunds);
      setPagination(result.pagination);
      setLoadState('loaded');
    } catch (err) {
      setError(err.message || 'Unable to load refund requests.');
      setLoadState('error');
    }
  }, [status, page]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (refund) => {
    setBusyId(refund.id);
    try {
      await refundService.approveRefund(refund.id);
      load();
      setToast({ type: 'success', message: 'Refund approved and processed.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to approve this refund.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (reason) => {
    setBusyId(rejectTarget.id);
    try {
      await refundService.rejectRefund(rejectTarget.id, reason);
      load();
      setToast({ type: 'success', message: 'Refund rejected.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to reject this refund.' });
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">Refund Requests</h2>
        <p className="text-sm text-slate-500">
          {isSuperAdmin
            ? 'As a Super Admin, you can approve or reject requests below.'
            : 'Refund requests are created here; only a Super Admin can approve or reject them.'}
        </p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="w-52">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Status</label>
          <Select
            value={status}
            onChange={setStatus}
            placeholder="All statuses"
            options={REFUND_STATUSES.map((s) => ({ value: s, label: REFUND_STATUS_LABELS[s] }))}
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
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : refunds.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No refund requests found." />
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {refunds.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-medium text-slate-950">{formatCurrency(r.requestedAmount)}</p>
                      <span className="text-xs text-slate-500">({r.refundType})</span>
                      <StatusBadge label={REFUND_STATUS_LABELS[r.status] || r.status} tone={REFUND_STATUS_TONES[r.status] || 'bg-slate-100 text-slate-700'} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{r.reason}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Requested by {r.requestedByName} on {formatDate(r.createdAt)}
                    </p>
                  </div>
                  {isSuperAdmin && r.status === 'PENDING_APPROVAL' && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(r)}
                        disabled={busyId === r.id}
                        className="flex items-center gap-1 rounded-lg bg-teal px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal/90 disabled:opacity-50"
                      >
                        <Check size={13} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectTarget(r)}
                        disabled={busyId === r.id}
                        className="flex items-center gap-1 rounded-lg border border-rose/30 px-3 py-1.5 text-xs font-medium text-rose transition-colors hover:bg-rose-light disabled:opacity-50"
                      >
                        <X size={13} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Pagination page={page} limit={LIMIT} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </div>

      {rejectTarget && <RejectModal onClose={() => setRejectTarget(null)} onSubmit={handleReject} />}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
