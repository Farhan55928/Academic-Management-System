import api from './axios.js';

// ─── Study Days ─────────────────────────────────────────────
export const getStudyDays    = ()       => api.get('/study/days');
export const getStudyDay     = (id)     => api.get(`/study/days/${id}`);
export const createStudyDay  = (data)   => api.post('/study/days', data);
export const deleteStudyDay  = (id)     => api.delete(`/study/days/${id}`);

// ─── Study Sessions ─────────────────────────────────────────
export const getSessionsByDay = (dayId)        => api.get(`/study/days/${dayId}/sessions`);
export const createSession    = (dayId, data)  => api.post(`/study/days/${dayId}/sessions`, data);
export const updateSession    = (id, data)     => api.put(`/study/sessions/${id}`, data);
export const deleteSession    = (id)           => api.delete(`/study/sessions/${id}`);

// ─── Day Overview ───────────────────────────────────────────
export const getOverview            = (dayId)        => api.get(`/study/days/${dayId}/overview`);
export const createOrUpdateOverview = (dayId, data)  => api.post(`/study/days/${dayId}/overview`, data);
export const deleteOverview         = (dayId)        => api.delete(`/study/days/${dayId}/overview`);
