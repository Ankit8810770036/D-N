import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { ArrowRight, Sparkles, Sun, Moon } from 'lucide-react'

export default function AuthNavbar() {
    const { isDarkMode, toggleTheme } = useTheme()
    const location = useLocation()
    const path = location.pathname

    return (
        <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 z-50 bg-white dark:bg-[#081c15] border-b border-slate-200/80 dark:border-white/10 px-3 sm:px-8 flex items-center justify-between transition-colors duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] flex items-center justify-center text-lg sm:text-xl shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                    🥑
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            NutriPlan
                        </span>
                        <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                            <Sparkles className="w-2.5 h-2.5" /> AI Health
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 font-medium hidden xs:block -mt-0.5">
                        Clinical Diet &amp; Nutrition Planner
                    </p>
                </div>
            </Link>

            {/* Right Controls */}
            <div className="flex items-center gap-2.5 sm:gap-4">
                {/* Dark/Light Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-200 transition-all border border-slate-200/80 dark:border-white/10 hover:scale-105 active:scale-95 shadow-xs flex items-center justify-center"
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    aria-label="Toggle Theme"
                >
                    {isDarkMode ? (
                        <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                    ) : (
                        <Moon className="w-4 h-4 text-slate-700" />
                    )}
                </button>

                {/* Dynamic Auth Action Button */}
                {path === '/login' && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-gray-400 font-medium hidden md:inline">
                            New to NutriPlan?
                        </span>
                        <Link
                            to="/register"
                            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <span>Sign Up</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                )}

                {path === '/register' && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-gray-400 font-medium hidden md:inline">
                            Already have an account?
                        </span>
                        <Link
                            to="/login"
                            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <span>Sign In</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                )}

                {(path === '/forgot-password' || path === '/reset-password') && (
                    <Link
                        to="/login"
                        className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs sm:text-sm font-bold rounded-xl border border-slate-200 dark:border-white/10 transition-all hover:scale-105 active:scale-95"
                    >
                        <span>Back to Sign In</span>
                    </Link>
                )}
            </div>
        </header>
    )
}
