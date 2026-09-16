import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/errors'
import AuthNavbar from '../components/AuthNavbar'

export default function ForgotPassword() {
    const [email, setEmail]     = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent]       = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post('/forgot-password', { email })
            setSent(true)
            toast.success('Reset link sent! Check your inbox.')
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to send reset link. Please check your email and try again.'))
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
                                🔑
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Forgot Password</h1>
                        </div>
                        <p className="text-slate-500 dark:text-gray-400 text-xs sm:text-sm font-semibold">
                            Enter your email and we'll send you a recovery link
                        </p>
                    </div>

                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-green-500/20 border border-emerald-200 dark:border-green-500/40 flex items-center justify-center mx-auto text-3xl">
                                📬
                            </div>
                            <p className="text-slate-900 dark:text-white font-bold text-lg">Check your inbox!</p>
                            <p className="text-slate-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                                We've sent a password reset link to <span className="text-emerald-600 dark:text-green-400 font-bold">{email}</span>.
                                The link expires in 60 minutes.
                            </p>
                            <button
                                onClick={() => { setSent(false); setEmail('') }}
                                className="text-emerald-600 dark:text-green-400 text-xs sm:text-sm font-bold hover:text-emerald-700 dark:hover:text-green-300 transition-colors"
                            >
                                Resend to a different email →
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-2 ml-1">
                                    Email Address
                                </label>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-white/95 dark:bg-black/40 backdrop-blur-md border border-slate-300 dark:border-white/20 rounded-2xl px-5 py-3.5 sm:py-4 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-emerald-500 dark:focus:border-green-400 focus:ring-4 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-black/60 transition-all duration-300 shadow-sm dark:shadow-inner"
                                    placeholder="you@example.com"
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                id="send-reset-btn"
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 sm:py-4 mt-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-2xl hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-emerald-700/25 uppercase tracking-wider text-xs sm:text-sm flex justify-center items-center h-12 sm:h-14 disabled:opacity-60"
                            >
                                {loading
                                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : 'Send Reset Link →'
                                }
                            </button>
                        </form>
                    )}

                    <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-6 font-medium">
                        Remembered your password?{' '}
                        <Link to="/login" className="text-emerald-600 dark:text-green-400 font-bold hover:text-emerald-700 dark:hover:text-green-300 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
