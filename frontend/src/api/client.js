import axios from 'axios';

// In production (behind Nginx), use relative URL so requests go through the reverse proxy.
// In development, point directly to the FastAPI server.
const baseURL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

const api = axios.create({
  baseURL,
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
