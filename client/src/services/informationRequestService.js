import api from './api';

async function listForApplication(applicationId) {
  const { data } = await api.get(`/applications/${applicationId}/information-requests`);
  return data.data;
}

async function createTextRequest(applicationId, content) {
  const { data } = await api.post(`/applications/${applicationId}/information-requests`, { type: 'TEXT', content });
  return data.data;
}

async function createStructuredRequest(applicationId, fields) {
  const { data } = await api.post(`/applications/${applicationId}/information-requests`, { type: 'STRUCTURED', fields });
  return data.data;
}

export default { listForApplication, createTextRequest, createStructuredRequest };
