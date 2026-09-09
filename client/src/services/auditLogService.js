import api from './api';

async function listAuditLogs(params) {
  const cleanParams = Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null));
  const { data } = await api.get('/audit-logs', { params: cleanParams });
  return { logs: data.data, pagination: data.pagination };
}

export default { listAuditLogs };
