import api from './axios.js';

export const getMarks = (courseId) => api.get(`/courses/${courseId}/marks`);
export const addMarks = (courseId, data) => api.post(`/courses/${courseId}/marks`, data);
export const updateMarks = (id, data) => api.put(`/marks/${id}`, data);
export const deleteMarks = (id) => api.delete(`/marks/${id}`);
