import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Utensils, Dumbbell, TrendingUp, User } from 'lucide-react'

const navTabs = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/planner', label: 'Planner', icon: Utensils },
    { to: '/workouts', label: 'Workouts', icon: Dumbbell },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
    { to: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
    return (
        <nav 
            aria-label="Mobile Bottom Navigation"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#081c15]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 transition-all duration-300"
        >
            <div className="grid grid-cols-5 items-center px-1 max-w-md mx-auto">
                {navTabs.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 group relative ${
                                isActive
                                    ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-[1.02]'
                                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 font-medium'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 shadow-xs ring-1 ring-emerald-500/30 dark:ring-emerald-400/20' 
                                        : 'group-hover:bg-slate-100 dark:group-hover:bg-white/5'
                                }`}>
                                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`} />
                                </div>
                                <span className={`text-[10px] tracking-tight mt-0.5 leading-tight ${isActive ? 'font-black' : 'font-medium'}`}>
                                    {label}
                                </span>
                                {isActive && (
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 absolute -top-0.5 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
