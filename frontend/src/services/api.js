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

// Handle 401 globally with safety checks (prevent spurious logouts on background requests)
let isLoggingOut = false
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const url = err.config?.url || ''
        const status = err.response?.status
        const isAuthCheck = url.includes('/me')
        const isPublicRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(window.location.pathname)

        // Only log out if the core session verification endpoint (/me) explicitly fails with 401
        if (status === 401 && isAuthCheck && !isLoggingOut) {
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
