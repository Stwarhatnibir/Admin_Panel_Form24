import api from './api';

async function listRefunds(params) {
  const cleanParams = Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null));
  const { data } = await api.get('/refunds', { params: cleanParams });
  return { refunds: data.data, pagination: data.pagination };
}

async function getRefund(id) {
  const { data } = await api.get(`/refunds/${id}`);
  return data.data;
}

async function createRefund(payload) {
  const { data } = await api.post('/refunds', payload);
  return data.data;
}

async function approveRefund(id) {
  const { data } = await api.post(`/refunds/${id}/approve`);
  return data.data;
}

async function rejectRefund(id, reason) {
  const { data } = await api.post(`/refunds/${id}/reject`, { reason });
  return data.data;
}

export default { listRefunds, getRefund, createRefund, approveRefund, rejectRefund };
