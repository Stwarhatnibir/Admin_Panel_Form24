import api from './api';

async function listForApplication(applicationId) {
  const { data } = await api.get(`/applications/${applicationId}/otp-requests`);
  return data.data;
}

async function createRequest(applicationId, type) {
  const { data } = await api.post(`/applications/${applicationId}/otp-requests`, { type });
  return data.data;
}

async function updateStatus(otpId, status) {
  const { data } = await api.patch(`/otp-requests/${otpId}/status`, { status });
  return data.data;
}

export default { listForApplication, createRequest, updateStatus };
