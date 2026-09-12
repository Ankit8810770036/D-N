import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Menu, Crown, Shield, UserCircle, User, LogOut, ChevronDown, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

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
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-[76px] bg-white/80 dark:bg-[#081c15]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/10 z-20 flex items-center justify-between px-4 sm:px-6 transition-all duration-300">
            <div className="flex items-center gap-3 min-w-0">
                {/* Hamburger Menu Toggle */}
                <button 
                    onClick={onMenuClick}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 lg:hidden transition-all shadow-sm flex-shrink-0 hover:scale-105 active:scale-95"
                    title="Open Menu"
                >
                    <Menu className="w-5 h-5 sm:w-5 sm:h-5" />
                </button>
                
                <h1 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white truncate pl-1">
                    Good {getGreeting()}, <span className="text-[#2d6a4f] dark:text-green-400">{user?.name?.split(' ')[0] || 'Guest'}</span> 👋
                </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Theme Toggle */}
                <button 
                    onClick={toggleTheme}
                    className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors text-sm sm:text-base border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                    title="Toggle Theme"
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>

                {/* User Profile Menu / Button */}
                {user ? (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all shadow-sm group"
                            title="User Profile & Settings"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#40916c] to-[#2d6a4f] text-white flex items-center justify-center font-bold text-xs shadow">
                                {user.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
                            </div>
                            <div className="hidden sm:flex flex-col text-left">
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#2d6a4f] dark:group-hover:text-green-400 transition-colors">
                                    {user.name?.split(' ')[0]}
                                </span>
                                <span className="text-[10px] text-gray-400 capitalize -mt-0.5">
                                    {user.role}
                                </span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#0d2b1f] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-scaleIn font-outfit">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-[#2d6a4f] dark:text-green-400 capitalize">
                                            {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />}
                                            {user.role}
                                        </span>
                                        {user.plan_type === 'premium' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                <Sparkles className="w-3 h-3" /> PRO
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            navigate('/profile')
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left"
                                    >
                                        <User className="w-4 h-4 text-[#2d6a4f] dark:text-green-400" />
                                        <span>My Health Profile</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            navigate('/subscription')
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left"
                                    >
                                        <Crown className="w-4 h-4 text-amber-500" />
                                        <span>Subscription &amp; Plans</span>
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 dark:border-white/10 p-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left"
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
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold rounded-xl shadow transition-all hover:scale-105 active:scale-95"
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
