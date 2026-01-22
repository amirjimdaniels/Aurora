// Template for an API utility using Axios
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Example API call
export const fetchExample = async () => {
  const response = await api.get('/example');
  return response.data;
};
