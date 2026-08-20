import api from './api';

async function getStats() {
  const { data } = await api.get('/dashboard/stats');
  return data.data;
}

export default { getStats };
