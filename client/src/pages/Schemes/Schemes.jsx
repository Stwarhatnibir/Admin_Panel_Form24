import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, FileText } from 'lucide-react';
import schemeService from '../../services/schemeService';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import StatusBadge from '../../components/applications/StatusBadge';
import SchemeFormModal from '../../components/schemes/SchemeFormModal';
import { SkeletonBlock } from '../../components/common/Skeleton';
import { SCHEME_STATUS_LABELS, SCHEME_STATUS_TONES } from '../../constants/schemeStatuses';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function Schemes() {
  const [schemes, setSchemes] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    schemeService
      .listSchemes()
      .then(setSchemes)
      .catch((err) => setError(err.message || 'Unable to load schemes.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingScheme(null);
    setModalOpen(true);
  };
  const openEdit = (scheme) => {
    setEditingScheme(scheme);
    setModalOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    if (editingScheme) {
      await schemeService.updateScheme(editingScheme.id, payload);
      setToast({ type: 'success', message: 'Scheme updated.' });
    } else {
      await schemeService.createScheme(payload);
      setToast({ type: 'success', message: 'Scheme created.' });
    }
    setModalOpen(false);
    load();
  };

  const toggleStatus = async (scheme) => {
    setBusyId(scheme.id);
    try {
      const newStatus = scheme.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await schemeService.updateStatus(scheme.id, newStatus);
      load();
      setToast({ type: 'success', message: `Scheme ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.` });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to update scheme status.' });
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-950">Government Schemes</h2>
          <p className="text-sm text-slate-500">New schemes can be added here without any code changes.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus size={15} /> Add scheme
        </button>
      </div>

      {schemes === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : schemes.length === 0 ? (
        <EmptyState title="No schemes yet." description="Add your first government scheme to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-lg">
                    {scheme.icon || <FileText size={18} className="text-accent-dark" />}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-slate-950">{scheme.name}</p>
                    <p className="font-mono text-xs text-slate-500">{formatCurrency(scheme.price)}</p>
                  </div>
                </div>
                <StatusBadge label={SCHEME_STATUS_LABELS[scheme.status] || scheme.status} tone={SCHEME_STATUS_TONES[scheme.status] || 'bg-slate-100 text-slate-700'} />
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-slate-500">{scheme.description || 'No description provided.'}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(scheme.requiredDocuments || []).slice(0, 3).map((doc) => (
                  <span key={doc} className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-slate-500">
                    {doc}
                  </span>
                ))}
                {(scheme.requiredDocuments || []).length > 3 && (
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-slate-500">
                    +{scheme.requiredDocuments.length - 3} more
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => openEdit(scheme)} className="btn-secondary flex-1">
                  <Pencil size={13} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleStatus(scheme)}
                  disabled={busyId === scheme.id}
                  className="btn-secondary flex-1"
                >
                  {scheme.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <SchemeFormModal scheme={editingScheme} onClose={() => setModalOpen(false)} onSubmit={handleFormSubmit} />
      )}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
