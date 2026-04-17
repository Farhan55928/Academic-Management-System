import api from './axios.js';

export const getExpenses = (monthId) => api.get(monthId ? `/expenses?monthId=${monthId}` : '/expenses');
export const addExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
