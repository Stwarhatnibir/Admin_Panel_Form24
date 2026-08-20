import api from './api';

async function listConversations(params) {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  const { data } = await api.get('/conversations', { params: cleanParams });
  return { conversations: data.data, pagination: data.pagination };
}

async function getConversation(id) {
  const { data } = await api.get(`/conversations/${id}`);
  return data.data;
}

async function getConversationForApplication(applicationId) {
  const { data } = await api.get(`/conversations/by-application/${applicationId}`);
  return data.data; // null if none exists yet
}

async function listMessages(id, { since } = {}) {
  const { data } = await api.get(`/conversations/${id}/messages`, { params: since ? { since } : {} });
  return data.data;
}

async function sendMessage(id, message) {
  const { data } = await api.post(`/conversations/${id}/messages`, { message });
  return data.data;
}

export default { listConversations, getConversation, getConversationForApplication, listMessages, sendMessage };
