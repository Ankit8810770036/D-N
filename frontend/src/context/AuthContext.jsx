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
        const token = localStorage.getItem('token')
        if (token) {
            api.get('/me')
                .then(({ data }) => {
                    setUser(data)
                    localStorage.setItem('user', JSON.stringify(data))
                })
                .catch(() => {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    setUser(null)
                })
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [])

    async function login(email, password) {
        queryClient.clear()
        const { data } = await api.post('/login', { email, password })
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return data.user
    }

    async function register(payload) {
        queryClient.clear()
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
        queryClient.clear()
        setUser(null)
    }

    const isAdmin = user?.role === 'admin'

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
