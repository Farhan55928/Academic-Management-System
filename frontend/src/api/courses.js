import api from './axios.js';

export const getCourses = (semesterId, signal) => api.get(`/semesters/${semesterId}/courses`, { signal });
export const getCourse = (id, signal) => api.get(`/courses/${id}`, { signal });
export const createCourse = (semesterId, data) => api.post(`/semesters/${semesterId}/courses`, data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
