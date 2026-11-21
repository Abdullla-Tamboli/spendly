import api from './client.js';

export const getDashboard = () => api.get('/dashboard');
export const getAnalytics = (range) => api.get('/analytics', { params: { range } });

export const listAccounts = () => api.get('/accounts');
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

export const listCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

export const getBudget = (month) => api.get('/budgets', { params: { month } });
export const upsertBudget = (month, data) => api.put(`/budgets/${month}`, data);
export const deleteBudget = (month) => api.delete(`/budgets/${month}`);

export const listGoals = () => api.get('/goals');
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const contributeGoal = (id, amount) =>
  api.patch(`/goals/${id}/contribute`, { amount });
export const deleteGoal = (id) => api.delete(`/goals/${id}`);

export const listRecurring = () => api.get('/recurring');
export const patchRecurring = (id, data) => api.patch(`/recurring/${id}`, data);
export const deleteRecurring = (id) => api.delete(`/recurring/${id}`);
