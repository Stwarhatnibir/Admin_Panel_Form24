import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import userService from '../../services/userService';
import Tabs from '../../components/common/Tabs';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import { SkeletonBlock } from '../../components/common/Skeleton';

const TABS = [
  { key: 'personal', label: 'Personal Information' },
  { key: 'contact', label: 'Contact Information' },
  { key: 'applications', label: 'Applications' },
  { key: 'documents', label: 'Documents' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'payments', label: 'Payments' },
  { key: 'refunds', label: 'Refunds' },
  { key: 'activity', label: 'Activity' },
];

const NOT_BUILT_TABS = new Set(['applications', 'documents', 'conversations', 'payments', 'refunds']);

function Field({ label, ...inputProps }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-950">{label}</span>
      <input {...inputProps} className="input-field" />
    </label>
  );
}

function EditableSection({ fields, values, onChange, onSave, saving }) {
  return (
    <div className="card p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            type={field.type || 'text'}
            value={values[field.key] ?? ''}
            onChange={(e) => onChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
          />
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function ActivityTab({ userId }) {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    userService
      .getUserActivity(userId)
      .then(setLogs)
      .catch((err) => setError(err.message || 'Unable to load activity.'));
  }, [userId]);

  if (error) return <ErrorState message={error} />;
  if (logs === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (logs.length === 0) {
    return <EmptyState title="No activity yet." description="Edits to this user will appear here." />;
  }

  return (
    <div className="card divide-y divide-slate-100">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm text-slate-950">
              <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
              {log.fieldChanged && <span className="text-slate-500"> — field: {log.fieldChanged}</span>}
            </p>
            {(log.oldValue !== undefined || log.newValue !== undefined) && (
              <p className="mt-0.5 font-mono text-xs text-slate-500">
                {String(log.oldValue)} → {String(log.newValue)}
              </p>
            )}
          </div>
          <p className="whitespace-nowrap text-xs text-slate-500">
            {log.timestamp?._seconds ? new Date(log.timestamp._seconds * 1000).toLocaleString() : ''}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await userService.getUser(id);
      setUser(data);
      setFormValues(data);
      setLoadState('loaded');
    } catch (err) {
      setError(err.message || 'Unable to load this user.');
      setLoadState('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (key, value) => setFormValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (fieldKeys) => {
    setSaving(true);
    try {
      const updates = Object.fromEntries(fieldKeys.map((key) => [key, formValues[key]]));
      const updated = await userService.updateUser(id, updates);
      setUser(updated);
      setToast({ type: 'success', message: 'Changes saved.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  if (loadState === 'error') return <ErrorState message={error} onRetry={load} />;
  if (loadState === 'loading') {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  const personalFields = [
    { key: 'fullName', label: 'Full Name' },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'occupation', label: 'Occupation' },
    { key: 'annualIncome', label: 'Annual Income (₹)', type: 'number' },
    { key: 'aadhaarNumber', label: 'Aadhaar Number' },
  ];
  const contactFields = [
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
  ];

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate('/users')}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-950"
      >
        <ArrowLeft size={15} /> Back to Users
      </button>

      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">{user.fullName}</h2>
        <p className="font-mono text-sm text-slate-500">{user.id}</p>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === 'personal' && (
          <EditableSection
            fields={personalFields}
            values={formValues}
            onChange={handleChange}
            onSave={() => handleSave(personalFields.map((f) => f.key))}
            saving={saving}
          />
        )}
        {activeTab === 'contact' && (
          <EditableSection
            fields={contactFields}
            values={formValues}
            onChange={handleChange}
            onSave={() => handleSave(contactFields.map((f) => f.key))}
            saving={saving}
          />
        )}
        {activeTab === 'activity' && <ActivityTab userId={id} />}
        {NOT_BUILT_TABS.has(activeTab) && (
          <EmptyState
            title={`${TABS.find((t) => t.key === activeTab).label} coming soon`}
            description="This tab is planned for a later build phase."
          />
        )}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
