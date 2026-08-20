import { useCallback, useEffect, useState } from 'react';
import otpService from '../../services/otpService';
import Select from '../../components/common/Select';
import StatusBadge from '../applications/StatusBadge';
import { SkeletonBlock } from '../../components/common/Skeleton';
import { OTP_TYPES, OTP_TYPE_LABELS, OTP_STATUSES, OTP_STATUS_LABELS, OTP_STATUS_TONES } from '../../constants/requestStatuses';

export default function OtpRequestsPanel({ applicationId }) {
  const [requests, setRequests] = useState(null);
  const [type, setType] = useState('GOVERNMENT_PORTAL');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    otpService
      .listForApplication(applicationId)
      .then(setRequests)
      .catch(() => setRequests([]));
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRequest = async () => {
    setSubmitting(true);
    try {
      await otpService.createRequest(applicationId, type);
      load();
      setToast('OTP requested.');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (otpId, newStatus) => {
    await otpService.updateStatus(otpId, newStatus);
    load();
  };

  return (
    <div className="card p-4">
      <p className="font-display text-sm font-semibold text-slate-950">OTP requests</p>
      <p className="mt-0.5 text-xs text-slate-500">Never displays or stores the OTP value itself.</p>

      <div className="mt-3 flex gap-2">
        <Select value={type} onChange={setType} placeholder="Select type" options={OTP_TYPES.map((t) => ({ value: t, label: OTP_TYPE_LABELS[t] }))} />
        <button type="button" onClick={handleRequest} disabled={submitting} className="btn-primary shrink-0">
          {submitting ? 'Requesting…' : 'Request OTP'}
        </button>
      </div>
      {toast && <p className="mt-2 text-center text-xs text-teal">{toast}</p>}

      <div className="mt-4 max-h-56 space-y-2 overflow-y-auto border-t border-slate-100 pt-3">
        {requests === null ? (
          <SkeletonBlock className="h-10 w-full" />
        ) : requests.length === 0 ? (
          <p className="text-xs text-slate-500">No OTP requests yet.</p>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted p-2.5">
              <div>
                <p className="text-xs font-medium text-slate-950">{OTP_TYPE_LABELS[r.type] || r.type}</p>
                <StatusBadge label={OTP_STATUS_LABELS[r.status] || r.status} tone={OTP_STATUS_TONES[r.status] || 'bg-slate-100 text-slate-700'} />
              </div>
              <select
                value={r.status}
                onChange={(e) => handleStatusChange(r.id, e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                {OTP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {OTP_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
