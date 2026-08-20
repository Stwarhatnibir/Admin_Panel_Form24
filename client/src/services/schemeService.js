import api from './api';

async function listSchemes({ activeOnly = false } = {}) {
  const { data } = await api.get('/schemes', { params: activeOnly ? { activeOnly: 'true' } : {} });
  return data.data;
}

export default { listSchemes };
