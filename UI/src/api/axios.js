import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD
  ? 'https://mandalam.onrender.com/api'
  : 'http://localhost:5000/api');

export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((req) => {
  // 1. Try fetching standalone token
  let token = localStorage.getItem('token');

  // 2. Fall back to user object if stored as JSON
  if (!token) {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        token = parsedUser?.token;
      }
    } catch (parseError) {
      console.error('Error parsing user from localStorage:', parseError);
    }
  }

  // 3. Attach Bearer token if found
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = /^\/auth\/(login|register)/.test(error.config?.url || '');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.assign('/login');
    }

    return Promise.reject(error);
  },
);

export default API;