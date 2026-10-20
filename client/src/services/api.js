import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header with JWT token for protected routes
API.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('gymflow_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error('Failed to parse token from localStorage:', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear user if token is expired/invalid (avoid redirect loop if on login page)
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('gymflow_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
