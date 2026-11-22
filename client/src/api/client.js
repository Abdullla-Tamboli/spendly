import axios from 'axios';

const defaultBaseURL = import.meta.env.PROD
  ? 'https://spendly-axn5.onrender.com/api/v1'
  : 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseURL,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spendly_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
