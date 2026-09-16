import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

export default function CelebrationOverlay({ newBadges = [], onComplete }) {
    const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0)
    const isShowing = newBadges.length > 0 && currentBadgeIndex < newBadges.length

    useBodyScrollLock(isShowing)

    useEffect(() => {
        if (newBadges.length > 0) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#2d6a4f', '#40916c', '#f4a261', '#e76f51']
            })
        }
    }, [currentBadgeIndex, newBadges.length])

    if (!isShowing) return null

    const badge = newBadges[currentBadgeIndex]

    // Config same as BadgeSection for simplicity, could be shared
    const BADGE_CONFIG = {
        streak_7: { label: '7-Day Streak', icon: '🔥', text: 'You are on fire! 7 days of consistency.' },
        starter: { label: 'Fresh Start', icon: '🌱', text: 'Welcome to the journey! First log complete.' },
        culinary_explorer: { label: 'Culinary Explorer', icon: '👨‍🍳', text: '5 plans generated! You are a master chef.' },
        goal_reached: { label: 'Goal Crusher', icon: '🏆', text: 'Amazing! You reached your target!' }
    }

    const config = BADGE_CONFIG[badge.badge_type] || { label: badge.badge_type, icon: '🎖️', text: 'New Achievement Unlocked!' }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-500 font-outfit">
            <div className="bg-white dark:bg-[#0c241a] dark:border dark:border-white/15 rounded-3xl sm:rounded-[40px] shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 sm:space-y-6 animate-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping bg-orange-200 dark:bg-orange-500/20 rounded-full opacity-20" />
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto flex items-center justify-center text-4xl sm:text-5xl shadow-xl relative z-10">
                        {config.icon}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Badge!</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{config.text}</p>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3.5 border border-slate-200/80 dark:border-white/10">
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{config.label}</p>
                </div>

                <button
                    onClick={() => {
                        if (currentBadgeIndex + 1 < newBadges.length) {
                            setCurrentBadgeIndex(prev => prev + 1)
                        } else {
                            onComplete()
                        }
                    }}
                    className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-emerald-700/20 text-sm sm:text-base"
                >
                    {currentBadgeIndex + 1 < newBadges.length ? 'Next Badge! →' : 'Awesome! 🎉'}
                </button>
            </div>
        </div>
    )
}
