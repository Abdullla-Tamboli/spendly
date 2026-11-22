import api from './client.js';

export const login = (data) => api.post('/auth/login', data);
export const sendOtp = (email) => api.post('/auth/send-otp', { email });
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');
