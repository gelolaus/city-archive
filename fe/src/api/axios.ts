import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.gelolaus.com/api",
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    // Automatically attach JWT token when available
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

