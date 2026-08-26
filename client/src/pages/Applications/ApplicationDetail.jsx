import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import applicationService from '../../services/applicationService';
import userService from '../../services/userService';
import conversationService from '../../services/conversationService';
import DocumentsTab from '../../components/documents/DocumentsTab';
import InformationRequestsPanel from '../../components/requests/InformationRequestsPanel';
import OtpRequestsPanel from '../../components/requests/OtpRequestsPanel';
import RefundRequestPanel from '../../components/refunds/RefundRequestPanel';
import paymentService from '../../services/paymentService';
import Tabs from '../../components/common/Tabs';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/applications/StatusBadge';
import { SkeletonBlock } from '../../components/common/Skeleton';
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from '../../constants/applicationStatuses';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'user', label: 'User Information' },
  { key: 'documents', label: 'Documents' },
  { key: 'conversation', label: 'Conversation' },
  { key: 'payment', label: 'Payment' },
  { key: 'activity', label: 'Activity' },
];

const NOT_BUILT_TABS = new Set();

function formatDate(value) {
  if (!value) return '—';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount || 0
  );
}

function SummaryRow({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-950">{children}</span>
    </div>
  );
}

function OverviewTab({ application, onStatusChanged }) {
  const [changingStatus, setChangingStatus] = useState(false);
  const [toast, setToast] = useState(null);
  const [notes, setNotes] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const loadNotes = useCallback(() => {
    applicationService
      .listNotes(application.id)
      .then(setNotes)
      .catch(() => setNotes([]));
  }, [application.id]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleStatusChange = async (newStatus) => {
    if (!newStatus || newStatus === application.status) return;
    setChangingStatus(true);
    try {
      const updated = await applicationService.updateStatus(application.id, newStatus);
      onStatusChanged(updated);
      setToast({ type: 'success', message: 'Status updated.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to update status.' });
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await applicationService.addNote(application.id, noteText.trim());
      setNoteText('');
      loadNotes();
      setToast({ type: 'success', message: 'Note added.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to add note.' });
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="card p-5 lg:col-span-1">
        <p className="font-display text-sm font-semibold text-slate-950">Summary</p>
        <div className="mt-1 divide-y divide-slate-100">
          <SummaryRow label="Scheme">{application.schemeName}</SummaryRow>
          <SummaryRow label="Amount">{formatCurrency(application.amount)}</SummaryRow>
          <SummaryRow label="Payment">
            <StatusBadge
              label={PAYMENT_STATUS_LABELS[application.paymentStatus] || application.paymentStatus}
              tone={PAYMENT_STATUS_TONES[application.paymentStatus] || 'bg-slate-100 text-slate-700'}
            />
          </SummaryRow>
          <SummaryRow label="Created">{formatDate(application.createdAt)}</SummaryRow>
          <SummaryRow label="Updated">{formatDate(application.updatedAt)}</SummaryRow>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Application status</label>
          <Select
            value={application.status}
            onChange={handleStatusChange}
            placeholder="Select status"
            options={APPLICATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          />
          {changingStatus && <p className="mt-1.5 text-xs text-slate-500">Updating…</p>}
        </div>

        <div className="mt-4 space-y-4">
          <InformationRequestsPanel applicationId={application.id} />
          <OtpRequestsPanel applicationId={application.id} />
          <RefundRequestPanel applicationId={application.id} />
        </div>

        <div className="mt-4 rounded-lg bg-surface-muted p-3">
          <p className="text-xs text-slate-500">Replying to the user is available from the Conversation tab.</p>
        </div>
      </div>

      <div className="card p-5 lg:col-span-2">
        <p className="font-display text-sm font-semibold text-slate-950">Internal notes</p>
        <p className="mt-0.5 text-xs text-slate-500">Never sent to the user - visible to admins only.</p>

        <div className="mt-4 flex gap-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add an internal note…"
            rows={2}
            className="input-field flex-1 resize-none"
          />
          <button type="button" onClick={handleAddNote} disabled={addingNote || !noteText.trim()} className="btn-primary self-end">
            {addingNote ? 'Adding…' : 'Add note'}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {notes === null ? (
            <SkeletonBlock className="h-14 w-full" />
          ) : notes.length === 0 ? (
            <EmptyState title="No internal notes yet." />
          ) : (
            notes.map((n) => (
              <div key={n.id} className="rounded-lg border border-slate-100 bg-surface-muted p-3">
                <p className="text-sm text-slate-950">{n.note}</p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {n.createdByName} &middot; {formatDate(n.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function UserInfoTab({ userId }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    userService
      .getUser(userId)
      .then(setUser)
      .catch((err) => setError(err.message || 'Unable to load user.'));
  }, [userId]);

  if (error) return <ErrorState message={error} />;
  if (!user) return <SkeletonBlock className="h-48 w-full" />;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-slate-950">{user.fullName}</p>
        <Link to={`/users/${user.id}`} className="text-sm font-medium text-accent-dark hover:underline">
          View full profile →
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-x-6 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
        <SummaryRow label="Phone">{user.phone}</SummaryRow>
        <SummaryRow label="Email">{user.email}</SummaryRow>
        <SummaryRow label="Date of Birth">{user.dateOfBirth}</SummaryRow>
        <SummaryRow label="Occupation">{user.occupation}</SummaryRow>
        <SummaryRow label="Annual Income">{formatCurrency(user.annualIncome)}</SummaryRow>
        <SummaryRow label="Father's Name">{user.fatherName}</SummaryRow>
      </div>
    </div>
  );
}

function PaymentTab({ applicationId }) {
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    paymentService
      .listPayments({ applicationId })
      .then((result) => setPayments(result.payments))
      .catch((err) => setError(err.message || 'Unable to load payment.'));
  }, [applicationId]);

  if (error) return <ErrorState message={error} />;
  if (payments === null) return <SkeletonBlock className="h-24 w-full" />;
  if (payments.length === 0) {
    return <EmptyState title="No payment recorded for this application yet." />;
  }

  return (
    <div className="space-y-3">
      {payments.map((p) => (
        <div key={p.id} className="card p-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-slate-950">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.amount)}
            </p>
            <StatusBadge label={PAYMENT_STATUS_LABELS[p.status] || p.status} tone={PAYMENT_STATUS_TONES[p.status] || 'bg-slate-100 text-slate-700'} />
          </div>
          <div className="mt-2 divide-y divide-slate-100">
            <SummaryRow label="Payment ID">{p.id}</SummaryRow>
            <SummaryRow label="Provider">{p.provider}</SummaryRow>
            <SummaryRow label="Provider Transaction ID">{p.providerTransactionId}</SummaryRow>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationTab({ applicationId }) {
  const [conversation, setConversation] = useState(undefined); // undefined = loading, null = none found
  const [error, setError] = useState('');

  useEffect(() => {
    conversationService
      .getConversationForApplication(applicationId)
      .then(setConversation)
      .catch((err) => setError(err.message || 'Unable to load conversation.'));
  }, [applicationId]);

  if (error) return <ErrorState message={error} />;
  if (conversation === undefined) return <SkeletonBlock className="h-24 w-full" />;
  if (conversation === null) {
    return (
      <EmptyState
        title="No conversation for this application yet."
        description="A conversation is created once the AI chatbot begins collecting information."
      />
    );
  }

  return (
    <div className="card p-5">
      <p className="font-display text-sm font-semibold text-slate-950">Conversation with {conversation.userName}</p>
      <p className="mt-1 text-sm text-slate-500">
        {conversation.lastMessage ? `Last message: "${conversation.lastMessage}"` : 'No messages yet.'}
      </p>
      <Link to={`/conversations/${conversation.id}`} className="mt-4 inline-block text-sm font-medium text-accent-dark hover:underline">
        Open full conversation →
      </Link>
    </div>
  );
}

function ActivityTab({ applicationId }) {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    applicationService
      .getActivity(applicationId)
      .then(setLogs)
      .catch((err) => setError(err.message || 'Unable to load activity.'));
  }, [applicationId]);

  if (error) return <ErrorState message={error} />;
  if (logs === null) return <SkeletonBlock className="h-32 w-full" />;
  if (logs.length === 0) return <EmptyState title="No activity yet." />;

  return (
    <div className="card divide-y divide-slate-100">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm text-slate-950">
              <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
              {log.fieldChanged && <span className="text-slate-500"> — {log.fieldChanged}</span>}
            </p>
            {(log.oldValue !== undefined || log.newValue !== undefined) && (
              <p className="mt-0.5 text-xs text-slate-500">
                {String(log.oldValue)} → {String(log.newValue)}
              </p>
            )}
          </div>
          <p className="whitespace-nowrap text-xs text-slate-500">{formatDate(log.timestamp)}</p>
        </div>
      ))}
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await applicationService.getApplication(id);
      setApplication(data);
      setLoadState('loaded');
    } catch (err) {
      setError(err.message || 'Unable to load this application.');
      setLoadState('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loadState === 'error') return <ErrorState message={error} onRetry={load} />;
  if (loadState === 'loading') {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate('/applications')}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-950"
      >
        <ArrowLeft size={15} /> Back to Applications
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-950">{application.userName}</h2>
          <p className="font-mono text-sm text-slate-500">{application.id}</p>
        </div>
        <StatusBadge label={STATUS_LABELS[application.status] || application.status} tone={STATUS_TONES[application.status] || 'bg-slate-100 text-slate-700'} />
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === 'overview' && <OverviewTab application={application} onStatusChanged={setApplication} />}
        {activeTab === 'user' && <UserInfoTab userId={application.userId} />}
        {activeTab === 'documents' && <DocumentsTab applicationId={application.id} />}
        {activeTab === 'conversation' && <ConversationTab applicationId={application.id} />}
        {activeTab === 'payment' && <PaymentTab applicationId={application.id} />}
        {activeTab === 'activity' && <ActivityTab applicationId={id} />}
        {NOT_BUILT_TABS.has(activeTab) && (
          <EmptyState
            title={`${TABS.find((t) => t.key === activeTab).label} coming soon`}
            description="This tab is planned for a later build phase."
          />
        )}
      </div>
    </div>
  );
}
