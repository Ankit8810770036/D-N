import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const foodPrefs = ['veg', 'non-veg', 'vegan', 'jain']
const goals = ['lose', 'maintain', 'gain']

export default function Register() {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [form, setForm] = useState({
        name: '', email: '', password: '', password_confirmation: '',
        role: 'user', food_preference: 'veg', goal: 'maintain',
    })

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

    const handleNextStep = () => {
        if (!form.name || !form.email || !form.password || !form.password_confirmation) {
            return toast.error("Please fill in all fields before continuing.")
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            return toast.error("Please enter a valid email address.")
        }
        if (form.password.length < 8) {
            return toast.error("Password must be at least 8 characters.")
        }
        if (form.password !== form.password_confirmation) {
            return toast.error("Your passwords do not match!")
        }
        setStep(2)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (step === 1) return handleNextStep()
        setLoading(true)
        try {
            await register(form)
            toast.success('Registration successful!')
            navigate('/dashboard')
        } catch (err) {
            const serverErrors = err.response?.data?.errors
            if (serverErrors) {
                const firstError = Object.values(serverErrors).flat()[0]
                toast.error(firstError || 'Validation failed. Please check your inputs.')
            } else {
                toast.error(err.response?.data?.message || 'Registration failed. Please check your inputs.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center font-outfit bg-cover bg-center bg-[#081c15] overflow-x-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1498837167922-41c3735b2385?auto=format&fit=crop&q=80')" }}>
            {/* Background Glow Orbs - Fixed to prevent scrollbar stretching */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] left-[10%] w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[10%] w-[800px] h-[800px] bg-green-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Immersive Dark Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0"></div>

            {/* Flex Container to align Text and Card side-by-side */}
            <div className="relative z-10 w-full max-w-[90rem] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-20">
                
                {/* Left Aligned Cinematic Text (Hidden on Mobile) */}
                <div className="hidden lg:flex flex-col text-white animate-fade-in max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md mb-6 border border-white/20 w-max">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Curated Recipes</span>
                        <span className="text-green-400">🥗</span>
                    </div>
                    <h1 className="text-6xl xl:text-[5.5rem] font-black leading-[1.05] tracking-tight mb-6">
                        Your health journey, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">beautifully planned.</span>
                    </h1>
                    <p className="text-lg text-white/60 font-medium max-w-lg mb-10 leading-relaxed">
                        Join our exclusive platform to get AI-powered meal prep, customized trajectories, and real-time nutritional analytics.
                    </p>
                    <div className="flex gap-6">
                        <div className="flex -space-x-4">
                            {[1,2,3].map(i => (
                                <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" className="w-12 h-12 rounded-full border-2 border-green-900 object-cover" />
                            ))}
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="font-bold text-white">Join 10,000+ members</span>
                            <span className="text-xs text-green-400 font-medium">taking control of their health today.</span>
                        </div>
                    </div>
                </div>

                {/* Right Aligned Glass Card */}
                <div className="w-full max-w-md animate-fade-in-up">
                    <div className="bg-transparent backdrop-blur-sm border border-white/20 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        
                        {/* Decorative Top Gradient Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>

                        {/* Brand Header */}
                        <div className="text-center mb-8 relative z-10">
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tightest">Create Account</h1>
                            <p className="text-gray-400 font-medium font-outfit uppercase tracking-widest text-[9px]">Step {step} of 2: {step === 1 ? 'Personal Identity' : 'Physiology Prefs'}</p>
                        </div>

                        <div className="flex gap-2 mb-6 relative z-10">
                            {[1, 2].map(s => (
                                <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-white/10'}`} />
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            {step === 1 && (
                                <div className="space-y-4 animate-slide-up">
                                    <div>
                                        <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-1 ml-1">Full Identity</label>
                                        <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                                            className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-xl px-5 py-3.5 text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] focus:bg-black/60 transition-all font-outfit text-sm shadow-inner" placeholder="John Doe" required />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-1 ml-1">Email Authority</label>
                                        <div className="relative overflow-hidden rounded-xl">
                                            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                                                className={`w-full bg-black/40 backdrop-blur-md border ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'border-green-500/50' : 'border-white/20'} rounded-xl px-5 py-3.5 text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] focus:bg-black/60 transition-all font-outfit text-sm shadow-inner pr-10`} placeholder="you@example.com" required />
                                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                                                <svg className="w-4 h-4 text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-1 ml-1">Password</label>
                                            <div className="relative overflow-hidden rounded-xl">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={form.password}
                                                    onChange={e => set('password', e.target.value)}
                                                    className={`w-full bg-black/40 backdrop-blur-md border ${form.password.length >= 6 && form.password === form.password_confirmation ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-white/20'} rounded-xl px-5 py-3.5 text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] focus:bg-black/60 transition-all font-outfit text-sm shadow-inner pr-10`}
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors focus:outline-none p-1"
                                                    title={showPassword ? "Hide password" : "Show password"}
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-1 ml-1">Confirm</label>
                                            <div className="relative overflow-hidden rounded-xl">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={form.password_confirmation}
                                                    onChange={e => set('password_confirmation', e.target.value)}
                                                    className={`w-full bg-black/40 backdrop-blur-md border ${form.password.length >= 6 && form.password === form.password_confirmation ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-white/20'} rounded-xl px-5 py-3.5 text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] focus:bg-black/60 transition-all font-outfit text-sm shadow-inner pr-14`}
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                                    {form.password.length >= 6 && form.password === form.password_confirmation && (
                                                        <svg className="w-4 h-4 text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-in fade-in zoom-in-75 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="text-white/50 hover:text-white transition-colors focus:outline-none p-1"
                                                        title={showConfirmPassword ? "Hide password" : "Show password"}
                                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showConfirmPassword ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" onClick={handleNextStep} className="w-full py-3 mt-2 bg-white/90 text-[#081c15] font-black rounded-xl hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] h-12 shadow-xl">
                                        Continue →
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 animate-slide-up">
                                    <div>
                                        <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-2 ml-1">Your Role</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[['user', '🙋 User'], ['admin', '🛡️ Admin']].map(([r, label]) => (
                                                <button type="button" key={r} onClick={() => set('role', r)}
                                                    className={`py-2.5 px-4 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all
                                                    ${form.role === r ? 'border-green-500 bg-green-500/20 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-white/20 bg-black/40 backdrop-blur-md text-white/60 hover:border-white/30 hover:bg-black/50 hover:text-white/90 shadow-inner'}`}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-2 ml-1">Nutrition Style</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {foodPrefs.map(p => (
                                                <button type="button" key={p} onClick={() => set('food_preference', p)}
                                                    className={`py-2 px-3 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all
                                                    ${form.food_preference === p ? 'border-green-500 bg-green-500/20 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-white/20 bg-black/40 backdrop-blur-md text-white/60 hover:border-white/30 hover:bg-black/50 hover:text-white/90 shadow-inner'}`}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-white uppercase tracking-widest mb-2 ml-1">Trajectory</label>
                                        <div className="flex gap-2">
                                            {goals.map(g => (
                                                <button type="button" key={g} onClick={() => set('goal', g)}
                                                    className={`flex-1 py-2 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all
                                                    ${form.goal === g ? 'border-green-500 bg-green-500/20 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-white/20 bg-black/40 backdrop-blur-md text-white/60 hover:border-white/30 hover:bg-black/50 hover:text-white/90 shadow-inner'}`}>
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <button type="button" onClick={() => setStep(1)} className="px-5 py-3 bg-black/60 backdrop-blur-md border border-white/20 text-white font-black rounded-xl hover:bg-black/80 transition-all uppercase tracking-widest text-[9px] h-12 shadow-inner">Back</button>
                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-700 text-white font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-green-900/40 uppercase tracking-widest text-[10px] flex justify-center items-center h-12">
                                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Initialize Journey 🎉'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>

                        <p className="text-center text-xs text-gray-400 mt-6 font-medium font-outfit relative z-10">
                            Already have access?{' '}
                            <Link to="/login" className="text-green-400 font-bold hover:text-green-300 transition-colors">SignIn Portal</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
