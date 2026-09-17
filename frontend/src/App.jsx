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

// Helper to automatically retry dynamic import on network hiccup or stale chunk hash
function lazyRetry(componentImport) {
    return lazy(async () => {
        const pageHasReloaded = JSON.parse(
            window.sessionStorage.getItem('chunk_load_failed') || 'false'
        )
        try {
            const component = await componentImport()
            window.sessionStorage.setItem('chunk_load_failed', 'false')
            return component
        } catch (error) {
            console.error('Lazy chunk load failed:', error)
            if (!pageHasReloaded) {
                window.sessionStorage.setItem('chunk_load_failed', 'true')
                window.location.reload()
            }
            throw error
        }
    })
}

const Login = lazyRetry(() => import('./pages/Login'))
const Register = lazyRetry(() => import('./pages/Register'))
const ForgotPassword = lazyRetry(() => import('./pages/ForgotPassword'))
const ResetPassword = lazyRetry(() => import('./pages/ResetPassword'))
const NotFound = lazyRetry(() => import('./pages/NotFound'))
const Dashboard = lazyRetry(() => import('./pages/Dashboard'))
const Profile = lazyRetry(() => import('./pages/Profile'))
const Planner = lazyRetry(() => import('./pages/Planner'))
const Progress = lazyRetry(() => import('./pages/Progress'))
const Reports = lazyRetry(() => import('./pages/Reports'))
const Subscription = lazyRetry(() => import('./pages/Subscription'))
const Cookbook = lazyRetry(() => import('./pages/Cookbook'))
const RecipeDetail = lazyRetry(() => import('./pages/RecipeDetail'))
const AdminDashboard = lazyRetry(() => import('./pages/AdminDashboard'))
const AdminUserList = lazyRetry(() => import('./pages/AdminUserList'))
const AdminFoodList = lazyRetry(() => import('./pages/AdminFoodList'))
const AdminRecipeList = lazyRetry(() => import('./pages/AdminRecipeList'))
const AdminFeedbackList = lazyRetry(() => import('./pages/AdminFeedbackList'))
const GroceryList = lazyRetry(() => import('./pages/GroceryList'))
const FeedbackPage = lazyRetry(() => import('./pages/FeedbackPage'))
const Workouts = lazyRetry(() => import('./pages/Workouts'))
import AppLayout from './components/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes: cached data loads instantly (0ms) without refetch
            gcTime: 10 * 60 * 1000,    // 10 minutes garbage collection in memory
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
    const location = useLocation()
    return (
        <ErrorBoundary locationKey={location.key}>
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
                        <Route path="/workouts" element={<Workouts />} />
                        <Route path="/progress" element={<Progress />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/shopping-list" element={<GroceryList />} />
                        <Route path="/feedback" element={<FeedbackPage />} />
                        <Route path="/subscription" element={<Subscription />} />
                        <Route path="/cookbook" element={<Cookbook />} />
                        <Route path="/cookbook/:id" element={<RecipeDetail />} />

                        {/* Friendly Route Aliases to prevent 404s */}
                        <Route path="/recipes" element={<Navigate to="/cookbook" replace />} />
                        <Route path="/recipes/:id" element={<Navigate to="/cookbook" replace />} />
                        <Route path="/grocery" element={<Navigate to="/shopping-list" replace />} />
                        <Route path="/groceries" element={<Navigate to="/shopping-list" replace />} />
                        <Route path="/shopping" element={<Navigate to="/shopping-list" replace />} />
                        <Route path="/plans" element={<Navigate to="/planner" replace />} />
                        <Route path="/diet-planner" element={<Navigate to="/planner" replace />} />
                        <Route path="/workout" element={<Navigate to="/workouts" replace />} />
                        <Route path="/settings" element={<Navigate to="/profile" replace />} />
                        
                        {/* Admin Routes */}
                        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                        <Route path="/admin/users" element={<AdminRoute><AdminUserList /></AdminRoute>} />
                        <Route path="/admin/foods" element={<AdminRoute><AdminFoodList /></AdminRoute>} />
                        <Route path="/admin/recipes" element={<AdminRoute><AdminRecipeList /></AdminRoute>} />
                        <Route path="/admin/feedbacks" element={<AdminRoute><AdminFeedbackList /></AdminRoute>} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    )
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <ScrollToTop />
                        <AppRoutes />
                        <InstallPrompt />
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 2000,
                                style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500 },
                                success: {
                                    duration: 2000,
                                    iconTheme: { primary: '#2d6a4f', secondary: '#fff' }
                                },
                                error: {
                                    duration: 2000
                                }
                            }}
                        />
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    )
}
