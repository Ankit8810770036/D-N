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

// Handle 401 globally with safety checks
let isLoggingOut = false
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const url = err.config?.url || ''
        const status = err.response?.status
        const isAuthEndpoint = url.includes('/login') || url.includes('/register')
        const isAdminEndpoint = url.includes('/admin/')
        const isPublicRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(window.location.pathname)

        // Only handle true token invalidation (ignore admin permission 403/401 and auth endpoints)
        if (status === 401 && !isAuthEndpoint && !isAdminEndpoint && !isLoggingOut) {
            const token = localStorage.getItem('token')
            if (token) {
                isLoggingOut = true
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                if (!isPublicRoute) {
                    window.location.href = '/login'
                }
                setTimeout(() => { isLoggingOut = false }, 3000)
            }
        }
        return Promise.reject(err)
    }
)

export default api
