import axios from 'axios';

// Create Axios instance
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1', // Should be configured via env var in prod
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        // Inject token if available (for MVP assuming local storage or similar)
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                // Redirect to login if unauthorized
                if (typeof window !== 'undefined') {
                    // window.location.href = '/login'; // Commented out for MVP until login exists
                    console.warn('Unauthorized access');
                }
            } else if (error.response.status === 429) {
                // Rate limit hit
                console.warn('Rate limit exceeded. Please wait.');
                // Could trigger a toast here if we had access to toast function/context
            }
        }
        return Promise.reject(error);
    }
);

export default api;
