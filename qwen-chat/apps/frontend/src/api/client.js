import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const getSessions = (q) => api.get('/sessions', { params: q ? { q } : {} }).then((r) => r.data);
export const createSession = (title = 'New Chat') => api.post('/sessions', { title }).then((r) => r.data);
export const getSession = (id) => api.get(`/sessions/${id}`).then((r) => r.data);
export const updateSession = (id, data) => api.patch(`/sessions/${id}`, data).then((r) => r.data);
export const deleteSession = (id) => api.delete(`/sessions/${id}`);

export const getMessages = (sessionId) => api.get(`/sessions/${sessionId}/messages`).then((r) => r.data);
export const clearMessages = (sessionId) => api.delete(`/sessions/${sessionId}/messages`);
export const deleteMessageAndAfter = (sessionId, messageId) =>
  api.delete(`/sessions/${sessionId}/messages/${messageId}`);
export const stopStream = (sessionId) => api.post(`/sessions/${sessionId}/stop`).then((r) => r.data);
export const getHealth = () => api.get('/health').then((r) => r.data);

export default api;
