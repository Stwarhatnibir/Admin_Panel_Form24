import api from './api';

async function listPayments(params) {
  const cleanParams = Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null));
  const { data } = await api.get('/payments', { params: cleanParams });
  return { payments: data.data, pagination: data.pagination };
}

async function getPayment(id) {
  const { data } = await api.get(`/payments/${id}`);
  return data.data;
}

export default { listPayments, getPayment };
