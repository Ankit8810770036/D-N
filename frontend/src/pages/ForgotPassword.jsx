import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

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
            toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
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
                                🔑
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Forgot Password</h1>
                        </div>
                        <p className="text-gray-400 text-sm font-medium">
                            Enter your email and we'll send you a reset link
                        </p>
                    </div>

                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto text-3xl">
                                📬
                            </div>
                            <p className="text-white font-bold text-lg">Check your inbox!</p>
                            <p className="text-gray-400 text-sm">
                                We've sent a password reset link to <span className="text-green-400 font-semibold">{email}</span>.
                                The link expires in 60 minutes.
                            </p>
                            <button
                                onClick={() => { setSent(false); setEmail('') }}
                                className="text-green-400 text-sm font-bold hover:text-green-300 transition-colors"
                            >
                                Resend to a different email →
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-1 ml-1">
                                    Email Address
                                </label>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-xl px-6 py-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] focus:bg-black/60 transition-all duration-300"
                                    placeholder="you@example.com"
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                id="send-reset-btn"
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 mt-2 bg-gradient-to-r from-green-500 to-emerald-700 text-white font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-green-900/40 uppercase tracking-widest text-[10px] flex justify-center items-center h-12 disabled:opacity-60"
                            >
                                {loading
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : 'Send Reset Link →'
                                }
                            </button>
                        </form>
                    )}

                    <p className="text-center text-xs text-gray-400 mt-8 font-medium">
                        Remembered your password?{' '}
                        <Link to="/login" className="text-green-400 font-bold hover:text-green-300 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
