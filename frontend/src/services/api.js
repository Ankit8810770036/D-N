import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://diet-planner-api-njyc.onrender.com/api' : '/api'),
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle 401 globally only for authenticated endpoints
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const isAuthEndpoint = err.config?.url?.includes('/login') || err.config?.url?.includes('/register')
        const isPublicRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(window.location.pathname)

        if (err.response?.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            if (!isPublicRoute) {
                window.location.href = '/login'
            }
        }
        return Promise.reject(err)
    }
)

export default api
