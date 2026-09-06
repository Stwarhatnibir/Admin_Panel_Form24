import { useState } from 'react';
import { X } from 'lucide-react';
import Select from '../../components/common/Select';
import { ROLES } from '../../constants/roles';

export default function AddAdminModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.ADMIN);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) return setError('Name and email are required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), password, role });
    } catch (err) {
      setError(err.message || 'Unable to create admin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-semibold text-slate-950">Add Admin</p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-950">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-950">Name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" autoFocus />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-950">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-950">Temporary password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="At least 8 characters" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-950">Role</span>
            <Select
              value={role}
              onChange={setRole}
              options={[
                { value: ROLES.ADMIN, label: 'Admin' },
                { value: ROLES.SUPER_ADMIN, label: 'Super Admin' },
              ]}
              placeholder="Select role"
            />
          </label>

          {error && <div className="rounded-lg border border-rose/30 bg-rose-light px-3.5 py-2.5 text-sm text-rose">{error}</div>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating…' : 'Add Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
