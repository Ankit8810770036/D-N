import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Menu, Crown, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar({ onMenuClick }) {
    const { user, logout } = useAuth()
    const { isDarkMode, toggleTheme } = useTheme()
    const navigate = useNavigate()

    async function handleLogout() {
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
                    Good {getGreeting()}, <span className="text-[#2d6a4f] dark:text-green-400">{user?.name?.split(' ')[0]}</span> 👋
                </h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                <button 
                    onClick={toggleTheme}
                    className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors text-sm sm:text-base border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                    title="Toggle Theme"
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>

                {user?.plan_type === 'premium' ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] sm:text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 uppercase tracking-widest border border-amber-300/50">
                        <Crown className="w-3.5 h-3.5" /> 
                        <span className="hidden xs:inline drop-shadow-md">PREMIUM</span>
                    </span>
                ) : (
                    <button
                        onClick={() => navigate('/subscription')}
                        className="group flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-[10px] sm:text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 uppercase tracking-widest border border-amber-300/50 transition-all hover:scale-105 active:scale-95"
                    >
                        <Zap className="w-3.5 h-3.5 fill-white" /> 
                        <span className="hidden xs:inline drop-shadow-md">GO PRO</span>
                    </button>
                )}
                
                <span className="badge badge-green text-[10px] sm:text-xs capitalize font-bold hidden sm:inline-flex px-3 py-1.5">{user?.role}</span>
                
                <button
                    onClick={handleLogout}
                    className="btn-secondary text-[11px] sm:text-xs py-1.5 px-3 sm:py-1.5 sm:px-4 ml-1"
                >
                    Logout
                </button>
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
