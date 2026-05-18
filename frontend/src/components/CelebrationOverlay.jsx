import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

export default function CelebrationOverlay({ newBadges = [], onComplete }) {
    const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0)

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

    if (newBadges.length === 0 || currentBadgeIndex >= newBadges.length) return null

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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping bg-orange-200 rounded-full opacity-20" />
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto flex items-center justify-center text-5xl shadow-xl relative z-10">
                        {config.icon}
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">New Badge!</h2>
                    <p className="text-sm text-gray-500 font-medium">{config.text}</p>
                </div>

                <div className="bg-gray-50 rounded-3xl p-4 border-2 border-gray-100">
                    <p className="text-xl font-bold text-gray-800">{config.label}</p>
                </div>

                <button
                    onClick={() => {
                        if (currentBadgeIndex + 1 < newBadges.length) {
                            setCurrentBadgeIndex(prev => prev + 1)
                        } else {
                            onComplete()
                        }
                    }}
                    className="w-full py-4 bg-[#2d6a4f] text-white rounded-2xl font-bold hover:bg-[#1b4332] active:scale-95 transition-all shadow-lg"
                >
                    {currentBadgeIndex + 1 < newBadges.length ? 'Next Badge! →' : 'Awesome!'}
                </button>
            </div>
        </div>
    )
}
