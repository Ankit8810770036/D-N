import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import OnboardingWizard from '../components/OnboardingWizard'
import BadgeSection from '../components/BadgeSection'
import CelebrationOverlay from '../components/CelebrationOverlay'
import { DailyChallengesCard } from '../components/TokenWallet'
import TodayMealSection from '../components/TodayMealSection'
import { MessageSquarePlus } from 'lucide-react'

const COLORS = ['#059669', '#10b981', '#f59e0b']

export default function Dashboard() {
    const { user } = useAuth()
    const location = useLocation()
    const [isWizardOpen, setIsWizardOpen] = useState(false)

    // Calculate local today's date correctly (avoiding UTC timezone offset issues)
    const d = new Date();
    const localToday = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    const { data: profileData, isLoading: loadingProfile } = useQuery({
        queryKey: ['profile', localToday],
        queryFn: () => api.get(`/profile?date=${localToday}`).then(res => res.data),
    })

    const profile = profileData?.profile;
    const metrics = profileData?.metrics;

    const { data: plan, isLoading: loadingPlan } = useQuery({
        queryKey: ['mealPlan', localToday],
        queryFn: () => api.get(`/meal-plan?date=${localToday}`).then(res => res.data).catch(() => null),
    })

    const { data: summary, isLoading: loadingSummary } = useQuery({
        queryKey: ['summary'],
        queryFn: () => api.get('/report/summary').then(res => res.data).catch(() => null),
    })

    const loading = loadingProfile || loadingPlan || loadingSummary
    const [celebratingBadges, setCelebratingBadges] = useState([])
    const badges = summary?.badges || []

    useEffect(() => {
        if (!loading && location.hash === '#daily-challenges') {
            const timer = setTimeout(() => {
                const el = document.getElementById('daily-challenges')
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    el.classList.add('ring-4', 'ring-amber-400', 'ring-offset-2', 'shadow-2xl')
                    setTimeout(() => {
                        el.classList.remove('ring-4', 'ring-amber-400', 'ring-offset-2', 'shadow-2xl')
                    }, 2000)
                }
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [location.hash, loading])

    useEffect(() => {
        if (badges.length > 0) {
            const seenBadges = JSON.parse(localStorage.getItem('seen_badges') || '[]')
            const newBadges = badges.filter(b => !seenBadges.includes(b.id))
            if (newBadges.length > 0) {
                setCelebratingBadges(newBadges)
            }
        }
    }, [badges])

    const handleCelebrationComplete = () => {
        const seenBadges = JSON.parse(localStorage.getItem('seen_badges') || '[]')
        const updatedSeen = [...new Set([...seenBadges, ...celebratingBadges.map(b => b.id)])]
        localStorage.setItem('seen_badges', JSON.stringify(updatedSeen))
        setCelebratingBadges([])
    }

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="page-header">
                <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-xl w-64 mt-1"></div>
                <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-lg w-96 mt-3"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="card p-5 h-[116px] flex flex-col items-center justify-center gap-3">
                        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-xl w-16"></div>
                        <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-20"></div>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="card h-[280px] flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-[12px] border-slate-100 dark:border-white/10"></div>
                </div>
                <div className="card h-[280px] space-y-4">
                    <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-32 mb-4"></div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center p-2 gap-3">
                            <div className="w-6 h-6 rounded shrink-0 bg-slate-200 dark:bg-white/10"></div>
                            <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    const macroData = metrics?.macros ? [
        { name: 'Protein', value: Math.round(metrics.macros.protein_g), color: '#059669' },
        { name: 'Carbs', value: Math.round(metrics.macros.carbs_g), color: '#10b981' },
        { name: 'Fat', value: Math.round(metrics.macros.fat_g), color: '#f59e0b' },
    ] : (profile?.calories_target ? [
        { name: 'Protein', value: Math.round((profile.calories_target * 0.3) / 4), color: '#059669' },
        { name: 'Carbs', value: Math.round((profile.calories_target * 0.45) / 4), color: '#10b981' },
        { name: 'Fat', value: Math.round((profile.calories_target * 0.25) / 9), color: '#f59e0b' },
    ] : [])

    const getBMIClass = (bmi) => {
        if (!bmi) return { label: 'Unknown', class: 'badge-blue' }
        if (bmi < 18.5) return { label: 'Underweight', class: 'badge-blue' }
        if (bmi < 25) return { label: 'Normal ✅', class: 'badge-green' }
        if (bmi < 30) return { label: 'Overweight', class: 'badge-gold' }
        return { label: 'Obese', class: 'badge-red' }
    }

    const bmiInfo = getBMIClass(profile?.bmi)

    return (
        <div className="space-y-6 w-full min-w-0">
            {/* Page Header */}
            <div className="page-header w-full">
                <h1 className="page-title">Your Health Dashboard</h1>
                <p className="page-subtitle">Track your nutrition and wellness journey at a glance</p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
                <div className="metric-card w-full">
                    <div className="metric-val text-amber-500 font-bold">🔥 {metrics?.streak ?? 0}</div>
                    <div className="metric-lbl">Day Streak</div>
                </div>
                <div className="metric-card w-full">
                    <div className="metric-val">{profile?.bmi ?? '—'}</div>
                    <div className="metric-lbl">BMI</div>
                    {profile?.bmi && <span className={`badge ${bmiInfo.class} mt-1`}>{bmiInfo.label}</span>}
                </div>
                <div className="metric-card w-full">
                    <div className="metric-val">{profile?.calories_target ? Math.round(profile.calories_target) : '—'}</div>
                    <div className="metric-lbl">Daily Target</div>
                    <span className="text-xs text-slate-400 font-medium">kcal/day</span>
                </div>
                <div className="metric-card w-full">
                    <div className="metric-val text-emerald-600 dark:text-green-400">{metrics?.calories_consumed ? Math.round(metrics.calories_consumed) : '0'}</div>
                    <div className="metric-lbl">Consumed</div>
                    <span className="text-xs text-slate-400 font-medium">kcal today</span>
                </div>
                <div className="metric-card col-span-2 sm:col-span-2 lg:col-span-1 w-full">
                    <div className="metric-val text-amber-500">{profile?.calories_target ? Math.round(profile.calories_target - (metrics?.calories_consumed || 0)) : '—'}</div>
                    <div className="metric-lbl">Remaining</div>
                    <span className="text-xs text-slate-400 font-medium">kcal left</span>
                </div>

            </div>

            {!profile?.bmi && (
                <div className="card w-full border-dashed border-2 border-emerald-300 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col items-center py-8 gap-3">
                    <span className="text-4xl">🧬</span>
                    <p className="font-bold text-slate-800 dark:text-white">Complete Your Health Profile</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 text-center max-w-md">Add your metrics to get your BMI, calorie target, and personalized meal plan</p>
                    <button onClick={() => setIsWizardOpen(true)} className="btn-primary btn-sm mt-1">Start Onboarding Wizard →</button>
                </div>
            )}

            <OnboardingWizard
                isOpen={isWizardOpen || (!loading && !profile?.bmi)}
                initialData={profile || {}}
                onComplete={() => setIsWizardOpen(false)}
            />

            {/* Macros + Today's Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full min-w-0">
                {/* Macro Breakdown */}
                {macroData.length > 0 && (
                    <div className="card w-full min-w-0 overflow-hidden flex flex-col justify-between">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-3">Macro Targets</h2>
                        <div className="w-full h-[180px] min-w-0 flex items-center justify-center">
                            <ResponsiveContainer width="99%" height={180}>
                                <PieChart>
                                    <Pie data={macroData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                                        paddingAngle={4} dataKey="value">
                                        {macroData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [`${v}g`, n]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-3">
                            {macroData.map(d => (
                                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: d.color }} />
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">{d.name}: <strong className="text-slate-900 dark:text-white">{d.value}g</strong></span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Today's Meal Summary - Smart Time-based */}
                <TodayMealSection
                    plan={plan}
                    localToday={localToday}
                    profile={profile}
                />
            </div>

            {/* Stats Row */}
            {summary?.stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="metric-card">
                        <div className="metric-val text-2xl">{summary.stats.total_plans_generated}</div>
                        <div className="metric-lbl">Plans Generated</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-val text-2xl">{summary.stats.total_logs}</div>
                        <div className="metric-lbl">Days Logged</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-val text-2xl">{summary.stats.workout_days}</div>
                        <div className="metric-lbl">Workouts Done</div>
                    </div>
                </div>
            )}

            {/* Achievements */}
            <BadgeSection badges={badges} />

            {/* Daily Challenges */}
            <DailyChallengesCard date={localToday} />

            {/* Quick Feedback Banner */}
            <div className="card p-5 sm:p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-700/20">
                        <MessageSquarePlus className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-base">Got feedback or ideas for Metrivita?</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Tell us what you love or want improved and earn <strong className="text-amber-600 dark:text-amber-400 font-bold">+10 HealthCoins</strong>!
                        </p>
                    </div>
                </div>
                <Link
                    to="/feedback"
                    className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 hover:scale-105 active:scale-95 transition-all"
                >
                    Give Feedback (+10 🪙)
                </Link>
            </div>

            <CelebrationOverlay
                newBadges={celebratingBadges}
                onComplete={handleCelebrationComplete}
            />
        </div>
    )
}
