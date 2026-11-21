import api from './client.js';

export const listTransactions = (params) => api.get('/transactions', { params });
export const getTransaction = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const exportCsv = (params) =>
  api.get('/transactions/export', { params, responseType: 'blob' });

export const uploadAttachment = (id, file) => {
  const body = new FormData();
  body.append('attachment', file);
  return api.post(`/transactions/${id}/attachment`, body);
};
