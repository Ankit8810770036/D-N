import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/errors'
import AuthNavbar from '../components/AuthNavbar'

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
            toast.error(getErrorMessage(err, 'Registration failed. Please check your inputs.'))
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
                <div className="absolute top-[10%] left-[-10%] sm:left-[10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-emerald-400/25 dark:bg-emerald-500/20 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] sm:right-[10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-teal-400/20 dark:bg-green-400/20 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Immersive Overlay */}
            <div className="absolute inset-0 bg-white/75 dark:bg-black/50 backdrop-blur-[3px] dark:backdrop-blur-[2px] z-0 transition-colors duration-300"></div>

            {/* Flex Container to align Text and Card side-by-side */}
            <div className="relative z-10 w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-14 my-auto py-2 sm:py-4 lg:py-0">
                
                {/* Left Aligned Cinematic Text (Hidden on Mobile/Tablets) */}
                <div className="hidden lg:flex flex-col text-slate-900 dark:text-white animate-fade-in max-w-xl xl:max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md mb-4 border border-slate-200/80 dark:border-white/20 shadow-sm w-max">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white/90">Curated Recipes</span>
                        <span className="text-emerald-500 dark:text-green-400 text-base">🥗</span>
                    </div>
                    <h1 className="text-5xl xl:text-6xl 2xl:text-7xl font-black leading-[1.08] tracking-tight mb-4">
                        Your health journey, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-green-400 dark:to-emerald-500">beautifully planned.</span>
                    </h1>
                    <p className="text-base xl:text-lg text-slate-600 dark:text-white/70 font-medium max-w-lg mb-6 leading-relaxed">
                        Join our exclusive platform to get AI-powered meal prep, customized trajectories, and real-time nutritional analytics.
                    </p>
                    <div className="flex gap-4">
                        <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                                <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" className="w-12 h-12 rounded-full border-2 border-emerald-500 dark:border-green-900 object-cover shadow-sm" />
                            ))}
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="font-bold text-slate-900 dark:text-white text-base">Join 10,000+ members</span>
                            <span className="text-xs sm:text-sm text-emerald-600 dark:text-green-400 font-semibold">taking control of their health today.</span>
                        </div>
                    </div>
                </div>

                {/* Right Aligned Glass Card */}
                <div className="w-full max-w-[480px] lg:max-w-[510px] animate-fade-in-up">
                    <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-2xl border border-slate-200/90 dark:border-white/15 p-6 sm:p-9 rounded-3xl sm:rounded-[2rem] shadow-2xl shadow-slate-200/70 dark:shadow-[0_0_60px_rgba(0,0,0,0.5)] relative overflow-hidden transition-colors duration-300">
                        
                        {/* Decorative Top Gradient Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-green-400 dark:to-emerald-600"></div>

                        {/* Brand Header */}
                        <div className="text-center mb-5 relative z-10">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create Account</h1>
                            <p className="text-slate-500 dark:text-gray-400 font-semibold font-outfit text-xs sm:text-sm mt-0.5">Step {step} of 2: {step === 1 ? 'Personal Identity' : 'Physiology Prefs'}</p>
                        </div>

                        <div className="flex gap-2 mb-5 relative z-10">
                            {[1, 2].map(s => (
                                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-emerald-600 dark:bg-green-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-200 dark:bg-white/10'}`} />
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            {step === 1 && (
                                <div className="space-y-3.5 sm:space-y-4 animate-slide-up">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                                        <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                                            className="w-full bg-white/95 dark:bg-black/40 backdrop-blur-md border border-slate-300 dark:border-white/20 rounded-2xl px-5 py-3 sm:py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-emerald-500 dark:focus:border-green-400 focus:ring-4 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-black/60 transition-all font-outfit text-base shadow-sm dark:shadow-inner" placeholder="John Doe" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                                        <div className="relative overflow-hidden rounded-2xl">
                                            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                                                className={`w-full bg-white/95 dark:bg-black/40 backdrop-blur-md border ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'border-emerald-500 dark:border-green-500/50 ring-2 ring-emerald-500/20' : 'border-slate-300 dark:border-white/20'} rounded-2xl px-5 py-3 sm:py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-emerald-500 dark:focus:border-green-400 focus:ring-4 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-black/60 transition-all font-outfit text-base shadow-sm dark:shadow-inner pr-12`} placeholder="you@example.com" required />
                                            <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                                                <svg className="w-5 h-5 text-emerald-600 dark:text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                                            <div className="relative overflow-hidden rounded-2xl">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={form.password}
                                                    onChange={e => set('password', e.target.value)}
                                                    className={`w-full bg-white/95 dark:bg-black/40 backdrop-blur-md border ${form.password.length >= 8 && form.password === form.password_confirmation ? 'border-emerald-500 dark:border-green-500/50 ring-2 ring-emerald-500/20' : 'border-slate-300 dark:border-white/20'} rounded-2xl px-4 py-3 sm:py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-emerald-500 dark:focus:border-green-400 focus:ring-4 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-black/60 transition-all font-outfit text-base shadow-sm dark:shadow-inner pr-10`}
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-white/50 dark:hover:text-white transition-colors focus:outline-none p-1"
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
                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-1.5 ml-1">Confirm</label>
                                            <div className="relative overflow-hidden rounded-2xl">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={form.password_confirmation}
                                                    onChange={e => set('password_confirmation', e.target.value)}
                                                    className={`w-full bg-white/95 dark:bg-black/40 backdrop-blur-md border ${form.password.length >= 8 && form.password === form.password_confirmation ? 'border-emerald-500 dark:border-green-500/50 ring-2 ring-emerald-500/20' : 'border-slate-300 dark:border-white/20'} rounded-2xl px-4 py-3 sm:py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-emerald-500 dark:focus:border-green-400 focus:ring-4 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-black/60 transition-all font-outfit text-base shadow-sm dark:shadow-inner pr-11`}
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                                    {form.password.length >= 8 && form.password === form.password_confirmation && (
                                                        <svg className="w-4 h-4 text-emerald-600 dark:text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-in fade-in zoom-in-75 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="text-slate-400 hover:text-slate-700 dark:text-white/50 dark:hover:text-white transition-colors focus:outline-none p-1"
                                                        title={showConfirmPassword ? "Hide password" : "Show password"}
                                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showConfirmPassword ? (
                                                            <EyeOff className="w-5 h-5" />
                                                        ) : (
                                                            <Eye className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" onClick={handleNextStep} className="w-full py-3.5 sm:py-4 mt-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white/90 dark:text-[#081c15] font-black rounded-2xl hover:scale-[1.01] active:scale-[0.98] transition-all uppercase tracking-wider text-xs sm:text-sm h-12 sm:h-14 shadow-xl">
                                        Continue →
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 animate-slide-up">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-2 ml-1">Account Role</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[['user', '🙋 User'], ['admin', '🛡️ Admin']].map(([r, label]) => (
                                                <button type="button" key={r} onClick={() => set('role', r)}
                                                    className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all
                                                    ${form.role === r ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-green-500/20 dark:text-green-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-black/40 backdrop-blur-md text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/30 hover:text-slate-900 dark:hover:text-white/90 shadow-xs dark:shadow-inner'}`}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-2 ml-1">Dietary Preference</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {foodPrefs.map(p => (
                                                <button type="button" key={p} onClick={() => set('food_preference', p)}
                                                    className={`py-2.5 sm:py-3 px-3.5 rounded-xl border-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all
                                                    ${form.food_preference === p ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-green-500/20 dark:text-green-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-black/40 backdrop-blur-md text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/30 hover:text-slate-900 dark:hover:text-white/90 shadow-xs dark:shadow-inner'}`}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-wider mb-2 ml-1">Your Primary Goal</label>
                                        <div className="flex gap-2.5">
                                            {goals.map(g => (
                                                <button type="button" key={g} onClick={() => set('goal', g)}
                                                    className={`flex-1 py-2.5 sm:py-3 rounded-xl border-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all
                                                    ${form.goal === g ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-green-500/20 dark:text-green-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-black/40 backdrop-blur-md text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/30 hover:text-slate-900 dark:hover:text-white/90 shadow-xs dark:shadow-inner'}`}>
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-black/60 backdrop-blur-md border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white font-bold rounded-2xl transition-all uppercase tracking-wider text-xs sm:text-sm h-12 sm:h-14 shadow-xs dark:shadow-inner">Back</button>
                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-2xl hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-emerald-700/25 uppercase tracking-wider text-xs sm:text-sm flex justify-center items-center h-12 sm:h-14">
                                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account 🎉'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>

                        <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-5 font-medium font-outfit relative z-10">
                            Already have an account?{' '}
                            <Link to="/login" className="text-emerald-600 dark:text-green-400 font-bold hover:text-emerald-700 dark:hover:text-green-300 transition-colors">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
