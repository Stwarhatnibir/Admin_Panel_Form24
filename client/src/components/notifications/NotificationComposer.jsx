import { useState } from 'react';
import notificationService from '../../services/notificationService';
import UserPicker from './UserPicker';

const MODES = [
  { key: 'INDIVIDUAL', label: 'Individual' },
  { key: 'GROUP', label: 'Selected Group' },
  { key: 'EVERYONE', label: 'Everyone' },
];

export default function NotificationComposer({ onSent }) {
  const [mode, setMode] = useState('INDIVIDUAL');
  const [recipientIds, setRecipientIds] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [relatedApplicationId, setRelatedApplicationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleModeChange = (key) => {
    setMode(key);
    setRecipientIds([]);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!title.trim() || !message.trim()) return setError('Title and message are required.');
    if (mode === 'INDIVIDUAL' && recipientIds.length !== 1) return setError('Select a recipient.');
    if (mode === 'GROUP' && recipientIds.length === 0) return setError('Select at least one recipient.');

    const payload = {
      recipientType: mode,
      title: title.trim(),
      message: message.trim(),
      ...(relatedApplicationId.trim() && { relatedApplicationId: relatedApplicationId.trim() }),
      ...(mode === 'INDIVIDUAL' && { recipientId: recipientIds[0] }),
      ...(mode === 'GROUP' && { recipientIds }),
    };

    setSubmitting(true);
    try {
      const sent = await notificationService.sendNotification(payload);
      setResult(sent.deliveryStatus);
      setTitle('');
      setMessage('');
      setRelatedApplicationId('');
      setRecipientIds([]);
      onSent();
    } catch (err) {
      setError(err.message || 'Unable to send notification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-5">
      <p className="font-display text-sm font-semibold text-slate-950">Send notification</p>

      <div className="mt-3 flex gap-1 rounded-lg bg-surface-muted p-1 text-sm">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => handleModeChange(m.key)}
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === m.key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {(mode === 'INDIVIDUAL' || mode === 'GROUP') && (
          <UserPicker selectedIds={recipientIds} onChange={setRecipientIds} multi={mode === 'GROUP'} />
        )}
        {mode === 'EVERYONE' && (
          <p className="rounded-lg bg-accent-light px-3 py-2 text-xs text-accent-dark">
            This will be sent to every registered user.
          </p>
        )}

        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input-field" />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          rows={3}
          className="input-field resize-none"
        />
        <input
          type="text"
          value={relatedApplicationId}
          onChange={(e) => setRelatedApplicationId(e.target.value)}
          placeholder="Related application ID (optional, for deep linking)"
          className="input-field text-sm"
        />

        {error && <div className="rounded-lg border border-rose/30 bg-rose-light px-3.5 py-2.5 text-sm text-rose">{error}</div>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Sending…' : 'Send notification'}
        </button>

        {result && (
          <div className="rounded-lg bg-surface-muted p-3 text-xs text-slate-700">
            <p className="font-medium text-slate-950">Delivery result</p>
            <p className="mt-1">
              {result.sent} delivered · {result.skipped} skipped (no device registered) · {result.failed} failed
            </p>
            {result.skipped > 0 && (
              <p className="mt-1 text-slate-500">
                Skipped recipients don't have a registered device token yet - that's expected until the user-facing
                app is wired up to register one.
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
