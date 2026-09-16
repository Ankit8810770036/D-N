import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FileText, Download, User, Activity, Flame, Scale, Dumbbell, CalendarCheck, TrendingUp, Trophy, RefreshCw } from 'lucide-react'
import { getErrorMessage } from '../utils/errors'
import UserAvatar from '../components/UserAvatar'

// Helper: BMI category + colour
function bmiMeta(bmi) {
    if (!bmi) return { label: '—', color: 'text-gray-400' }
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' }
    if (bmi < 25)   return { label: 'Normal',       color: 'text-emerald-600' }
    if (bmi < 30)   return { label: 'Overweight',   color: 'text-amber-500' }
    return              { label: 'Obese',            color: 'text-red-500' }
}

function StatCard({ icon: Icon, iconBg, val, lbl, sub, subColor }) {
    return (
        <div className="metric-card flex flex-col gap-2 py-4 px-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
                <div className={`metric-val text-2xl ${subColor || ''}`}>{val}</div>
                <div className="metric-lbl">{lbl}</div>
                {sub && <div className={`text-[10px] font-semibold mt-0.5 ${subColor || 'text-gray-400'}`}>{sub}</div>}
            </div>
        </div>
    )
}

export default function Reports() {
    const navigate = useNavigate()
    const [summary, setSummary]     = useState(null)
    const [loading, setLoading]     = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [date, setDate]           = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0])
    
    const minDate = useMemo(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        return d.toISOString().split('T')[0]
    }, [])

    const maxDate = useMemo(() => {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        return d.toISOString().split('T')[0]
    }, [])

    const fetchSummary = useCallback(() => {
        setLoading(true)
        api.get('/report/summary')
            .then(({ data }) => setSummary(data))
            .catch((err) => toast.error(getErrorMessage(err, 'Failed to load report summary.')))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        fetchSummary()
    }, [fetchSummary])

    async function downloadPDF() {
        setDownloading(true)
        try {
            const response = await api.get(`/report/pdf?date=${date}`, { responseType: 'blob' })
            
            // Check if response is actually a JSON error hidden in blob
            if (response.data && response.data.type === 'application/json') {
                const text = await response.data.text()
                const json = JSON.parse(text)
                throw new Error(json.error || json.message || 'Failed to generate PDF.')
            }

            const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
            const link = document.createElement('a')
            link.href  = url
            link.setAttribute('download', `diet_report_${date}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success('PDF report downloaded! 📄')
        } catch (err) {
            // If error has blob response, extract message
            if (err.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text()
                    const json = JSON.parse(text)
                    toast.error(json.error || json.message || 'Failed to generate PDF report.')
                    return
                } catch (_) {}
            }
            toast.error(getErrorMessage(err, 'Failed to generate PDF report. Please try again.'))
        } finally {
            setDownloading(false)
        }
    }

    const profile = summary?.profile
    const stats   = summary?.stats
    const bmi     = profile?.bmi ? parseFloat(profile.bmi) : null
    const meta    = bmiMeta(bmi)

    return (
        <div className="space-y-6 w-full pb-10 animate-fade-in">
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><FileText className="w-7 h-7 text-emerald-600 dark:text-green-400" /> Reports</h1>
                <p className="page-subtitle">Your complete health &amp; diet overview</p>
            </div>

            {/* ── Loading ── */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
                </div>
            ) : summary ? (
                <>
                    {/* ── User Card ── */}
                    <div className="card bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white shadow-xl shadow-emerald-900/15">
                        <div className="flex items-center gap-4">
                            <UserAvatar user={summary.user} size="lg" className="w-14 h-14 rounded-2xl shadow-inner ring-2 ring-white/30" />
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold truncate">{summary.user?.name}</h2>
                                <p className="text-white/80 text-sm truncate">{summary.user?.email}</p>
                            </div>
                            {stats?.streak > 0 && (
                                <div className="shrink-0 text-right">
                                    <p className="text-2xl font-black text-amber-300">🔥 {stats.streak}</p>
                                    <p className="text-white/70 text-xs font-semibold">Day Streak</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── No profile warning ── */}
                    {!summary.has_profile && (
                        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl px-4 py-3 text-sm">
                            <span className="text-amber-500 text-lg">⚠️</span>
                            <div>
                                <p className="font-semibold text-amber-800 dark:text-amber-300">Health profile not set up</p>
                                <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                                    BMI and calorie target will show once you fill in your health profile.{' '}
                                    <button onClick={() => navigate('/profile')} className="underline font-bold hover:text-amber-900">Set up profile →</button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Stats Grid ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                        {/* BMI */}
                        <StatCard
                            icon={Scale}
                            iconBg="bg-emerald-500"
                            val={bmi ? bmi.toFixed(1) : '—'}
                            lbl="BMI"
                            sub={meta.label}
                            subColor={bmi ? meta.color : 'text-gray-400'}
                        />

                        {/* Calorie Target */}
                        <StatCard
                            icon={Flame}
                            iconBg="bg-orange-500"
                            val={profile?.calories_target ? `${Math.round(profile.calories_target).toLocaleString()}` : '—'}
                            lbl="Calorie Target"
                            sub="kcal / day"
                        />

                        {/* Avg Calories Consumed */}
                        <StatCard
                            icon={Activity}
                            iconBg="bg-blue-500"
                            val={stats?.avg_calories ? stats.avg_calories.toLocaleString() : '—'}
                            lbl="Avg Consumed"
                            sub={stats?.avg_calories ? 'kcal / day' : 'Log progress to see'}
                        />

                        {/* Avg Logged Weight */}
                        <StatCard
                            icon={TrendingUp}
                            iconBg="bg-purple-500"
                            val={stats?.avg_weight ?? (profile?.weight_kg ? `${parseFloat(profile.weight_kg)}` : '—')}
                            lbl="Avg Weight (kg)"
                            sub={stats?.avg_weight ? 'from your logs' : (profile?.weight_kg ? 'from profile' : 'No data yet')}
                        />

                        {/* Meal Plans */}
                        <StatCard
                            icon={CalendarCheck}
                            iconBg="bg-teal-500"
                            val={stats?.total_plans_generated ?? 0}
                            lbl="Meal Plans"
                            sub="generated"
                        />

                        {/* Workout Days */}
                        <StatCard
                            icon={Dumbbell}
                            iconBg={stats?.workout_days > 0 ? 'bg-emerald-600' : 'bg-gray-300'}
                            val={stats?.workout_days ?? 0}
                            lbl="Workout Days"
                            sub={stats?.workout_days > 0 ? 'all-time ✅' : 'None logged yet'}
                        />

                        {/* Progress Logs */}
                        <StatCard
                            icon={FileText}
                            iconBg="bg-indigo-500"
                            val={stats?.total_logs ?? 0}
                            lbl="Progress Logs"
                            sub="entries"
                        />

                        {/* Streak */}
                        <StatCard
                            icon={Trophy}
                            iconBg={stats?.streak > 0 ? 'bg-amber-500' : 'bg-gray-300'}
                            val={stats?.streak > 0 ? `🔥 ${stats.streak}` : '0'}
                            lbl="Current Streak"
                            sub={stats?.streak > 0 ? 'days in a row' : 'Start logging daily!'}
                        />
                    </div>

                    {/* ── Latest log date callout ── */}
                    {stats?.latest_log_date && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
                            <Activity className="w-3.5 h-3.5" />
                            Last progress entry:{' '}
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {new Date(stats.latest_log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    )}
                </>
            ) : (
                <div className="card flex flex-col items-center py-12 gap-3 text-center">
                    <span className="text-5xl">📊</span>
                    <p className="font-semibold text-gray-700 dark:text-white/80">Could not load report data</p>
                    <p className="text-sm text-gray-400">Check your connection or try fetching again.</p>
                    <button onClick={fetchSummary} className="btn-primary mt-2 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                </div>
            )}

            {/* ── PDF Download Card ── */}
            <div className="card">
                <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-1 flex items-center gap-2">
                    <Download className="w-5 h-5 text-[#2d6a4f]" /> Download Diet Report (PDF)
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Generates a complete PDF including your health metrics, meal plan for the selected date, and recent 7-day progress.
                </p>
                <div className="flex items-end gap-4 flex-wrap">
                    <div>
                        <label className="input-label">Report Date (Past 30 Days to 30 Days Ahead)</label>
                        <input
                            type="date"
                            min={minDate}
                            max={maxDate}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="input-field"
                            style={{ maxWidth: 240 }}
                        />
                    </div>
                    <button onClick={downloadPDF} disabled={downloading} className="btn-gold flex items-center gap-2">
                        {downloading ? (
                            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generating…</>
                        ) : (
                            <><Download className="w-4 h-4" /> Download PDF Report</>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Badges ── */}
            {summary?.badges?.length > 0 && (
                <div className="card">
                    <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" /> Your Badges
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {summary.badges.map(b => (
                            <span key={b.id || b.badge_type} className="inline-flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-full font-semibold">
                                🏅 {b.badge_name || (b.badge_type ? b.badge_type.replace(/_/g, ' ') : 'Achievement')}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Tips ── */}
            <div className="card bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3">💡 Health Tips</h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {[
                        'Drink at least 2–3 liters of water per day.',
                        'Eat protein-rich foods at every meal to preserve muscle mass.',
                        'A 500 kcal daily deficit leads to approximately 0.5 kg of fat loss per week.',
                        'Getting 7–9 hours of quality sleep improves metabolism and reduces cravings.',
                        'Replace refined carbs (white bread, chips) with whole grains and makhana.',
                        'Track your progress consistently — small wins compound over time.',
                    ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">•</span>
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
