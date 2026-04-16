import api from './axios.js';

export const getCourses = (semesterId) => api.get(`/semesters/${semesterId}/courses`);
export const createCourse = (semesterId, data) => api.post(`/semesters/${semesterId}/courses`, data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
