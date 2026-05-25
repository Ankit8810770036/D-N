import React, { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'

export default function Progress() {
    const { user, isAdmin } = useAuth()
    const queryClient = useQueryClient()
    const [logs, setLogs] = useState([])
    const [summary, setSummary] = useState(null)
    const [fetching, setFetching] = useState(true)
    const [loading, setLoading] = useState(false)
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
            await api.post('/log-progress', form)
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            toast.success('Progress logged! 📊')
            await fetchAnalytics();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log progress.')
        } finally {
            setLoading(false)
        }
    }

    const isPremium = user?.plan_type === 'premium' || isAdmin;

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="page-header">
                <h1 className="page-title">Progress Tracker</h1>
                <p className="page-subtitle">Log and visualize your daily health metrics</p>
            </div>

            {fetching ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-[#2d6a4f] border-t-transparent rounded-full" />
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    {summary && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {/* Start Weight — falls back to profile weight if no logs yet */}
                                <div className="metric-card py-3">
                                    <div className="metric-val text-xl">
                                        {summary.weight_start ?? '—'}
                                        {!summary.has_weight_logs && summary.weight_start && (
                                            <span className="block text-[9px] font-semibold text-blue-500 uppercase tracking-wide mt-0.5">From Profile</span>
                                        )}
                                    </div>
                                    <div className="metric-lbl">Start Weight (kg)</div>
                                </div>

                                {/* Current Weight — same fallback */}
                                <div className="metric-card py-3">
                                    <div className="metric-val text-xl">
                                        {summary.weight_latest ?? '—'}
                                        {!summary.has_weight_logs && summary.weight_latest && (
                                            <span className="block text-[9px] font-semibold text-blue-500 uppercase tracking-wide mt-0.5">From Profile</span>
                                        )}
                                    </div>
                                    <div className="metric-lbl">Current Weight (kg)</div>
                                </div>

                                {/* 30-Day Change */}
                                <div className="metric-card py-3">
                                    <div className={`metric-val text-xl ${
                                        summary.weight_change > 0 ? 'text-red-500' :
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
                                <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl px-4 py-3 text-sm">
                                    <span className="text-blue-500 text-lg mt-0.5">💡</span>
                                    <div>
                                        <p className="font-semibold text-blue-800 dark:text-blue-300">Log your weight to track progress</p>
                                        <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
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
                                <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">⚖️ Weight Trend (30 Days)</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={logs}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} unit="kg" />
                                        <Tooltip formatter={(v) => [`${v} kg`, 'Weight']} />
                                        <Line type="monotone" dataKey="weight" stroke="#2d6a4f" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Calories Bar */}
                            <div className="card">
                                <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">🔥 Calories Consumed (30 Days)</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={logs}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip formatter={(v) => [`${v} kcal`, 'Calories']} />
                                        <Bar dataKey="calories_consumed" fill="#40916c" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Macro Breakdown (Premium/Admin) */}
                            <div className="card md:col-span-2 relative overflow-hidden">
                                <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4 flex items-center justify-between">
                                    <span>🥩 Macro Distribution History</span>
                                    {!isPremium && (
                                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">PREMIUM ONLY</span>
                                    )}
                                </h3>

                                {isPremium ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={logs}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 10 }} unit="g" />
                                            <Tooltip />
                                            <Legend verticalAlign="top" height={36} />
                                            <Bar dataKey="protein" stackId="a" fill="#2d6a4f" name="Protein (g)" />
                                            <Bar dataKey="carbs" stackId="a" fill="#40916c" name="Carbs (g)" />
                                            <Bar dataKey="fat" stackId="a" fill="#b7e4c7" name="Fat (g)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        </div>
                                        <p className="text-gray-900 dark:text-white font-bold">Macro Analytics Locked</p>
                                        <p className="text-gray-500 text-sm mb-6 px-12 text-center">Upgrade to Premium to visualize your protein, carb, and fat distribution over time.</p>
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
            <div className="card">
                <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-4">📝 Log Today's Progress</h2>
                <form onSubmit={handleLog} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="input-label">Date</label>
                            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" required />
                        </div>
                        <div>
                            <label className="input-label">Weight (kg)</label>
                            <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)}
                                className="input-field" placeholder="70.5" step="0.1" required />
                        </div>
                        <div>
                            <label className="input-label">Calories Consumed</label>
                            <input type="number" value={form.calories_consumed} onChange={e => set('calories_consumed', e.target.value)}
                                className="input-field" placeholder="2000" required />
                        </div>
                        <div>
                            <label className="input-label">Protein (g)</label>
                            <input type="number" value={form.protein} onChange={e => set('protein', e.target.value)}
                                className="input-field" placeholder="150" />
                        </div>
                        <div>
                            <label className="input-label">Carbs (g)</label>
                            <input type="number" value={form.carbs} onChange={e => set('carbs', e.target.value)}
                                className="input-field" placeholder="250" />
                        </div>
                        <div>
                            <label className="input-label">Fat (g)</label>
                            <input type="number" value={form.fat} onChange={e => set('fat', e.target.value)}
                                className="input-field" placeholder="70" />
                        </div>
                        <div>
                            <label className="input-label">Water Intake (L)</label>
                            <input type="number" value={form.water_intake_liters} onChange={e => set('water_intake_liters', e.target.value)}
                                className="input-field" placeholder="2.5" step="0.1" />
                        </div>
                        <div>
                            <label className="input-label">Steps</label>
                            <input type="number" value={form.steps} onChange={e => set('steps', e.target.value)}
                                className="input-field" placeholder="8000" />
                        </div>
                        <div>
                            <label className="input-label">Sleep Hours</label>
                            <input type="number" value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)}
                                className="input-field" placeholder="7" step="0.5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="workout" checked={form.workout_done}
                            onChange={e => set('workout_done', e.target.checked)}
                            className="w-4 h-4 accent-[#2d6a4f]" />
                        <label htmlFor="workout" className="text-sm font-medium text-gray-700">💪 Workout Done Today</label>
                    </div>
                    <div>
                        <label className="input-label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                            className="input-field" placeholder="How did you feel today?" rows={2} />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Saving...' : 'Log Progress ✅'}
                    </button>
                </form>
            </div>
        </div>
    )
}
