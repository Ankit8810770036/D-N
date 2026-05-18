import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Planner from './pages/Planner'
import Progress from './pages/Progress'
import Reports from './pages/Reports'
import Subscription from './pages/Subscription'
import Cookbook from './pages/Cookbook'
import RecipeDetail from './pages/RecipeDetail'
import AdminDashboard from './pages/AdminDashboard'
import AdminUserList from './pages/AdminUserList'
import AdminFoodList from './pages/AdminFoodList'
import AdminRecipeList from './pages/AdminRecipeList'
import AppLayout from './components/AppLayout'
import GroceryList from './pages/GroceryList'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
})

function PrivateRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-[#2d6a4f] border-t-transparent rounded-full" />
        </div>
    )
    return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
    const { user, loading, isAdmin } = useAuth()
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-[#2d6a4f] border-t-transparent rounded-full" />
        </div>
    )
    return user && isAdmin ? children : <Navigate to="/dashboard" replace />
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return null
    return user ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/shopping-list" element={<GroceryList />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/cookbook" element={<Cookbook />} />
                <Route path="/cookbook/:id" element={<RecipeDetail />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUserList /></AdminRoute>} />
                <Route path="/admin/foods" element={<AdminRoute><AdminFoodList /></AdminRoute>} />
                <Route path="/admin/recipes" element={<AdminRoute><AdminRecipeList /></AdminRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <AppRoutes />
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500 },
                                success: { iconTheme: { primary: '#2d6a4f', secondary: '#fff' } },
                            }}
                        />
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    )
}
