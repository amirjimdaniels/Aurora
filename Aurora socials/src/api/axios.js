import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Send cookies (including HttpOnly authToken) with requests
});

// Request interceptor - automatically add JWT token to all requests
// Note: Server prioritizes HttpOnly cookie, but we keep localStorage for backwards compatibility
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token expired or invalid - clear storage and redirect to login
            const message = error.response?.data?.message || '';
            if (message.includes('token') || message.includes('expired')) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                localStorage.removeItem('username');
                // Only redirect if not already on auth pages
                if (!window.location.pathname.includes('signin') && window.location.pathname !== '/') {
                    window.location.href = '/signin';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
