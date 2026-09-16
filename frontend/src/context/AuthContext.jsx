import { createContext, useContext, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
    })
    const [loading, setLoading] = useState(true)
    const queryClient = useQueryClient()

    useEffect(() => {
        const fetchMe = () => {
            const token = localStorage.getItem('token')
            if (token) {
                api.get('/me')
                    .then(({ data }) => {
                        setUser(data)
                        localStorage.setItem('user', JSON.stringify(data))
                    })
                    .catch((err) => {
                        // Only log out on explicit 401 Unauthorized (invalid/expired token)
                        // If offline or network drop, preserve the cached user so they stay logged in
                        if (err.response?.status === 401) {
                            localStorage.removeItem('token')
                            localStorage.removeItem('user')
                            setUser(null)
                        } else {
                            // Offline or network error: load cached user from localStorage
                            const cached = localStorage.getItem('user')
                            if (cached) {
                                try {
                                    setUser(JSON.parse(cached))
                                } catch (_) {}
                            }
                        }
                    })
                    .finally(() => setLoading(false))
            } else {
                setLoading(false)
            }
        }

        fetchMe()

        // When device comes back online, quietly refresh session
        const handleOnline = () => {
            if (navigator.onLine && localStorage.getItem('token')) {
                fetchMe()
            }
        }
        window.addEventListener('online', handleOnline)

        // Periodically refresh session (every 30 mins) to catch mid-session auto-downgrades
        const interval = setInterval(() => {
            if (navigator.onLine) {
                fetchMe()
            }
        }, 30 * 60 * 1000)

        return () => {
            clearInterval(interval)
            window.removeEventListener('online', handleOnline)
        }
    }, [])

    async function login(email, password) {
        queryClient.clear()
        localStorage.removeItem('seen_badges')
        const { data } = await api.post('/login', { email, password })
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return data.user
    }

    async function register(payload) {
        queryClient.clear()
        localStorage.removeItem('seen_badges')
        const { data } = await api.post('/register', payload)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return data.user
    }

    async function logout() {
        try { await api.post('/logout') } catch (_) { }
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('seen_badges')
        queryClient.clear()
        setUser(null)
    }

    const isAdmin = user?.role === 'admin'
    const isPremium = user?.plan_type === 'premium' || isAdmin
    const daysUntilExpiry = user?.days_until_expiry

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, isAdmin, isPremium, daysUntilExpiry }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
