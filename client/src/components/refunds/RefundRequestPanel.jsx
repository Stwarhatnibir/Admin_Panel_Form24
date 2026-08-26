import { useCallback, useEffect, useState } from 'react';
import refundService from '../../services/refundService';
import Select from '../../components/common/Select';
import StatusBadge from '../applications/StatusBadge';
import { SkeletonBlock } from '../../components/common/Skeleton';
import { REFUND_TYPES, REFUND_STATUS_LABELS, REFUND_STATUS_TONES } from '../../constants/refundStatuses';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function RefundRequestPanel({ applicationId }) {
  const [refunds, setRefunds] = useState(null);
  const [refundType, setRefundType] = useState('PARTIAL');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    refundService
      .listRefunds({ applicationId })
      .then((result) => setRefunds(result.refunds))
      .catch(() => setRefunds([]));
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    setError('');
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return setError('Enter a refund amount greater than zero.');
    if (!reason.trim()) return setError('A reason is required.');

    setSubmitting(true);
    try {
      await refundService.createRefund({ applicationId, refundType, requestedAmount: numericAmount, reason: reason.trim() });
      setAmount('');
      setReason('');
      load();
      setToast('Refund request sent - awaiting Super Admin approval.');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setError(err.message || 'Unable to create refund request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-4">
      <p className="font-display text-sm font-semibold text-slate-950">Refund request</p>
      <p className="mt-0.5 text-xs text-slate-500">You can request a refund; only a Super Admin can approve it.</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Select value={refundType} onChange={setRefundType} options={REFUND_TYPES.map((t) => ({ value: t, label: t === 'FULL' ? 'Full' : 'Partial' }))} placeholder="Type" />
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (₹)"
          className="input-field text-sm"
        />
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for refund"
        rows={2}
        className="input-field mt-2 w-full resize-none text-sm"
      />
      {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
      <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary mt-2 w-full">
        {submitting ? 'Sending…' : 'Request refund'}
      </button>
      {toast && <p className="mt-2 text-center text-xs text-teal">{toast}</p>}

      <div className="mt-4 max-h-48 space-y-2 overflow-y-auto border-t border-slate-100 pt-3">
        {refunds === null ? (
          <SkeletonBlock className="h-10 w-full" />
        ) : refunds.length === 0 ? (
          <p className="text-xs text-slate-500">No refund requests yet.</p>
        ) : (
          refunds.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted p-2.5">
              <div>
                <p className="text-xs font-medium text-slate-950">{formatCurrency(r.requestedAmount)} ({r.refundType})</p>
                {r.rejectionReason && <p className="mt-0.5 text-xs text-rose">{r.rejectionReason}</p>}
              </div>
              <StatusBadge label={REFUND_STATUS_LABELS[r.status] || r.status} tone={REFUND_STATUS_TONES[r.status] || 'bg-slate-100 text-slate-700'} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
