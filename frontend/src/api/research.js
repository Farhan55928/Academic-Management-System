import api from './axios.js';

/* ─── Research Projects ─────────────────────────────── */
export const getProjects      = ()       => api.get('/research/projects');
export const getProjectById   = (id)     => api.get(`/research/projects/${id}`).catch(() => null);
export const createProject    = (data)   => api.post('/research/projects', data);
export const updateProject    = (id, d)  => api.put(`/research/projects/${id}`, d);
export const deleteProject    = (id)     => api.delete(`/research/projects/${id}`);

/* ─── Papers ─────────────────────────────────────────── */
export const getPapers        = (projectId) => api.get(projectId ? `/research/papers?projectId=${projectId}` : '/research/papers');
export const getPaperById     = (id)     => api.get(`/research/papers/${id}`);
export const uploadPaper      = (projectId, formData) =>
  api.post(`/research/papers/${projectId}`, formData, {
    // The shared axios instance in api/axios.js sets a default
    // `Content-Type: application/json`. If that header rides along on a
    // FormData body, the request goes out as JSON and multer never sees
    // the file. Delete it here so axios auto-sets
    // `multipart/form-data; boundary=…` from the FormData instance.
    headers: { 'Content-Type': undefined },
    timeout: 60000, // upload + initial summary can be slow
  });
export const regenerateSummary = (id) => api.post(`/research/papers/${id}/regenerate`);
export const deletePaper      = (id)     => api.delete(`/research/papers/${id}`);

/* ─── Google Drive connection ────────────────────────── */
// Browser-side redirect to the OAuth consent screen. We pass the JWT as
// a query param so the backend can recover the user identity (browsers
// don't send Authorization headers on plain navigations).
export function redirectToGoogleConnect() {
  const token = localStorage.getItem('ams_token') || '';
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:9000';
  const url = new URL(`${apiBase}/api/auth/google`);
  if (token) url.searchParams.set('token', token);
  window.location.href = url.toString();
}
