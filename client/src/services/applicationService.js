import api from './api';

async function listApplications(params) {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  const { data } = await api.get('/applications', { params: cleanParams });
  return { applications: data.data, pagination: data.pagination };
}

async function getApplication(id) {
  const { data } = await api.get(`/applications/${id}`);
  return data.data;
}

async function updateStatus(id, status) {
  const { data } = await api.patch(`/applications/${id}/status`, { status });
  return data.data;
}

async function getActivity(id) {
  const { data } = await api.get(`/applications/${id}/activity`);
  return data.data;
}

async function listNotes(id) {
  const { data } = await api.get(`/applications/${id}/notes`);
  return data.data;
}

async function addNote(id, note) {
  const { data } = await api.post(`/applications/${id}/notes`, { note });
  return data.data;
}

export default { listApplications, getApplication, updateStatus, getActivity, listNotes, addNote };
