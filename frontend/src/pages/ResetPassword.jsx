import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

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
            toast.success(data.message)
            navigate('/login')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed. Please request a new link.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center font-outfit bg-cover bg-center bg-[#081c15] overflow-x-hidden"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1498837167922-41c3735b2385?auto=format&fit=crop&q=80')" }}>

            {/* Background Glow Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-green-400/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />

            <div className="relative z-10 w-full max-w-md mx-auto px-6">
                <div className="bg-transparent backdrop-blur-sm border border-white/20 rounded-[2rem] p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.3)]">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-xl shadow-xl">
                                🛡️
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Reset Password</h1>
                        </div>
                        <p className="text-gray-400 text-sm font-medium">
                            Enter your new password below
                        </p>
                        {form.email && (
                            <p className="text-green-400 text-xs font-semibold mt-1">{form.email}</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* New Password */}
                        <div>
                            <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-1 ml-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="new-password"
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    className={`w-full bg-black/40 backdrop-blur-md border ${
                                        form.password ? (isStrong ? 'border-green-500/50' : 'border-red-500/50') : 'border-white/20'
                                    } rounded-xl px-6 py-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all duration-300 pr-12`}
                                    placeholder="At least 8 characters"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-1 focus:outline-none"
                                    title={showPass ? "Hide password" : "Show password"}
                                    aria-label={showPass ? "Hide password" : "Show password"}
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* Strength bar */}
                            {form.password && (
                                <div className="mt-2 flex gap-1">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                            form.password.length > i * 2 + 2
                                                ? i < 2 ? 'bg-red-400' : i < 3 ? 'bg-yellow-400' : 'bg-green-400'
                                                : 'bg-white/10'
                                        }`} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-1 ml-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm-password"
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password_confirmation}
                                    onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                                    className={`w-full bg-black/40 backdrop-blur-md border ${
                                        form.password_confirmation
                                            ? (passwordsMatch ? 'border-green-500/50' : 'border-red-500/50')
                                            : 'border-white/20'
                                    } rounded-xl px-6 py-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all duration-300 pr-12`}
                                    placeholder="Re-enter your password"
                                    required
                                />
                                {/* Match indicator */}
                                {form.password_confirmation && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {passwordsMatch
                                            ? <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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
                            className="w-full py-3.5 mt-2 bg-gradient-to-r from-green-500 to-emerald-700 text-white font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-green-900/40 uppercase tracking-widest text-[10px] flex justify-center items-center h-12 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : 'Set New Password →'
                            }
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-8 font-medium">
                        Link expired?{' '}
                        <Link to="/forgot-password" className="text-green-400 font-bold hover:text-green-300 transition-colors">
                            Request a new one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
