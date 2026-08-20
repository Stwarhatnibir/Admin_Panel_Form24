import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import informationRequestService from '../../services/informationRequestService';
import StatusBadge from '../applications/StatusBadge';
import { SkeletonBlock } from '../../components/common/Skeleton';
import { INFORMATION_REQUEST_STATUS_LABELS, INFORMATION_REQUEST_STATUS_TONES } from '../../constants/requestStatuses';

function StructuredFieldRow({ field, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={field.label}
        onChange={(e) => onChange({ ...field, label: e.target.value })}
        placeholder="Field label, e.g. Father's Occupation"
        className="input-field flex-1 text-sm"
      />
      <button type="button" onClick={onRemove} className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-400 hover:text-rose">
        <X size={15} />
      </button>
    </div>
  );
}

export default function InformationRequestsPanel({ applicationId }) {
  const [requests, setRequests] = useState(null);
  const [mode, setMode] = useState('text'); // 'text' | 'structured'
  const [textContent, setTextContent] = useState('');
  const [fields, setFields] = useState([{ label: '', type: 'text', required: true }]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    informationRequestService
      .listForApplication(applicationId)
      .then(setRequests)
      .catch(() => setRequests([]));
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (mode === 'text') {
        if (!textContent.trim()) return;
        await informationRequestService.createTextRequest(applicationId, textContent.trim());
        setTextContent('');
      } else {
        const validFields = fields.filter((f) => f.label.trim());
        if (validFields.length === 0) return;
        await informationRequestService.createStructuredRequest(applicationId, validFields);
        setFields([{ label: '', type: 'text', required: true }]);
      }
      load();
      setToast('Request sent.');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-4">
      <p className="font-display text-sm font-semibold text-slate-950">Information requests</p>

      <div className="mt-3 flex gap-1 rounded-lg bg-surface-muted p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode('text')}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${mode === 'text' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
        >
          Message
        </button>
        <button
          type="button"
          onClick={() => setMode('structured')}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${mode === 'structured' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
        >
          Structured fields
        </button>
      </div>

      {mode === 'text' ? (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="What do you need from the applicant?"
          rows={2}
          className="input-field mt-3 w-full resize-none text-sm"
        />
      ) : (
        <div className="mt-3 space-y-2">
          {fields.map((field, i) => (
            <StructuredFieldRow
              key={i}
              field={field}
              onChange={(updated) => setFields((prev) => prev.map((f, idx) => (idx === i ? updated : f)))}
              onRemove={() => setFields((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
          <button
            type="button"
            onClick={() => setFields((prev) => [...prev, { label: '', type: 'text', required: true }])}
            className="flex items-center gap-1 text-xs font-medium text-accent-dark hover:underline"
          >
            <Plus size={13} /> Add field
          </button>
        </div>
      )}

      <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary mt-3 w-full">
        {submitting ? 'Sending…' : 'Send request'}
      </button>
      {toast && <p className="mt-2 text-center text-xs text-teal">{toast}</p>}

      <div className="mt-4 max-h-56 space-y-2 overflow-y-auto border-t border-slate-100 pt-3">
        {requests === null ? (
          <SkeletonBlock className="h-10 w-full" />
        ) : requests.length === 0 ? (
          <p className="text-xs text-slate-500">No requests sent yet.</p>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="rounded-lg bg-surface-muted p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-slate-950">
                  {r.type === 'TEXT' ? r.content : `Fields: ${(r.fields || []).map((f) => f.label).join(', ')}`}
                </p>
                <StatusBadge
                  label={INFORMATION_REQUEST_STATUS_LABELS[r.status] || r.status}
                  tone={INFORMATION_REQUEST_STATUS_TONES[r.status] || 'bg-slate-100 text-slate-700'}
                />
              </div>
              {r.userResponse && <p className="mt-1 text-xs text-slate-500">Response: {r.userResponse}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
