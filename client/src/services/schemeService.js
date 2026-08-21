import api from './api';

async function listSchemes({ activeOnly = false } = {}) {
  const { data } = await api.get('/schemes', { params: activeOnly ? { activeOnly: 'true' } : {} });
  return data.data;
}

async function getScheme(id) {
  const { data } = await api.get(`/schemes/${id}`);
  return data.data;
}

async function createScheme(payload) {
  const { data } = await api.post('/schemes', payload);
  return data.data;
}

async function updateScheme(id, updates) {
  const { data } = await api.patch(`/schemes/${id}`, updates);
  return data.data;
}

async function updateStatus(id, status) {
  const { data } = await api.patch(`/schemes/${id}/status`, { status });
  return data.data;
}

export default { listSchemes, getScheme, createScheme, updateScheme, updateStatus };
