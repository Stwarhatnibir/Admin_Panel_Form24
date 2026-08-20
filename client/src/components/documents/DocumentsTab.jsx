import { useCallback, useEffect, useState } from 'react';
import { Download, CheckCircle2, RotateCcw } from 'lucide-react';
import documentService from '../../services/documentService';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Toast from '../../components/common/Toast';
import StatusBadge from '../applications/StatusBadge';
import { SkeletonBlock } from '../../components/common/Skeleton';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_TONES } from '../../constants/requestStatuses';

function ReuploadModal({ document, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(document.id, reason.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-card">
        <p className="font-display text-sm font-semibold text-slate-950">Request re-upload</p>
        <p className="mt-1 text-sm text-slate-500">{document.type}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why does this document need to be re-uploaded?"
          rows={3}
          className="input-field mt-3 w-full resize-none"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting || !reason.trim()} className="btn-primary">
            {submitting ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsTab({ applicationId }) {
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [reuploadTarget, setReuploadTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    documentService
      .listForApplication(applicationId)
      .then(setDocuments)
      .catch((err) => setError(err.message || 'Unable to load documents.'));
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async (doc) => {
    setBusyId(doc.id);
    try {
      const { url } = await documentService.download(doc.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to download this document.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleVerify = async (doc) => {
    setBusyId(doc.id);
    try {
      await documentService.verify(doc.id);
      load();
      setToast({ type: 'success', message: 'Document verified.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to verify this document.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleReupload = async (documentId, reason) => {
    try {
      await documentService.requestReupload(documentId, reason);
      load();
      setToast({ type: 'success', message: 'Re-upload requested.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to request re-upload.' });
      throw err;
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (documents === null) return <SkeletonBlock className="h-40 w-full" />;
  if (documents.length === 0) return <EmptyState title="No documents uploaded yet." />;

  return (
    <div className="card divide-y divide-slate-100">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-950">{doc.type}</p>
            <p className="truncate text-xs text-slate-500">{doc.fileName}</p>
            {doc.status === 'REUPLOAD_REQUIRED' && doc.reuploadReason && (
              <p className="mt-0.5 text-xs text-rose">{doc.reuploadReason}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge label={DOCUMENT_STATUS_LABELS[doc.status] || doc.status} tone={DOCUMENT_STATUS_TONES[doc.status] || 'bg-slate-100 text-slate-700'} />
            <button
              type="button"
              onClick={() => handleDownload(doc)}
              disabled={busyId === doc.id}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-surface-muted hover:text-slate-950"
              title="Download"
            >
              <Download size={15} />
            </button>
            {doc.status !== 'VERIFIED' && (
              <button
                type="button"
                onClick={() => handleVerify(doc)}
                disabled={busyId === doc.id}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-teal-light hover:text-teal"
                title="Verify"
              >
                <CheckCircle2 size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setReuploadTarget(doc)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-light hover:text-rose"
              title="Request re-upload"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      ))}

      {reuploadTarget && (
        <ReuploadModal document={reuploadTarget} onClose={() => setReuploadTarget(null)} onSubmit={handleReupload} />
      )}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
