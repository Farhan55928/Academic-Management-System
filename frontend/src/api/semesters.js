import api from './axios.js';

export const getSemesters = () => api.get('/semesters');
export const createSemester = (data) => api.post('/semesters', data);
export const updateSemester = (id, data) => api.put(`/semesters/${id}`, data);
export const deleteSemester = (id) => api.delete(`/semesters/${id}`);
export const activateSemester = (id) => api.patch(`/semesters/${id}/activate`);
