import { useCallback, useEffect, useState } from 'react';
import auditLogService from '../../services/auditLogService';
import adminService from '../../services/adminService';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { SkeletonBlock } from '../../components/common/Skeleton';
import { AUDIT_ACTIONS, ENTITY_TYPES } from '../../constants/auditActions';

const LIMIT = 25;
const DIMENSIONS = [
  { key: 'none', label: 'No filter' },
  { key: 'admin', label: 'Admin' },
  { key: 'action', label: 'Action' },
  { key: 'entity', label: 'Entity' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AuditLogs() {
  const [dimension, setDimension] = useState('none');
  const [admins, setAdmins] = useState([]);
  const [actorId, setActorId] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.listAdmins().then(setAdmins).catch(() => setAdmins([]));
  }, []);

  const handleDimensionChange = (key) => {
    setDimension(key);
    setActorId('');
    setAction('');
    setEntityType('');
    setEntityId('');
  };

  // Only send the filter matching the currently selected dimension, plus
  // date range - this keeps queries within the composite indexes actually
  // defined for this collection. See the comment in auditService.js.
  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const params = { dateFrom, dateTo, page, limit: LIMIT };
      if (dimension === 'admin') params.actorId = actorId;
      if (dimension === 'action') params.action = action;
      if (dimension === 'entity') {
        params.entityType = entityType;
        params.entityId = entityId;
      }
      const result = await auditLogService.listAuditLogs(params);
      setLogs(result.logs);
      setPagination(result.pagination);
      setLoadState('loaded');
    } catch (err) {
      setError(err.message || 'Unable to load audit logs.');
      setLoadState('error');
    }
  }, [dimension, actorId, action, entityType, entityId, dateFrom, dateTo, page]);

  useEffect(() => {
    setPage(1);
  }, [dimension, actorId, action, entityType, entityId, dateFrom, dateTo]);

  useEffect(() => {
    // For the "entity" dimension, wait until both fields are filled before
    // querying - entityType alone isn't indexed (see auditService.js).
    if (dimension === 'entity' && (!entityType || !entityId)) {
      setLogs([]);
      setPagination({ total: 0 });
      setLoadState('loaded');
      return;
    }
    load();
  }, [load, dimension, entityType, entityId]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">Audit Logs</h2>
        <p className="text-sm text-slate-500">Every important action taken across the admin panel.</p>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex gap-1 rounded-lg bg-surface-muted p-1 text-sm">
          {DIMENSIONS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => handleDimensionChange(d.key)}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                dimension === d.key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {dimension === 'admin' && (
            <div className="w-56">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Admin</label>
              <Select value={actorId} onChange={setActorId} placeholder="Select admin" options={admins.map((a) => ({ value: a.id, label: a.name }))} />
            </div>
          )}
          {dimension === 'action' && (
            <div className="w-64">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Action</label>
              <Select value={action} onChange={setAction} placeholder="Select action" options={AUDIT_ACTIONS.map((a) => ({ value: a, label: a.replace(/_/g, ' ') }))} />
            </div>
          )}
          {dimension === 'entity' && (
            <>
              <div className="w-44">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Entity type</label>
                <Select value={entityType} onChange={setEntityType} placeholder="Select type" options={ENTITY_TYPES.map((t) => ({ value: t, label: t }))} />
              </div>
              <div className="w-56">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Entity ID</label>
                <input type="text" value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="Required" className="input-field" />
              </div>
            </>
          )}
          <div className="w-40">
            <label className="mb-1.5 block text-xs font-medium text-slate-500">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
          </div>
          <div className="w-40">
            <label className="mb-1.5 block text-xs font-medium text-slate-500">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
          </div>
        </div>

        {dimension === 'entity' && (!entityType || !entityId) && (
          <p className="text-xs text-slate-500">Select both an entity type and ID to see results.</p>
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
              <SkeletonBlock key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No audit log entries found." description="Try a different filter or date range." />
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm text-slate-950">
                      <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                      {log.entityType && <span className="text-slate-500"> — {log.entityType}{log.entityId ? ` (${log.entityId})` : ''}</span>}
                    </p>
                    {log.fieldChanged && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {log.fieldChanged}: {String(log.oldValue)} → {String(log.newValue)}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">Actor: {log.actorId} ({log.actorRole})</p>
                  </div>
                  <p className="whitespace-nowrap text-xs text-slate-500">{formatDate(log.timestamp)}</p>
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
