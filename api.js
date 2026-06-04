import axios from 'axios';

// Create axios instance with base config for proxy to backend
const api = axios.create({
  baseURL: '/api',  // Vite proxies this to http://localhost:8000
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor: Add JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      // Redirect to login could be added here in app.jsx
      console.log('Token expired, redirecting to login');
    }

    return Promise.reject(error);
  }
);

export default api;

