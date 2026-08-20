import api from './api';

async function listForApplication(applicationId) {
  const { data } = await api.get(`/applications/${applicationId}/documents`);
  return data.data;
}

async function download(documentId) {
  const { data } = await api.get(`/documents/${documentId}/download`);
  return data.data; // { url, fileName }
}

async function verify(documentId) {
  const { data } = await api.post(`/documents/${documentId}/verify`);
  return data.data;
}

async function requestReupload(documentId, reason) {
  const { data } = await api.post(`/documents/${documentId}/request-reupload`, { reason });
  return data.data;
}

export default { listForApplication, download, verify, requestReupload };
