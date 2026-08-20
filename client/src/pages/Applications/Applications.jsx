import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react';
import applicationService from '../../services/applicationService';
import schemeService from '../../services/schemeService';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { SkeletonBlock } from '../../components/common/Skeleton';
import StatusBadge from '../../components/applications/StatusBadge';
import { APPLICATION_STATUSES, STATUS_LABELS, STATUS_TONES, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from '../../constants/applicationStatuses';

const LIMIT = 20;

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function formatDate(value) {
  if (!value) return '—';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount || 0
  );
}

export default function Applications() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [status, setStatus] = useState('');
  const [schemeId, setSchemeId] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const [schemes, setSchemes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    schemeService.listSchemes().then(setSchemes).catch(() => setSchemes([]));
  }, []);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const result = await applicationService.listApplications({
        search: debouncedSearch,
        status,
        schemeId,
        createdFrom,
        createdTo,
        sortBy: 'createdAt',
        sortDir,
        page,
        limit: LIMIT,
      });
      setApplications(result.applications);
      setPagination(result.pagination);
      setLoadState('loaded');
    } catch (err) {
      setError(err.message || 'Unable to load applications.');
      setLoadState('error');
    }
  }, [debouncedSearch, status, schemeId, createdFrom, createdTo, sortDir, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, schemeId, createdFrom, createdTo]);

  useEffect(() => {
    load();
  }, [load]);

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setSchemeId('');
    setCreatedFrom('');
    setCreatedTo('');
  };

  const hasActiveFilters = search || status || schemeId || createdFrom || createdTo;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">Applications</h2>
        <p className="text-sm text-slate-500">Every application, from payment through to form submission.</p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="w-64">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Search</label>
          <SearchInput value={search} onChange={setSearch} placeholder="Application, user, scheme…" />
        </div>
        <div className="w-48">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Status</label>
          <Select
            value={status}
            onChange={setStatus}
            placeholder="All statuses"
            options={APPLICATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          />
        </div>
        <div className="w-52">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Scheme</label>
          <Select
            value={schemeId}
            onChange={setSchemeId}
            placeholder="All schemes"
            options={schemes.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>
        <div className="w-40">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">From</label>
          <input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="input-field" />
        </div>
        <div className="w-40">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">To</label>
          <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="input-field" />
        </div>
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="btn-secondary"
          title="Toggle sort by created date"
        >
          <ArrowUpDown size={15} />
          {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={resetFilters} className="text-sm font-medium text-slate-500 hover:text-slate-950">
            Clear filters
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loadState === 'error' ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : loadState === 'loading' ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No applications found." description={hasActiveFilters ? 'Try different filters.' : undefined} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-surface-muted text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Application ID</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">User</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Scheme</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Amount</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Payment</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Created</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className="cursor-pointer transition-colors hover:bg-surface-muted"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{app.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">{app.userName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{app.schemeName}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{formatCurrency(app.amount)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge
                          label={PAYMENT_STATUS_LABELS[app.paymentStatus] || app.paymentStatus}
                          tone={PAYMENT_STATUS_TONES[app.paymentStatus] || 'bg-slate-100 text-slate-700'}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge label={STATUS_LABELS[app.status] || app.status} tone={STATUS_TONES[app.status] || 'bg-slate-100 text-slate-700'} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(app.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(app.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} limit={LIMIT} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
