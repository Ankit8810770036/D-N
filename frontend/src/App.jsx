import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy, useEffect } from 'react'

function ScrollToTop() {
    const { pathname } = useLocation()

    useEffect(() => {
        if (!window.location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
            if (document.documentElement) document.documentElement.scrollTop = 0
            if (document.body) document.body.scrollTop = 0
        }
    }, [pathname])

    return null
}

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Planner = lazy(() => import('./pages/Planner'))
const Progress = lazy(() => import('./pages/Progress'))
const Reports = lazy(() => import('./pages/Reports'))
const Subscription = lazy(() => import('./pages/Subscription'))
const Cookbook = lazy(() => import('./pages/Cookbook'))
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminUserList = lazy(() => import('./pages/AdminUserList'))
const AdminFoodList = lazy(() => import('./pages/AdminFoodList'))
const AdminRecipeList = lazy(() => import('./pages/AdminRecipeList'))
const GroceryList = lazy(() => import('./pages/GroceryList'))
import AppLayout from './components/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'

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
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-[#2d6a4f] border-t-transparent rounded-full" />
            </div>
        }>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register"       element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                <Route path="/reset-password"  element={<ResetPassword />} />

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

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    )
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <ScrollToTop />
                        <ErrorBoundary>
                            <AppRoutes />
                        </ErrorBoundary>
                        <InstallPrompt />
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
