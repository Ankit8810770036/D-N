import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TokenWalletSidebar } from './TokenWallet'
import { X } from 'lucide-react'

const navItems = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/profile', icon: '👤', label: 'My Profile' },
    { to: '/planner', icon: '🍽️', label: 'Diet Planner' },
    { to: '/shopping-list', icon: '🛒', label: 'Shopping List' },
    { to: '/cookbook', icon: '📖', label: 'Cookbook' },
    { to: '/progress', icon: '📈', label: 'Progress' },
    { to: '/reports', icon: '📄', label: 'Reports' },
    { to: '/subscription', icon: '💎', label: 'Subscription' },
    { to: '/admin', icon: '🛡️', label: 'Admin Panel', adminOnly: true },
]

export default function Sidebar({ isOpen, onClose }) {
    const { user, isAdmin } = useAuth()

    const handleLinkClick = () => {
        if (onClose) onClose()
    }

    return (
        <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#081c15] border-r border-gray-100 dark:border-white/10 shadow-sm z-40 flex flex-col transition-all duration-300 ease-in-out transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Logo */}
            <div className="h-[76px] px-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2d6a4f] to-[#40916c] flex items-center justify-center text-white text-lg font-bold shadow">
                        🥗
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">Diet Planner</p>
                        <p className="text-xs text-gray-400">Health & Nutrition</p>
                    </div>
                </div>
                {/* Mobile Close Button */}
                <button 
                    onClick={onClose} 
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 lg:hidden transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.filter(item => {
                    if (item.adminOnly && !isAdmin) return false;
                    if (item.to === '/subscription' && isAdmin) return false;
                    return true;
                }).map(({ to, icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={handleLinkClick}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="text-lg">{icon}</span>
                        <span className="text-sm">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* HealthCoin Wallet */}
            <div className="px-3 pb-2">
                <TokenWalletSidebar />
            </div>

            {/* User info — clickable → goes to profile */}
            <NavLink
                to="/profile"
                onClick={handleLinkClick}
                className="px-4 py-4 border-t border-gray-100 dark:border-white/10 flex items-center gap-3 hover:bg-green-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
            >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#40916c] to-[#2d6a4f] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 group-hover:ring-2 group-hover:ring-[#40916c]/50 transition-all">
                    {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate group-hover:text-[#2d6a4f] dark:group-hover:text-green-400 transition-colors">{user?.name}</p>
                        {user?.plan_type === 'premium' && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold border border-amber-200">PRO</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>
                <span className="text-gray-300 dark:text-white/20 group-hover:text-[#40916c] dark:group-hover:text-green-400 transition-colors text-xs">→</span>
            </NavLink>
        </aside>
    )
}
