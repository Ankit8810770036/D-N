import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/errors'
import { useAuth } from '../context/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts'
import { 
    Scale, 
    Sparkles, 
    ArrowRight, 
    CheckCircle, 
    X, 
    Flame, 
    Activity, 
    TrendingDown, 
    TrendingUp, 
    Loader2 
} from 'lucide-react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

export default function Progress() {
    const { user, isAdmin } = useAuth()
    const location = useLocation()
    const queryClient = useQueryClient()
    const [logs, setLogs] = useState([])
    const [summary, setSummary] = useState(null)
    const [fetching, setFetching] = useState(true)
    const [loading, setLoading] = useState(false)
    const [recalibrating, setRecalibrating] = useState(false)
    const [recalibrationModal, setRecalibrationModal] = useState(null)
    const [dismissedBanner, setDismissedBanner] = useState(false)

    useBodyScrollLock(!!recalibrationModal)

    const todayStr = useMemo(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], [])
    const minDate = useMemo(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        return d.toISOString().split('T')[0]
    }, [])

    const [form, setForm] = useState({
        date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        weight: '', calories_consumed: '',
        protein: '', carbs: '', fat: '',
        water_intake_liters: '',
        steps: '', sleep_hours: '', workout_done: false, notes: '',
    })

    useEffect(() => {
        fetchAnalytics();
    }, [])

    useEffect(() => {
        if (!fetching && location.hash === '#log-form') {
            const timer = setTimeout(() => {
                const el = document.getElementById('log-form')
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    el.classList.add('ring-4', 'ring-emerald-400', 'ring-offset-2', 'shadow-2xl')
                    setTimeout(() => el.classList.remove('ring-4', 'ring-emerald-400', 'ring-offset-2', 'shadow-2xl'), 2000)
                }
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [location.hash, fetching])

    async function fetchAnalytics() {
        setFetching(true);
        try {
            const { data } = await api.get('/analytics?days=30');
            setLogs(data.logs?.map(l => ({
                ...l,
                date: new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            })) || []);
            setSummary(data.summary);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setFetching(false);
        }
    }

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    async function handleLog(e) {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post('/log-progress', form)
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
            queryClient.invalidateQueries({ queryKey: ['tokens'] })
            queryClient.invalidateQueries({ queryKey: ['userTokens'] })
            toast.success('Progress logged! 📊')
            
            // Check if weight difference warrants recalibration prompt
            if (data.recalibration_prompt && data.recalibration_prompt.needed) {
                setRecalibrationModal(data.recalibration_prompt)
            }

            await fetchAnalytics();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to log progress.'))
        } finally {
            setLoading(false)
        }
    }

    async function handleRecalibrate(targetWeight) {
        setRecalibrating(true)
        try {
            const { data } = await api.post('/profile/recalibrate', { weight_kg: targetWeight })
            toast.success(data.message || 'Targets successfully recalibrated! 🎯')
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['groceryList'] })
            queryClient.invalidateQueries({ queryKey: ['grocery-list'] })
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
            queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
            queryClient.invalidateQueries({ queryKey: ['tokens'] })
            setRecalibrationModal(null)
            setDismissedBanner(true)
            await fetchAnalytics()
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to recalibrate targets.'))
        } finally {
            setRecalibrating(false)
        }
    }

    const isPremium = user?.plan_type === 'premium' || isAdmin;
    const activePrompt = recalibrationModal || (!dismissedBanner ? summary?.recalibration_prompt : null);

    return (
        <div className="space-y-6 w-full pb-10 animate-fade-in font-outfit">
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Progress Tracker</h1>
                    <p className="page-subtitle">Log and visualize your daily health metrics</p>
                </div>
            </div>

            {/* ── Recalibration Banner (if ±2kg difference detected) ── */}
            {summary?.recalibration_prompt?.needed && !dismissedBanner && !recalibrationModal && (
                <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-2xl shrink-0">
                            ⚖️
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Weight Milestone &bull; {summary.recalibration_prompt.abs_diff_kg} kg {summary.recalibration_prompt.direction}
                                </span>
                            </div>
                            <h3 className="font-bold text-base mt-1 text-white">
                                {summary.recalibration_prompt.direction === 'lost' ? "🎉 Great job on your weight loss!" : "⚖️ Weight Change Detected"}
                            </h3>
                            <p className="text-emerald-100/80 text-sm mt-0.5 max-w-xl">
                                Your weight changed from <strong>{summary.recalibration_prompt.old_weight} kg</strong> to <strong>{summary.recalibration_prompt.new_weight} kg</strong>. Would you like to recalibrate your TDEE ({summary.recalibration_prompt.old_tdee} &rarr; {summary.recalibration_prompt.new_tdee} kcal) and daily calorie targets?
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setRecalibrationModal(summary.recalibration_prompt)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow hover:shadow-md flex items-center gap-1.5"
                        >
                            <Sparkles className="w-4 h-4" /> Recalibrate Now
                        </button>
                        <button
                            onClick={() => setDismissedBanner(true)}
                            className="text-emerald-300 hover:text-white p-2 rounded-lg hover:bg-white/10 text-xs font-semibold"
                            title="Dismiss reminder"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {fetching ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    {summary && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {/* Start Weight */}
                                <div className="metric-card py-3">
                                    <div className="metric-val text-xl">
                                        {summary.weight_start ?? '—'}
                                        {!summary.has_weight_logs && summary.weight_start && (
                                            <span className="block text-[9px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide mt-0.5">From Profile</span>
                                        )}
                                    </div>
                                    <div className="metric-lbl">Start Weight (kg)</div>
                                </div>

                                {/* Current Weight */}
                                <div className="metric-card py-3">
                                    <div className="metric-val text-xl">
                                        {summary.weight_latest ?? '—'}
                                        {!summary.has_weight_logs && summary.weight_latest && (
                                            <span className="block text-[9px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide mt-0.5">From Profile</span>
                                        )}
                                    </div>
                                    <div className="metric-lbl">Current Weight (kg)</div>
                                </div>

                                {/* 30-Day Change */}
                                <div className="metric-card py-3">
                                    <div className={`metric-val text-xl ${
                                        summary.weight_change > 0 ? 'text-amber-500' :
                                        summary.weight_change < 0 ? 'text-emerald-600' : ''
                                    }`}>
                                        {summary.weight_change !== null
                                            ? `${summary.weight_change > 0 ? '+' : ''}${summary.weight_change} kg`
                                            : '—'}
                                    </div>
                                    <div className="metric-lbl">30-Day Change</div>
                                </div>

                                {/* Workout Days — all-time total */}
                                <div className="metric-card py-3">
                                    <div className="metric-val text-xl">{summary.total_workout_days ?? 0}</div>
                                    <div className="metric-lbl">Total Workout Days</div>
                                </div>
                            </div>

                            {/* Nudge when no weight has been logged yet */}
                            {!summary.has_weight_logs && (
                                <div className="flex items-start gap-3 bg-sky-50 dark:bg-blue-900/20 border border-sky-200 dark:border-blue-800/50 rounded-2xl px-4 py-3.5 text-sm shadow-sm">
                                    <span className="text-sky-600 text-lg mt-0.5">💡</span>
                                    <div>
                                        <p className="font-bold text-sky-950 dark:text-blue-300">Log your weight to track progress</p>
                                        <p className="text-sky-800/80 dark:text-blue-400 text-xs mt-0.5">
                                            {summary.profile_weight
                                                ? `Your profile weight (${summary.profile_weight} kg) is shown as a baseline. Log your daily weight below to see real trends and changes.`
                                                : 'Use the form below to log your weight and other health metrics. Your trends will appear here automatically.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Charts */}
                    {logs.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Weight Trend */}
                            <div className="card">
                                <h3 className="font-bold text-slate-900 dark:text-white/90 mb-4">⚖️ Weight Trend (30 Days)</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={logs}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                                        <YAxis tick={{ fontSize: 10 }} unit="kg" stroke="#94a3b8" />
                                        <Tooltip formatter={(v) => [`${v} kg`, 'Weight']} />
                                        <Line type="monotone" dataKey="weight" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: '#059669' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Calories Bar */}
                            <div className="card">
                                <h3 className="font-bold text-slate-900 dark:text-white/90 mb-4">🔥 Calories Consumed (30 Days)</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={logs}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                                        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                                        <Tooltip formatter={(v) => [`${v} kcal`, 'Calories']} />
                                        <Bar dataKey="calories_consumed" fill="#10b981" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Macro Breakdown (Premium/Admin) */}
                            <div className="card md:col-span-2 relative overflow-hidden">
                                <h3 className="font-bold text-slate-900 dark:text-white/90 mb-4 flex items-center justify-between">
                                    <span>🥩 Macro Distribution History</span>
                                    {!isPremium && (
                                        <span className="badge badge-gold">PREMIUM ONLY</span>
                                    )}
                                </h3>

                                {isPremium ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={logs}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                                            <YAxis tick={{ fontSize: 10 }} unit="g" stroke="#94a3b8" />
                                            <Tooltip />
                                            <Legend verticalAlign="top" height={36} />
                                            <Bar dataKey="protein" stackId="a" fill="#059669" name="Protein (g)" />
                                            <Bar dataKey="carbs" stackId="a" fill="#10b981" name="Carbs (g)" />
                                            <Bar dataKey="fat" stackId="a" fill="#f59e0b" name="Fat (g)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                                        <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm mb-4">
                                            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        </div>
                                        <p className="text-slate-900 dark:text-white font-bold">Macro Analytics Locked</p>
                                        <p className="text-slate-500 text-sm mb-6 px-12 text-center">Upgrade to Premium to visualize your protein, carb, and fat distribution over time.</p>
                                        <button
                                            onClick={() => window.location.href = '/subscription'}
                                            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
                                        >
                                            Get Pro Access
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card py-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4">📈</div>
                            <h3 className="font-bold text-gray-800 dark:text-white/90">No data logged yet</h3>
                            <p className="text-sm text-gray-500 max-w-sm">Log your first entry below to start seeing your progress charts and health trends!</p>
                        </div>
                    )}
                </>
            )}

            {/* Log Form */}
            <div id="log-form" className="card scroll-mt-24 transition-all duration-500">
                <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-4">📝 Log Today's Progress</h2>
                <form onSubmit={handleLog} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="input-label">Date (Past 30 Days to Today)</label>
                            <input
                                type="date"
                                min={minDate}
                                max={todayStr}
                                value={form.date}
                                onChange={e => set('date', e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label className="input-label">Weight (kg)</label>
                            <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)}
                                className="input-field" placeholder="e.g. 70.5" step="0.1" required />
                        </div>
                        <div>
                            <label className="input-label">Calories Consumed</label>
                            <input type="number" value={form.calories_consumed} onChange={e => set('calories_consumed', e.target.value)}
                                className="input-field" placeholder="e.g. 1850 kcal" required />
                        </div>
                        <div>
                            <label className="input-label">Protein (g)</label>
                            <input type="number" value={form.protein} onChange={e => set('protein', e.target.value)}
                                className="input-field" placeholder="e.g. 120g" />
                        </div>
                        <div>
                            <label className="input-label">Carbs (g)</label>
                            <input type="number" value={form.carbs} onChange={e => set('carbs', e.target.value)}
                                className="input-field" placeholder="e.g. 210g" />
                        </div>
                        <div>
                            <label className="input-label">Fat (g)</label>
                            <input type="number" value={form.fat} onChange={e => set('fat', e.target.value)}
                                className="input-field" placeholder="e.g. 55g" />
                        </div>
                        <div>
                            <label className="input-label">Water Intake (L)</label>
                            <input type="number" value={form.water_intake_liters} onChange={e => set('water_intake_liters', e.target.value)}
                                className="input-field" placeholder="e.g. 3.0 L" step="0.1" />
                        </div>
                        <div>
                            <label className="input-label">Steps (Daily)</label>
                            <input type="number" value={form.steps} onChange={e => set('steps', e.target.value)}
                                className="input-field" placeholder="e.g. 8500 steps" />
                        </div>
                        <div>
                            <label className="input-label">Sleep Hours</label>
                            <input type="number" value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)}
                                className="input-field" placeholder="e.g. 7.5 hrs" step="0.5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="workout" checked={form.workout_done}
                            onChange={e => set('workout_done', e.target.checked)}
                            className="w-4 h-4 accent-[#2d6a4f]" />
                        <label htmlFor="workout" className="text-sm font-medium text-gray-700 dark:text-gray-300">💪 Workout Done Today</label>
                    </div>
                    <div>
                        <label className="input-label">Notes &amp; Reflections <span className="text-gray-400 font-normal">(optional)</span></label>
                        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                            className="input-field" placeholder="e.g. Felt energetic throughout the day, hit water target easily..." rows={2} />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Saving...' : 'Log Progress ✅'}
                    </button>
                </form>
            </div>

            {/* ── Dynamic Calorie Recalibration Modal ── */}
            {recalibrationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-gray-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden">
                        {/* Background subtle glow */}
                        <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shadow-sm">
                                    ⚖️
                                </div>
                                <div>
                                    <span className="text-[11px] font-black tracking-widest text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                                        Clinical Recalibration
                                    </span>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                                        Dynamic Target Recalibration
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setRecalibrationModal(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Prompt Message */}
                        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl p-4 mb-5 text-sm text-emerald-900 dark:text-emerald-200 font-medium">
                            <p>
                                {recalibrationModal.message}
                            </p>
                        </div>

                        {/* Metric Comparison Cards */}
                        <div className="space-y-3 mb-6">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                                Target Comparison Preview
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Weight */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase">Body Weight</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-semibold text-gray-500 line-through">
                                            {recalibrationModal.old_weight} kg
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span className="text-base font-black text-gray-900 dark:text-white">
                                            {recalibrationModal.new_weight} kg
                                        </span>
                                    </div>
                                </div>

                                {/* Calorie Target */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase">Daily Calories</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-semibold text-gray-500 line-through">
                                            {recalibrationModal.old_target} kcal
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                            {recalibrationModal.new_target} kcal
                                        </span>
                                    </div>
                                </div>

                                {/* BMR */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase">BMR (Mifflin-St Jeor)</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-semibold text-gray-500 line-through">
                                            {recalibrationModal.old_bmr} kcal
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span className="text-base font-black text-gray-900 dark:text-white">
                                            {recalibrationModal.new_bmr} kcal
                                        </span>
                                    </div>
                                </div>

                                {/* TDEE */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase">TDEE Expenditure</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-semibold text-gray-500 line-through">
                                            {recalibrationModal.old_tdee} kcal
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                            {recalibrationModal.new_tdee} kcal
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scientific explanation info */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            💡 As your body composition shifts, recalculating energy requirements prevents metabolic adaptation and weight plateaus.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => handleRecalibrate(recalibrationModal.new_weight)}
                                disabled={recalibrating}
                                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-600/20"
                            >
                                {recalibrating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Recalibrating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" /> Recalibrate Targets Now
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setRecalibrationModal(null);
                                    setDismissedBanner(true);
                                }}
                                disabled={recalibrating}
                                className="btn-secondary py-3 px-5 text-sm font-semibold text-gray-600 dark:text-gray-300"
                            >
                                Keep Current Targets
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
