import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Menu } from 'lucide-react'
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
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 lg:hidden transition-colors flex-shrink-0"
                    title="Open Menu"
                >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                
                <h1 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                    Good {getGreeting()}, <span className="text-[#2d6a4f] dark:text-green-400">{user?.name?.split(' ')[0]}</span> 👋
                </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors text-sm sm:text-base"
                    title="Toggle Theme"
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>
                {user?.plan_type === 'premium' ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full shadow-sm">
                        👑 <span className="hidden xs:inline">PREMIUM</span>
                    </span>
                ) : (
                    <button
                        onClick={() => navigate('/subscription')}
                        className="text-[9px] sm:text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    >
                        ⚡ <span className="hidden xs:inline">GO </span>PRO
                    </button>
                )}
                <span className="badge badge-green text-[9px] sm:text-xs capitalize hidden sm:inline-flex">{user?.role}</span>
                <button
                    onClick={handleLogout}
                    className="btn-secondary btn-sm text-[10px] sm:text-xs py-1 px-2 sm:py-1.5 sm:px-4"
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
