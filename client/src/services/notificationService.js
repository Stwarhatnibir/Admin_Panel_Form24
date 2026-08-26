import api from './api';

async function listNotifications(params) {
  const { data } = await api.get('/notifications', { params });
  return { notifications: data.data, pagination: data.pagination };
}

async function sendNotification(payload) {
  const { data } = await api.post('/notifications', payload);
  return data.data;
}

export default { listNotifications, sendNotification };
