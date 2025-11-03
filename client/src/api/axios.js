// client/src/api/axios.js
import axios from 'axios';

const raw = (import.meta.env.VITE_API_URL || 'http://localhost:5050').trim().replace(/\/+$/, '');

const baseURL = raw.endsWith('/api') ? raw : `${raw}/api`;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  timeout: 15000,
});

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

export default api;
export { api };