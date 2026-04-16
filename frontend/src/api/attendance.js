import api from './axios.js';

export const getAttendance = (courseId) => api.get(`/courses/${courseId}/attendance`);
export const addAttendance = (courseId, data) => api.post(`/courses/${courseId}/attendance`, data);
export const updateAttendance = (id, data) => api.put(`/attendance/${id}`, data);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);
