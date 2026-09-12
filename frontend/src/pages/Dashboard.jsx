import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import OnboardingWizard from '../components/OnboardingWizard'
import BadgeSection from '../components/BadgeSection'
import CelebrationOverlay from '../components/CelebrationOverlay'
import { DailyChallengesCard } from '../components/TokenWallet'

const COLORS = ['#2d6a4f', '#40916c', '#f4a261']

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
                <div className="h-8 bg-gray-200 rounded w-64 mt-1"></div>
                <div className="h-4 bg-gray-100 rounded w-96 mt-3"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-5 h-[116px] flex flex-col items-center justify-center gap-3">
                        <div className="h-8 bg-gray-200 rounded-xl w-16"></div>
                        <div className="h-3 bg-gray-100 rounded w-20"></div>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="card h-[280px] flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-[12px] border-gray-100"></div>
                </div>
                <div className="card h-[280px] space-y-4">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 bg-gray-50 rounded-xl flex items-center p-2 gap-3">
                            <div className="w-6 h-6 rounded shrink-0 bg-gray-200"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    const macroData = metrics?.macros ? [
        { name: 'Protein', value: Math.round(metrics.macros.protein_g), color: '#2d6a4f' },
        { name: 'Carbs', value: Math.round(metrics.macros.carbs_g), color: '#40916c' },
        { name: 'Fat', value: Math.round(metrics.macros.fat_g), color: '#f4a261' },
    ] : (profile?.calories_target ? [
        { name: 'Protein', value: Math.round((profile.calories_target * 0.3) / 4), color: '#2d6a4f' },
        { name: 'Carbs', value: Math.round((profile.calories_target * 0.45) / 4), color: '#40916c' },
        { name: 'Fat', value: Math.round((profile.calories_target * 0.25) / 9), color: '#f4a261' },
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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Your Health Dashboard</h1>
                <p className="page-subtitle">Track your nutrition and wellness journey at a glance</p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="metric-card">
                    <div className="metric-val text-orange-500 font-bold">🔥 {metrics?.streak ?? 0}</div>
                    <div className="metric-lbl">Day Streak</div>
                </div>
                <div className="metric-card">
                    <div className="metric-val">{profile?.bmi ?? '—'}</div>
                    <div className="metric-lbl">BMI</div>
                    {profile?.bmi && <span className={`badge ${bmiInfo.class} mt-1`}>{bmiInfo.label}</span>}
                </div>
                <div className="metric-card">
                    <div className="metric-val">{profile?.calories_target ? Math.round(profile.calories_target) : '—'}</div>
                    <div className="metric-lbl">Daily Target</div>
                    <span className="text-xs text-gray-400">kcal/day</span>
                </div>
                <div className="metric-card">
                    <div className="metric-val text-[#2d6a4f]">{metrics?.calories_consumed ? Math.round(metrics.calories_consumed) : '0'}</div>
                    <div className="metric-lbl">Consumed</div>
                    <span className="text-xs text-gray-400">kcal today</span>
                </div>
                <div className="metric-card">
                    <div className="metric-val text-orange-500">{profile?.calories_target ? Math.round(profile.calories_target - (metrics?.calories_consumed || 0)) : '—'}</div>
                    <div className="metric-lbl">Remaining</div>
                    <span className="text-xs text-gray-400">kcal left</span>
                </div>

            </div>

            {!profile?.bmi && (
                <div className="card border-dashed border-2 border-[#40916c]/30 bg-green-50/50 flex flex-col items-center py-8 gap-3">
                    <span className="text-4xl">🧬</span>
                    <p className="font-semibold text-gray-700">Complete Your Health Profile</p>
                    <p className="text-sm text-gray-500 text-center">Add your metrics to get your BMI, calorie target, and personalized meal plan</p>
                    <button onClick={() => setIsWizardOpen(true)} className="btn-primary btn-sm">Start Onboarding Wizard →</button>
                </div>
            )}

            <OnboardingWizard
                isOpen={isWizardOpen || (!loading && !profile?.bmi)}
                initialData={profile || {}}
                onComplete={() => setIsWizardOpen(false)}
            />

            {/* Macros + Today's Plan */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Macro Breakdown */}
                {macroData.length > 0 && (
                    <div className="card">
                        <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Macro Targets</h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={macroData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                                    paddingAngle={4} dataKey="value">
                                    {macroData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Pie>
                                <Tooltip formatter={(v, n) => [`${v}g`, n]} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-2">
                            {macroData.map(d => (
                                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: d.color }} />
                                    <span className="text-gray-600">{d.name}: <strong>{d.value}g</strong></span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Today's Meal Summary */}
                <div className="card">
                    <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Today's Meal Plan</h2>
                    {plan ? (
                        <div className="space-y-3">
                            {['breakfast', 'lunch', 'snack', 'dinner'].map(type => {
                                const items = plan.meals?.[type] ?? []
                                const icons = { breakfast: '🌅', lunch: '☀️', snack: '🫐', dinner: '🌙' }
                                const allConsumed = items.length > 0 && items.every(i => i.is_consumed);
                                return (
                                    <div key={type} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${allConsumed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50' : 'bg-gray-50 border-transparent dark:bg-gray-800/50 dark:border-gray-700'}`}>
                                        <span className="text-xl">{icons[type]}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize flex items-center gap-2">
                                                {type}
                                                {allConsumed && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Done</span>}
                                            </p>
                                            {items.length > 0
                                                ? <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {items.map((i, idx) => {
                                                        const name = i.recipe ? i.recipe.name : i.food?.name;
                                                        return (
                                                            <span key={idx} className={i.is_consumed ? 'line-through opacity-60' : ''}>
                                                                {name}{idx < items.length - 1 ? ', ' : ''}
                                                            </span>
                                                        );
                                                    })}
                                                  </p>
                                                : <p className="text-xs text-gray-400 italic">No items</p>
                                            }
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-6 gap-3">
                            <span className="text-4xl">🍽️</span>
                            <p className="text-sm text-gray-500">No meal plan generated for today</p>
                            <a href="/planner" className="btn-primary btn-sm">Generate Plan →</a>
                        </div>
                    )}
                </div>
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

            <CelebrationOverlay
                newBadges={celebratingBadges}
                onComplete={handleCelebrationComplete}
            />
        </div>
    )
}
