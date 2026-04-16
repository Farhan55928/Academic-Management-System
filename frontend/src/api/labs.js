import api from './axios.js';

export const getLabs = (courseId) => api.get(`/courses/${courseId}/labs`);
export const addLab = (courseId, data) => api.post(`/courses/${courseId}/labs`, data);
export const updateLab = (id, data) => api.put(`/labs/${id}`, data);
export const deleteLab = (id) => api.delete(`/labs/${id}`);
