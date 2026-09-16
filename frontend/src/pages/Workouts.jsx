import { useState } from 'react'
import { Dumbbell, Flame, Sparkles, Clock, Trophy, CheckCircle, Bell, ArrowRight, Zap, Play, Target, ShieldCheck, HeartHandshake } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const UPCOMING_ROUTINES = [
    {
        id: 'hiit-fat-burn',
        title: 'High-Intensity Home Fat Burner',
        level: 'Intermediate',
        duration: '25 mins',
        calories: '~220 kcal',
        icon: '🔥',
        exercises: ['Jumping Jacks', 'Bodyweight Squats', 'Mountain Climbers', 'High Knees', 'Plank Hold'],
        tag: 'Cardio & Fat Loss',
        color: 'from-orange-500/20 to-rose-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400'
    },
    {
        id: 'push-pull-legs',
        title: 'Full Body Muscle & Strength Split',
        level: 'All Levels',
        duration: '40 mins',
        calories: '~280 kcal',
        icon: '💪',
        exercises: ['Push-Ups / Incline Press', 'Dumbbell Rows', 'Goblet Squats', 'Romanian Deadlifts', 'Core Crunch'],
        tag: 'Hypertrophy & Tone',
        color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
    },
    {
        id: 'yoga-flexibility',
        title: 'Morning Yoga & Posture Recovery',
        level: 'Beginner Friendly',
        duration: '20 mins',
        calories: '~110 kcal',
        icon: '🧘',
        exercises: ['Surya Namaskar (12 Cycles)', 'Downward Dog', 'Cobra Pose', 'Warrior II', 'Child Pose'],
        tag: 'Mobility & Calm',
        color: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
    }
]

const UPCOMING_FEATURES = [
    {
        icon: '🤖',
        title: 'AI Custom Split Generator',
        desc: 'Customized to your equipment (Home, Gym, Dumbbells only) and fitness goal.'
    },
    {
        icon: '🔥',
        title: 'Smart Calorie Burn Sync',
        desc: 'Completed workouts automatically subtract calories from your daily dashboard intake.'
    },
    {
        icon: '⏱️',
        title: 'Voice-Guided Rest Timers',
        desc: 'Interactive audio beeps and interval counts between workout sets.'
    },
    {
        icon: '🪙',
        title: '+15 HealthCoins Per Routine',
        desc: 'Earn rewards daily to unlock premium diet features and exclusive recipes.'
    }
]

export default function Workouts() {
    const [isNotified, setIsNotified] = useState(() => {
        return localStorage.getItem('workout_waitlist') === 'true'
    })

    const handleJoinWaitlist = () => {
        if (!isNotified) {
            localStorage.setItem('workout_waitlist', 'true')
            setIsNotified(true)
            toast.success("You're on the Workout Early Access list! We'll notify you as soon as it launches! 🚀", { duration: 2000 })
        } else {
            localStorage.removeItem('workout_waitlist')
            setIsNotified(false)
            toast('Notification preference removed.', { icon: 'ℹ️', duration: 2000 })
        }
    }

    return (
        <div className="space-y-8 pb-24 animate-fade-in font-outfit max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-700/20">
                            🏋️
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="page-title text-3xl">Workouts &amp; Fitness</h1>
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 font-black text-xs border border-amber-300/80">
                                    UPCOMING FEATURE
                                </span>
                            </div>
                            <p className="page-subtitle text-sm mt-0.5">
                                AI-powered training splits, exercise libraries, and calorie-burn tracking.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleJoinWaitlist}
                    className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md self-start sm:self-auto ${
                        isNotified
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-700/20 hover:scale-105 active:scale-95'
                    }`}
                >
                    {isNotified ? (
                        <>
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Early Access Reserved ✅</span>
                        </>
                    ) : (
                        <>
                            <Bell className="w-4 h-4" />
                            <span>Join Early Access List</span>
                        </>
                    )}
                </button>
            </div>

            {/* Launch Banner */}
            <div className="card p-6 sm:p-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-500/20 relative overflow-hidden">
                <div className="max-w-2xl space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Coming in Next Milestone Update</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                        Pair Your Personalized Diet With AI-Calibrated Workouts
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Nutrition is 70% of the game — the other 30% is movement. We are building an intelligent fitness tracker designed to sync with your daily meals, macros, and calorie deficits.
                    </p>
                </div>
            </div>

            {/* Feature Teasers Grid */}
            <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>What's Coming to NutriPlan Fitness</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {UPCOMING_FEATURES.map((feat, idx) => (
                        <div key={idx} className="card p-5 space-y-2.5 hover:border-emerald-500/30 transition-all group">
                            <span className="text-3xl group-hover:scale-110 transition-transform inline-block">
                                {feat.icon}
                            </span>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                {feat.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {feat.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sample Preview Routines */}
            <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Sneak Peek: Routine Preview Library</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {UPCOMING_ROUTINES.map((routine) => (
                        <div
                            key={routine.id}
                            className={`card p-6 flex flex-col justify-between border bg-gradient-to-br ${routine.color}`}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-3xl">{routine.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/40 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                                        {routine.level}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white text-base">
                                        {routine.title}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                        {routine.tag}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-200 pt-1">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{routine.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                                        <span>{routine.calories}</span>
                                    </div>
                                </div>

                                {/* Exercise Highlights */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        Included Exercises:
                                    </p>
                                    <div className="space-y-1">
                                        {routine.exercises.map((ex, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span>{ex}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5">
                                <button
                                    onClick={handleJoinWaitlist}
                                    className="w-full py-2.5 rounded-xl bg-white dark:bg-[#0c241a] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <span>Preview Interactive Tracker</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
