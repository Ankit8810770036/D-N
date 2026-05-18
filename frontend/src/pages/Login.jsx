import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)

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
            toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center font-outfit bg-cover bg-center bg-[#081c15] overflow-x-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1498837167922-41c3735b2385?auto=format&fit=crop&q=80')" }}>
            {/* Background Glow Orbs - Fixed to prevent scrollbar stretching */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[10%] w-[800px] h-[800px] bg-green-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Immersive Dark Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0"></div>

            {/* Flex Container to align Text and Card side-by-side */}
            <div className="relative z-10 w-full max-w-[90rem] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-20">
                
                {/* Left Aligned Cinematic Text (Hidden on Mobile) */}
                <div className="hidden lg:flex flex-col text-white animate-fade-in max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md mb-6 border border-white/20 w-max">
                        <span className="text-green-400">✨</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/90">AI Powered Nutrition</span>
                    </div>
                    <h2 className="text-6xl xl:text-[5.5rem] font-black mb-6 leading-[1.1] tracking-tight">Your health journey,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">beautifully planned.</span></h2>
                    <p className="text-lg xl:text-xl text-white/70 font-medium max-w-lg leading-relaxed">Join thousands of users who have transformed their lifestyle with precision nutrition and intelligent habit tracking.</p>
                </div>

                {/* Floating Glass Form */}
                <div className="w-full max-w-lg animate-slide-up">
                    <div className="bg-transparent backdrop-blur-sm border border-white/20 rounded-[2rem] p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-xl shadow-xl hover:scale-105 transition-transform duration-500">
                                    🥗
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tightest">Welcome Back</h1>
                            </div>
                            <p className="text-gray-400 font-medium font-outfit uppercase tracking-widest text-[9px]">Access your precision dashboard</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                            <div>
                                <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-1 ml-1">Email Address</label>
                                <div className="relative overflow-hidden rounded-xl">
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        className={`w-full bg-black/40 backdrop-blur-md border ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'border-green-500/50' : 'border-white/20'} rounded-xl px-6 py-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] focus:bg-black/60 transition-all duration-300 shadow-inner pr-12`}
                                        placeholder="you@example.com"
                                        required
                                    />
                                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                                        <svg className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-1 ml-1">Secure Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-xl px-6 py-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] focus:bg-black/60 transition-all duration-300 shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3.5 mt-4 bg-gradient-to-r from-green-500 to-emerald-700 text-white font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-green-900/40 uppercase tracking-widest text-[10px] flex justify-center items-center h-12">
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Access Dashboard →'}
                            </button>
                        </form>

                        <p className="text-center text-xs text-gray-400 mt-8 font-medium relative z-10">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-green-400 font-bold hover:text-green-300 transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
