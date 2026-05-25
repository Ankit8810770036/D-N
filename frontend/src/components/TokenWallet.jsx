import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Coins } from 'lucide-react'

// Fetch token data — reuses the /tokens endpoint
function useTokens() {
    return useQuery({
        queryKey: ['tokens'],
        queryFn: () => api.get('/tokens').then(r => r.data),
        staleTime: 1000 * 30,
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

    return (
        <button
            onClick={() => navigate('/subscription')}
            className="w-full text-left px-3 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-700/40 hover:shadow-md transition-all group"
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

// ── Dashboard daily-challenges card ──────────────────────────────────────────
export function DailyChallengesCard() {
    const { data, isLoading } = useTokens()
    const balance   = data?.balance ?? 0
    const challenges = data?.challenges ?? []
    const earned = challenges.filter(c => c.done).reduce((s, c) => s + c.coins, 0)
    const total  = challenges.reduce((s, c) => s + c.coins, 0)

    if (isLoading) return null

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
                        🪙 Daily Challenges
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Reset at midnight IST</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{balance.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Coins</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
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
            <div className="space-y-2">
                {challenges.map(ch => (
                    <div
                        key={ch.reason}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                            ch.done
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent'
                        }`}
                    >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            ch.done
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                        }`}>
                            {ch.done ? '✓' : '○'}
                        </span>
                        <span className={`text-sm flex-1 ${ch.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            {ch.label}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            ch.done
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                            +{ch.coins} 🪙
                        </span>
                    </div>
                ))}
            </div>

            {/* Milestone hint */}
            <div className="mt-4 p-3 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/30 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                <span className="font-bold">🏆 Milestones:</span> 7-day streak → +50 coins &nbsp;|&nbsp; 30-day streak → +200 coins
            </div>
        </div>
    )
}

export default function TokenWallet() {
    return null // Named exports are the primary API
}
