import api from './axios.js';

// ─── Weeks ──────────────────────────────────────────────────
export const getWeeks       = (semesterId) => api.get('/backlog/weeks', { params: semesterId ? { semesterId } : {} });
export const getWeekDetails = (id)         => api.get(`/backlog/weeks/${id}`);
export const createWeek     = (data)       => api.post('/backlog/weeks', data);
export const updateWeek     = (id, data)   => api.put(`/backlog/weeks/${id}`, data);
export const deleteWeek     = (id)         => api.delete(`/backlog/weeks/${id}`);

// ─── Sections ───────────────────────────────────────────────
export const createSection = (weekId, data) => api.post(`/backlog/weeks/${weekId}/sections`, data);
export const updateSection = (id, data)     => api.put(`/backlog/sections/${id}`, data);
export const deleteSection = (id)           => api.delete(`/backlog/sections/${id}`);

// ─── Subsections ────────────────────────────────────────────
export const createSubsection = (sectionId, data) => api.post(`/backlog/sections/${sectionId}/subsections`, data);
export const updateSubsection = (id, data)        => api.put(`/backlog/subsections/${id}`, data);
export const deleteSubsection = (id)              => api.delete(`/backlog/subsections/${id}`);

// ─── Steps ──────────────────────────────────────────────────
export const createStep = (subsectionId, data) => api.post(`/backlog/subsections/${subsectionId}/steps`, data);
export const updateStep = (id, data)           => api.put(`/backlog/steps/${id}`, data);
export const deleteStep = (id)                 => api.delete(`/backlog/steps/${id}`);

// ─── Reordering ─────────────────────────────────────────────
export const reorder = (data) => api.put('/backlog/reorder', data);
