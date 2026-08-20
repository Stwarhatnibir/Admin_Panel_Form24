import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { SkeletonBlock } from '../../components/common/Skeleton';

const LIMIT = 20;

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export default function Users() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const result = await userService.listUsers({ search: debouncedSearch, page, limit: LIMIT });
      setUsers(result.users);
      setPagination(result.pagination);
      setLoadState('loaded');
    } catch (err) {
      setError(err.message || 'Unable to load users.');
      setLoadState('error');
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-950">Users</h2>
          <p className="text-sm text-slate-500">Search by name, phone, email, or user ID.</p>
        </div>
        <div className="w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
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
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No users found." description={search ? 'Try a different search term.' : undefined} />
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-surface-muted text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-muted"
                  >
                    <td className="px-4 py-3 font-medium text-slate-950">{user.fullName}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{user.phone}</td>
                    <td className="px-4 py-3 text-slate-700">{user.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{user.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} limit={LIMIT} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
