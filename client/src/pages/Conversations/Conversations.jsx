import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import conversationService from '../../services/conversationService';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { SkeletonBlock } from '../../components/common/Skeleton';
import StatusBadge from '../../components/applications/StatusBadge';
import { CONVERSATION_STATES, CONVERSATION_STATE_LABELS, CONVERSATION_STATE_TONES } from '../../constants/conversationStates';

const LIMIT = 20;

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function formatTimestamp(value) {
  if (!value) return '—';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function Conversations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const result = await conversationService.listConversations({ search: debouncedSearch, state, page, limit: LIMIT });
      setConversations(result.conversations);
      setPagination(result.pagination);
      setLoadState('loaded');
    } catch (err) {
      setError(err.message || 'Unable to load conversations.');
      setLoadState('error');
    }
  }, [debouncedSearch, state, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, state]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">Conversations</h2>
        <p className="text-sm text-slate-500">Everything a user has said, and everything your team has replied.</p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="w-72">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Search</label>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by user…" />
        </div>
        <div className="w-44">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">State</label>
          <Select
            value={state}
            onChange={setState}
            placeholder="All"
            options={CONVERSATION_STATES.map((s) => ({ value: s, label: CONVERSATION_STATE_LABELS[s] }))}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loadState === 'error' ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : loadState === 'loading' ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No conversations found." />
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/conversations/${c.id}`)}
                  className="flex cursor-pointer items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-xs font-semibold text-white">
                    {c.userName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-950">{c.userName}</p>
                      <span className="shrink-0 text-xs text-slate-500">{formatTimestamp(c.lastMessageAt)}</span>
                    </div>
                    <p className="truncate text-sm text-slate-500">{c.lastMessage || 'No messages yet'}</p>
                  </div>
                  <p className="hidden shrink-0 text-xs text-slate-500 sm:block">{c.schemeName}</p>
                  <StatusBadge
                    label={CONVERSATION_STATE_LABELS[c.state] || c.state}
                    tone={CONVERSATION_STATE_TONES[c.state] || 'bg-slate-100 text-slate-700'}
                  />
                </div>
              ))}
            </div>
            <Pagination page={page} limit={LIMIT} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
