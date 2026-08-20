import api, { setStoredToken } from './api';

async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  setStoredToken(data.data.token);
  return data.data.admin;
}

async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    setStoredToken(null);
  }
}

async function fetchCurrentAdmin() {
  const { data } = await api.get('/auth/me');
  return data.data.admin;
}

export default { login, logout, fetchCurrentAdmin };
