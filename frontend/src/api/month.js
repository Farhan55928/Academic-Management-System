import api from './axios.js';

export const getMonths = () => api.get('/months');
export const getMonthDetails = (id) => api.get(`/months/${id}`);
export const createMonth = (data) => api.post('/months', data);
export const updateMonth = (id, data) => api.put(`/months/${id}`, data);
export const deleteMonth = (id) => api.delete(`/months/${id}`);
