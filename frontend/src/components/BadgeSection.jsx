const BADGE_CONFIG = {
    streak_7: {
        label: '7-Day Streak',
        icon: '🔥',
        description: 'Logged consistently for 7 days!',
        color: 'bg-orange-100 text-orange-600 border-orange-200'
    },
    starter: {
        label: 'Fresh Start',
        icon: '🌱',
        description: 'Completed your first health log!',
        color: 'bg-green-100 text-green-600 border-green-200'
    },
    culinary_explorer: {
        label: 'Culinary Explorer',
        icon: '👨‍🍳',
        description: 'Generated 5 unique meal plans!',
        color: 'bg-blue-100 text-blue-600 border-blue-200'
    },
    goal_reached: {
        label: 'Goal Crusher',
        icon: '🏆',
        description: 'Reached your target weight goal!',
        color: 'bg-purple-100 text-purple-600 border-purple-200'
    }
}

export default function BadgeSection({ badges = [] }) {
    if (badges.length === 0) return (
        <div className="card bg-gray-50/50 border-dashed border-2 flex flex-col items-center py-6 text-gray-400">
            <span className="text-3xl mb-2">🏅</span>
            <p className="text-sm font-medium">No badges earned yet.</p>
            <p className="text-[10px]">Complete logs and stick to your plan to unlock more!</p>
        </div>
    )

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <span>Achievements</span>
                    <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{badges.length}</span>
                </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {badges.map((badge, idx) => {
                    const config = BADGE_CONFIG[badge.badge_type] || { label: badge.badge_type, icon: '🎖️', color: 'bg-gray-100' }
                    return (
                        <div key={idx} className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all hover:scale-105 hover:shadow-sm ${config.color}`}>
                            <span className="text-3xl mb-1">{config.icon}</span>
                            <p className="text-[11px] font-bold leading-tight">{config.label}</p>
                            <p className="text-[9px] opacity-70 mt-1">{new Date(badge.earned_at).toLocaleDateString()}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
