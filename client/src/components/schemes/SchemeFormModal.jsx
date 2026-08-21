import { useState } from 'react';
import { X } from 'lucide-react';
import DynamicListEditor from './DynamicListEditor';

const emptyForm = {
  name: '',
  description: '',
  price: 0,
  eligibility: '',
  requiredFields: [''],
  requiredDocuments: [''],
  instructions: '',
  icon: '',
};

function cleanList(items) {
  return items.map((s) => s.trim()).filter(Boolean);
}

export default function SchemeFormModal({ scheme, onClose, onSubmit }) {
  const isEdit = Boolean(scheme);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          name: scheme.name || '',
          description: scheme.description || '',
          price: scheme.price ?? 0,
          eligibility: scheme.eligibility || '',
          requiredFields: scheme.requiredFields?.length ? scheme.requiredFields : [''],
          requiredDocuments: scheme.requiredDocuments?.length ? scheme.requiredDocuments : [''],
          instructions: scheme.instructions || '',
          icon: scheme.icon || '',
        }
      : emptyForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const requiredFields = cleanList(form.requiredFields);
    const requiredDocuments = cleanList(form.requiredDocuments);
    if (!form.name.trim()) return setError('Name is required.');
    if (requiredFields.length === 0) return setError('At least one required field is needed.');
    if (requiredDocuments.length === 0) return setError('At least one required document is needed.');

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        eligibility: form.eligibility.trim(),
        requiredFields,
        requiredDocuments,
        instructions: form.instructions.trim(),
        icon: form.icon.trim(),
      });
    } catch (err) {
      setError(err.message || 'Unable to save this scheme.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-semibold text-slate-950">{isEdit ? 'Edit scheme' : 'Add scheme'}</p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-950">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_5rem]">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-950">Name</span>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="input-field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-950">Icon</span>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => set('icon', e.target.value)}
                placeholder="🌾"
                className="input-field w-16 text-center"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-950">Price (₹)</span>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="input-field"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-950">Description</span>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className="input-field resize-none" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-950">Eligibility</span>
            <textarea value={form.eligibility} onChange={(e) => set('eligibility', e.target.value)} rows={2} className="input-field resize-none" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-950">Instructions</span>
            <textarea value={form.instructions} onChange={(e) => set('instructions', e.target.value)} rows={2} className="input-field resize-none" />
          </label>

          <DynamicListEditor
            label="Required information"
            items={form.requiredFields}
            onChange={(items) => set('requiredFields', items)}
            placeholder="e.g. Full Name"
          />
          <DynamicListEditor
            label="Required documents"
            items={form.requiredDocuments}
            onChange={(items) => set('requiredDocuments', items)}
            placeholder="e.g. Aadhaar Card"
          />

          {error && (
            <div className="rounded-lg border border-rose/30 bg-rose-light px-3.5 py-2.5 text-sm text-rose">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create scheme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
