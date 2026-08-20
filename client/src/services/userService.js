import api from './api';

async function listUsers({ search = '', page = 1, limit = 20 } = {}) {
  const { data } = await api.get('/users', { params: { search: search || undefined, page, limit } });
  return { users: data.data, pagination: data.pagination };
}

async function getUser(id) {
  const { data } = await api.get(`/users/${id}`);
  return data.data;
}

async function updateUser(id, updates) {
  const { data } = await api.patch(`/users/${id}`, updates);
  return data.data;
}

async function getUserActivity(id) {
  const { data } = await api.get(`/users/${id}/activity`);
  return data.data;
}

export default { listUsers, getUser, updateUser, getUserActivity };
