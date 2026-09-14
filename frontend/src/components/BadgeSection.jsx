const BADGE_CONFIG = {
    streak_7: {
        label: '7-Day Streak',
        icon: '🔥',
        description: 'Logged consistently for 7 days!',
        color: 'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
    },
    starter: {
        label: 'Fresh Start',
        icon: '🌱',
        description: 'Completed your first health log!',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
    },
    culinary_explorer: {
        label: 'Culinary Explorer',
        icon: '👨‍🍳',
        description: 'Generated 5 unique meal plans!',
        color: 'bg-sky-50 text-sky-800 border-sky-200/90 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800/50'
    },
    goal_reached: {
        label: 'Goal Crusher',
        icon: '🏆',
        description: 'Reached your target weight goal!',
        color: 'bg-purple-50 text-purple-800 border-purple-200/90 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50'
    }
}

export default function BadgeSection({ badges = [] }) {
    if (badges.length === 0) return (
        <div className="card bg-slate-50/50 border-dashed border-2 border-slate-200 flex flex-col items-center py-6 text-slate-400">
            <span className="text-3xl mb-2">🏅</span>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No badges earned yet.</p>
            <p className="text-xs text-slate-400 mt-0.5">Complete logs and stick to your plan to unlock more!</p>
        </div>
    )

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Achievements</span>
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badges.length}</span>
                </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {badges.map((badge, idx) => {
                    const config = BADGE_CONFIG[badge.badge_type] || { label: badge.badge_type, icon: '🎖️', color: 'bg-slate-100 text-slate-700' }
                    return (
                        <div key={idx} className={`p-3.5 rounded-2xl border flex flex-col items-center text-center transition-all hover:scale-[1.03] hover:shadow-sm ${config.color}`}>
                            <span className="text-3xl mb-1.5">{config.icon}</span>
                            <p className="text-xs font-bold leading-tight">{config.label}</p>
                            <p className="text-[10px] opacity-70 mt-1 font-medium">{new Date(badge.earned_at).toLocaleDateString()}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
