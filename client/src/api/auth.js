import api from './client.js';

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const sendRegistrationOtp = (email) => api.post('/auth/send-registration-otp', { email });
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');
