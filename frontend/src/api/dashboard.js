import api from './axios.js';

export const getDashboard = (signal) => api.get('/dashboard', { signal });
