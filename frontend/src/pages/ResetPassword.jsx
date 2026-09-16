import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/errors'
import AuthNavbar from '../components/AuthNavbar'

export default function ResetPassword() {
    const [searchParams]          = useSearchParams()
    const navigate                = useNavigate()
    const [loading, setLoading]   = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [form, setForm]         = useState({
        token:                 searchParams.get('token') || '',
        email:                 searchParams.get('email') || '',
        password:              '',
        password_confirmation: '',
    })

    // If token/email is missing from the URL, the link is broken
    useEffect(() => {
        if (!form.token || !form.email) {
            toast.error('Invalid or expired reset link. Please request a new one.')
            navigate('/forgot-password')
        }
    }, [])

    const passwordsMatch = form.password && form.password === form.password_confirmation
    const isStrong       = form.password.length >= 8

    async function handleSubmit(e) {
        e.preventDefault()
        if (!passwordsMatch) return toast.error('Passwords do not match.')
        if (!isStrong)       return toast.error('Password must be at least 8 characters.')

        setLoading(true)
        try {
            const { data } = await api.post('/reset-password', form)
            toast.success(data.message || 'Password reset successfully!')
            navigate('/login')
        } catch (err) {
            toast.error(getErrorMessage(err, 'Password reset failed. Please request a new link.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[100dvh] lg:h-[100dvh] w-full relative flex flex-col items-center justify-center font-outfit bg-cover bg-center bg-slate-50 dark:bg-[#081c15] overflow-y-auto lg:overflow-hidden pt-18 sm:pt-20 pb-8 px-4 sm:px-6 transition-colors duration-300"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1498837167922-41c3735b2385?auto=format&fit=crop&q=80')" }}>
            {/* Top Auth Navbar */}
            <AuthNavbar />

            {/* Background Glow Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] right-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-emerald-400/25 dark:bg-emerald-500/20 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] sm:left-[10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-teal-400/20 dark:bg-green-400/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="absolute inset-0 bg-white/75 dark:bg-black/50 backdrop-blur-[3px] dark:backdrop-blur-[2px] z-0 transition-colors duration-300" />

            <div className="relative z-10 w-full max-w-[480px] mx-auto my-auto py-2 sm:py-4 lg:py-0 animate-slide-up">
                <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-2xl border border-slate-200/90 dark:border-white/15 rounded-3xl sm:rounded-[2rem] p-6 sm:p-9 shadow-2xl shadow-slate-200/70 dark:shadow-[0_0_60px_rgba(0,0,0,0.5)] transition-colors duration-300">

                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-white/10 border border-emerald-200/80 dark:border-white/20 text-2xl shadow-sm">
                                🛡️
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Reset Password</h1>
                        </div>
                        <p className="text-slate-500 dark:text-gray-400 text-xs sm:text-sm font-semibold">
                            Enter your new password below
                        </p>
                        {form.email && (
                            <p className="text-emerald-600 dark:text-green-400 text-xs sm:text-sm font-bold mt-1">{form.email}</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* New Password */}
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-2 ml-1">
                                New Password
                            </label>
                            <div className="relative overflow-hidden rounded-2xl">
                                <input
                                    id="new-password"
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    className={`w-full bg-white/95 dark:bg-black/40 backdrop-blur-md border ${
                                        form.password ? (isStrong ? 'border-emerald-500 dark:border-green-500/50 ring-2 ring-emerald-500/20' : 'border-red-500/50') : 'border-slate-300 dark:border-white/20'
                                    } rounded-2xl px-5 py-3.5 sm:py-4 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-emerald-500 dark:focus:border-green-400 focus:ring-4 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-black/60 transition-all duration-300 pr-12 shadow-sm dark:shadow-inner`}
                                    placeholder="At least 8 characters"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-white/50 dark:hover:text-white transition-colors p-1 focus:outline-none"
                                    title={showPass ? "Hide password" : "Show password"}
                                    aria-label={showPass ? "Hide password" : "Show password"}
                                >
                                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {/* Strength bar */}
                            {form.password && (
                                <div className="mt-2 flex gap-1.5 px-1">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                            form.password.length > i * 2 + 2
                                                ? i < 2 ? 'bg-red-400' : i < 3 ? 'bg-yellow-400' : 'bg-emerald-500 dark:bg-green-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                                : 'bg-slate-200 dark:bg-white/10'
                                        }`} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-2 ml-1">
                                Confirm Password
                            </label>
                            <div className="relative overflow-hidden rounded-2xl">
                                <input
                                    id="confirm-password"
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password_confirmation}
                                    onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                                    className={`w-full bg-white/95 dark:bg-black/40 backdrop-blur-md border ${
                                        form.password_confirmation
                                            ? (passwordsMatch ? 'border-emerald-500 dark:border-green-500/50 ring-2 ring-emerald-500/20' : 'border-red-500/50')
                                            : 'border-slate-300 dark:border-white/20'
                                    } rounded-2xl px-5 py-3.5 sm:py-4 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-emerald-500 dark:focus:border-green-400 focus:ring-4 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-black/60 transition-all duration-300 pr-12 shadow-sm dark:shadow-inner`}
                                    placeholder="Re-enter your password"
                                    required
                                />
                                {/* Match indicator */}
                                {form.password_confirmation && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {passwordsMatch
                                            ? <svg className="w-5 h-5 text-emerald-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            : <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        }
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            id="reset-password-btn"
                            type="submit"
                            disabled={loading || !passwordsMatch || !isStrong}
                            className="w-full py-3.5 sm:py-4 mt-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-2xl hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-emerald-700/25 uppercase tracking-wider text-xs sm:text-sm flex justify-center items-center h-12 sm:h-14 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading
                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : 'Set New Password →'
                            }
                        </button>
                    </form>

                    <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-6 font-medium">
                        Link expired?{' '}
                        <Link to="/forgot-password" className="text-emerald-600 dark:text-green-400 font-bold hover:text-emerald-700 dark:hover:text-green-300 transition-colors">
                            Request a new one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
