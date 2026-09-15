import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Coins } from 'lucide-react'

// Fetch token data — reuses the /tokens endpoint with date isolation
function useTokens(date) {
    const d = new Date();
    const targetDate = date || new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    return useQuery({
        queryKey: ['tokens', targetDate],
        queryFn: () => api.get(`/tokens?date=${targetDate}`).then(r => r.data),
        staleTime: 5 * 60 * 1000, // 5 minutes fresh data
    })
}

export function useTokenBalance() {
    const { data } = useTokens()
    return data?.balance ?? 0
}

// ── Compact sidebar widget ────────────────────────────────────────────────────
export function TokenWalletSidebar() {
    const navigate  = useNavigate()
    const { data }  = useTokens()
    const balance   = data?.balance ?? 0
    const goal      = 500  // coins needed for free Premium

    const pct = Math.min((balance / goal) * 100, 100)

    const handleClick = () => {
        navigate('/dashboard#daily-challenges')
        setTimeout(() => {
            const el = document.getElementById('daily-challenges')
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.classList.add('ring-4', 'ring-amber-400', 'ring-offset-2', 'shadow-2xl')
                setTimeout(() => {
                    el.classList.remove('ring-4', 'ring-amber-400', 'ring-offset-2', 'shadow-2xl')
                }, 2000)
            }
        }, 150)
    }

    return (
        <button
            onClick={handleClick}
            className="w-full text-left px-3 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-700/40 hover:shadow-md transition-all group cursor-pointer"
            title="Click to view 🪙 Daily Challenges"
        >
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🪙</span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">HealthCoins</span>
                <span className="ml-auto text-sm font-black text-amber-700 dark:text-amber-300">{balance.toLocaleString()}</span>
            </div>
            {/* Progress bar toward free Premium */}
            <div className="h-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-[10px] text-amber-600/70 dark:text-amber-500 mt-1.5">
                {balance >= goal ? '🎉 Enough for free Premium!' : `${goal - balance} more for free month`}
            </p>
        </button>
    )
}

const CHALLENGE_ROUTES = {
    daily_login: { path: '/dashboard', label: 'Daily Login', tooltip: 'Claimed automatically when logging in' },
    progress_logged: { path: '/progress#log-form', label: 'Log Progress Today', tooltip: 'Click to log today’s health metrics' },
    workout_logged: { path: '/progress#log-form', label: 'Complete a Workout', tooltip: 'Click to log your workout session' },
    calorie_hit: { path: '/planner', label: 'Hit Calorie Target', tooltip: 'Click to plan and track your meals in Diet Planner' },
    meals_consumed: { path: '/planner', label: 'Eat All Planned Meals', tooltip: 'Click to check off planned meals in Diet Planner' },
}

// ── Dashboard daily-challenges card ──────────────────────────────────────────
export function DailyChallengesCard({ date }) {
    const navigate = useNavigate()
    const { data, isLoading } = useTokens(date)
    const balance   = data?.balance ?? 0
    const challenges = data?.challenges ?? []
    const earned = challenges.filter(c => c.done).reduce((s, c) => s + c.coins, 0)
    const total  = challenges.reduce((s, c) => s + c.coins, 0)

    if (isLoading) return null

    return (
        <div id="daily-challenges" className="card w-full min-w-0 transition-all duration-500 scroll-mt-24 font-outfit">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="font-bold text-slate-900 dark:text-white/90 flex items-center gap-2 text-lg">
                        🪙 Daily Challenges
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Click any task below to go directly and complete it</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{balance.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Coins</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-2.5 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                        style={{ width: `${total > 0 ? (earned / total) * 100 : 0}%` }}
                    />
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    {earned}/{total} 🪙
                </span>
            </div>

            {/* Challenge list */}
            <div className="space-y-2.5">
                {challenges.map(ch => {
                    const routeInfo = CHALLENGE_ROUTES[ch.reason] || { path: '/dashboard', label: ch.label, tooltip: 'Click to view section' }
                    
                    return (
                        <div
                            key={ch.reason}
                            onClick={() => {
                                if (routeInfo.path) {
                                    navigate(routeInfo.path)
                                    if (routeInfo.path.includes('#')) {
                                        const hash = routeInfo.path.split('#')[1]
                                        setTimeout(() => {
                                            const el = document.getElementById(hash)
                                            if (el) {
                                                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                el.classList.add('ring-4', 'ring-emerald-400', 'ring-offset-2', 'shadow-2xl')
                                                setTimeout(() => el.classList.remove('ring-4', 'ring-emerald-400', 'ring-offset-2', 'shadow-2xl'), 2000)
                                            }
                                        }, 150)
                                    }
                                }
                            }}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all cursor-pointer group ${
                                ch.done
                                    ? 'bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/40 opacity-90'
                                    : 'bg-white dark:bg-gray-800/80 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-green-500/50 hover:shadow-sm hover:scale-[1.01]'
                            }`}
                            title={routeInfo.tooltip}
                        >
                            <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-transform group-hover:scale-110 ${
                                ch.done
                                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                                    : 'bg-slate-100 dark:bg-gray-700 text-slate-400'
                            }`}>
                                {ch.done ? '✓' : '○'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <span className={`text-sm font-semibold flex items-center gap-1.5 ${
                                    ch.done 
                                        ? 'line-through text-slate-400 dark:text-gray-500' 
                                        : 'text-slate-800 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-green-400 transition-colors'
                                }`}>
                                    {ch.label}
                                    {!ch.done && (
                                        <span className="opacity-0 group-hover:opacity-100 text-xs text-emerald-600 dark:text-green-400 transition-all ml-1">
                                            →
                                        </span>
                                    )}
                                </span>
                                <p className="text-[11px] text-slate-400 truncate">
                                    {ch.done ? 'Completed today' : 'Click to complete this challenge'}
                                </p>
                            </div>
                            <span className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 transition-colors ${
                                ch.done
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/70 dark:border-amber-700/50 group-hover:bg-amber-100'
                            }`}>
                                +{ch.coins} 🪙
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Milestone hint */}
            <div className="mt-4 p-3 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30 rounded-2xl text-xs text-amber-800 dark:text-amber-400 font-medium">
                <span className="font-bold">🏆 Milestones:</span> 7-day streak → +50 coins &nbsp;|&nbsp; 30-day streak → +200 coins
            </div>
        </div>
    )
}

export default function TokenWallet() {
    return null // Named exports are the primary API
}
