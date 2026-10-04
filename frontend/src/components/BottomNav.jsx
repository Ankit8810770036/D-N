import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Utensils, Dumbbell, TrendingUp, User } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { prefetchRoute } from '../utils/prefetch'

const navTabs = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/planner', label: 'Planner', icon: Utensils },
    { to: '/workouts', label: 'Workouts', icon: Dumbbell },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
    { to: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
    const queryClient = useQueryClient()
    const { user } = useAuth()

    const handlePrefetch = (to) => {
        prefetchRoute(to, queryClient, user)
    }

    return (
        <nav 
            aria-label="Mobile Bottom Navigation"
            className="lg:hidden fixed bottom-0 left-0 right-0 w-full z-30 bg-white/95 dark:bg-[#081c15]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-white/10 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 select-none transform-gpu translate-z-0 box-border"
        >
            <div className="grid grid-cols-5 items-center px-1 max-w-md mx-auto w-full">
                {navTabs.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onMouseEnter={() => handlePrefetch(to)}
                        onTouchStart={() => handlePrefetch(to)}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center py-1 px-1 rounded-xl relative transition-colors duration-150 ${
                                isActive
                                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                    : 'text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 font-medium'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`w-8 h-7 flex items-center justify-center rounded-lg transition-all duration-150 ${
                                    isActive 
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                                        : 'text-slate-400 dark:text-gray-400'
                                }`}>
                                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                                </div>
                                <span className={`text-[10px] tracking-tight mt-0.5 leading-tight font-semibold transition-colors duration-150`}>
                                    {label}
                                </span>
                                {isActive && (
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 absolute top-0.5 animate-in fade-in zoom-in duration-150" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
