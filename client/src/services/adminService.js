import api from './api';

async function listAdmins() {
  const { data } = await api.get('/admins');
  return data.data;
}

async function createAdmin(payload) {
  const { data } = await api.post('/admins', payload);
  return data.data;
}

async function removeAdmin(id) {
  const { data } = await api.delete(`/admins/${id}`);
  return data.data;
}

async function getAdminActivity(id) {
  const { data } = await api.get(`/admins/${id}/activity`);
  return data.data;
}

export default { listAdmins, createAdmin, removeAdmin, getAdminActivity };
