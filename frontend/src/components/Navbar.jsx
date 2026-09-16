import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Menu, Crown, Shield, UserCircle, User, LogOut, ChevronDown, Sparkles, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import FeedbackModal from './FeedbackModal'
import UserAvatar from './UserAvatar'

export default function Navbar({ onMenuClick }) {
    const { user, logout } = useAuth()
    const { isDarkMode, toggleTheme } = useTheme()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    async function handleLogout() {
        setDropdownOpen(false)
        await logout()
        toast.success('Logged out successfully')
        navigate('/login')
    }

    return (
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-[76px] bg-white dark:bg-[#081c15] border-b border-slate-200/80 dark:border-white/10 z-20 flex items-center justify-between px-4 sm:px-6 transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 min-w-0">
                {/* Hamburger Menu Toggle */}
                <button 
                    onClick={onMenuClick}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:hover:bg-white/10 text-slate-700 dark:text-gray-200 lg:hidden transition-all shadow-sm flex-shrink-0 hover:scale-105 active:scale-95"
                    title="Open Menu"
                >
                    <Menu className="w-5 h-5 sm:w-5 sm:h-5" />
                </button>
                
                <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate pl-1">
                    Good {getGreeting()}, <span className="text-emerald-600 dark:text-green-400 font-extrabold">{user?.name?.split(' ')[0] || 'Guest'}</span> 👋
                </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Theme Toggle */}
                <button 
                    onClick={toggleTheme}
                    className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 transition-colors text-sm sm:text-base border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                    title="Toggle Theme"
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>

                {/* User Profile Menu / Button */}
                {user ? (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all shadow-sm group"
                            title="User Profile & Settings"
                        >
                            <UserAvatar user={user} size="sm" />
                            <div className="hidden sm:flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-800 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-green-400 transition-colors">
                                    {user.name?.split(' ')[0]}
                                </span>
                                <span className="text-[10px] text-slate-400 capitalize -mt-0.5">
                                    {user.role}
                                </span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0d2b1f] border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-900/10 py-2 z-50 animate-scaleIn font-outfit">
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
                                    <UserAvatar user={user} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{user.email}</p>
                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-green-900/30 text-emerald-800 dark:text-green-400 capitalize border border-emerald-100 dark:border-transparent">
                                                {user.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <UserCircle className="w-2.5 h-2.5" />}
                                                {user.role}
                                            </span>
                                            {user.plan_type === 'premium' && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200/80">
                                                    <Sparkles className="w-2.5 h-2.5" /> PRO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-1 space-y-0.5">
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            navigate('/profile')
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-emerald-50/70 hover:text-emerald-900 dark:hover:bg-white/5 rounded-xl transition-colors text-left"
                                    >
                                        <User className="w-4 h-4 text-emerald-600 dark:text-green-400" />
                                        <span>My Health Profile</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            navigate('/subscription')
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-emerald-50/70 hover:text-emerald-900 dark:hover:bg-white/5 rounded-xl transition-colors text-left"
                                    >
                                        <Crown className="w-4 h-4 text-amber-500" />
                                        <span>Subscription &amp; Plans</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            navigate('/feedback')
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-emerald-50/70 hover:text-emerald-900 dark:hover:bg-white/5 rounded-xl transition-colors text-left"
                                    >
                                        <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        <span>Give Feedback (+10 🪙)</span>
                                    </button>
                                </div>

                                <div className="border-t border-slate-100 dark:border-white/10 p-1 mt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-red-400 hover:bg-rose-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Sign Out / Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <UserCircle className="w-4 h-4" />
                        <span>Sign In</span>
                    </button>
                )}
            </div>
        </header>
    )
}

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Morning'
    if (h < 17) return 'Afternoon'
    return 'Evening'
}
