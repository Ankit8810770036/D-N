import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/errors'
import AuthNavbar from '../components/AuthNavbar'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()

        if (!form.email || !form.password) {
            return toast.error("Please fill in both email and password.");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            return toast.error("Please enter a valid email address.");
        }

        setLoading(true)
        try {
            await login(form.email, form.password)
            toast.success('Welcome back! 🎉')
            navigate('/dashboard')
        } catch (err) {
            toast.error(getErrorMessage(err, 'Login failed. Please check your email and password.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[100dvh] lg:h-[100dvh] w-full relative flex flex-col items-center justify-center font-outfit bg-cover bg-center bg-slate-50 dark:bg-[#081c15] overflow-y-auto lg:overflow-hidden pt-18 sm:pt-20 pb-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1498837167922-41c3735b2385?auto=format&fit=crop&q=80')" }}>
            {/* Top Auth Navbar */}
            <AuthNavbar />

            {/* Background Glow Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] right-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-emerald-400/25 dark:bg-emerald-500/20 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] sm:right-[10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-teal-400/20 dark:bg-green-400/20 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Immersive Overlay */}
            <div className="absolute inset-0 bg-white/75 dark:bg-black/50 backdrop-blur-[3px] dark:backdrop-blur-[2px] z-0 transition-colors duration-300"></div>

            {/* Flex Container to align Text and Card side-by-side */}
            <div className="relative z-10 w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-14 my-auto py-2 sm:py-4 lg:py-0">
                
                {/* Left Aligned Cinematic Text (Hidden on Mobile/Tablets) */}
                <div className="hidden lg:flex flex-col text-slate-900 dark:text-white animate-fade-in max-w-xl xl:max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md mb-5 border border-slate-200/80 dark:border-white/20 shadow-sm w-max">
                        <span className="text-emerald-500 dark:text-green-400 text-base">✨</span>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white/90">AI Powered Nutrition</span>
                    </div>
                    <h2 className="text-5xl xl:text-6xl 2xl:text-7xl font-black mb-5 leading-[1.1] tracking-tight">Your health journey,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-green-400 dark:to-emerald-500">beautifully planned.</span></h2>
                    <p className="text-base xl:text-lg text-slate-600 dark:text-white/70 font-medium max-w-lg leading-relaxed">Join thousands of users who have transformed their lifestyle with precision nutrition and intelligent habit tracking.</p>
                </div>

                {/* Floating Glass Form */}
                <div className="w-full max-w-[480px] lg:max-w-[500px] animate-slide-up">
                    <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-2xl border border-slate-200/90 dark:border-white/15 rounded-3xl sm:rounded-[2rem] p-6 sm:p-9 shadow-2xl shadow-slate-200/70 dark:shadow-[0_0_60px_rgba(0,0,0,0.5)] relative overflow-hidden transition-colors duration-300">
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-white/10 border border-emerald-200/80 dark:border-white/20 text-2xl shadow-sm">
                                    🥗
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h1>
                            </div>
                            <p className="text-slate-500 dark:text-gray-400 font-semibold font-outfit text-xs sm:text-sm">Access your personalized health dashboard</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                                <div className="relative overflow-hidden rounded-2xl">
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        className={`w-full bg-white/95 dark:bg-black/40 backdrop-blur-md border ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'border-emerald-500 dark:border-green-500/50 ring-2 ring-emerald-500/20' : 'border-slate-300 dark:border-white/20'} rounded-2xl px-5 py-3.5 sm:py-4 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-emerald-500 dark:focus:border-green-400 focus:ring-4 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-black/60 transition-all duration-300 shadow-sm dark:shadow-inner pr-12`}
                                        placeholder="you@example.com"
                                        required
                                    />
                                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                                        <svg className="w-5 h-5 text-emerald-600 dark:text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2 ml-1">
                                    <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider">Password</label>
                                    <Link to="/forgot-password" className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-green-400 hover:text-emerald-700 dark:hover:text-green-300 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative overflow-hidden rounded-2xl">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        className="w-full bg-white/95 dark:bg-black/40 backdrop-blur-md border border-slate-300 dark:border-white/20 rounded-2xl px-5 py-3.5 sm:py-4 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-emerald-500 dark:focus:border-green-400 focus:ring-4 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-black/60 transition-all duration-300 shadow-sm dark:shadow-inner pr-12"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-white/50 dark:hover:text-white transition-colors focus:outline-none p-1"
                                        title={showPassword ? "Hide password" : "Show password"}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3.5 sm:py-4 mt-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-2xl hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-emerald-700/25 uppercase tracking-wider text-xs sm:text-sm flex justify-center items-center h-12 sm:h-14">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Access Dashboard →'}
                            </button>
                        </form>

                        <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-6 font-medium relative z-10">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-emerald-600 dark:text-green-400 font-bold hover:text-emerald-700 dark:hover:text-green-300 transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
