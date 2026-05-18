import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Reports() {
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        api.get('/report/summary').then(({ data }) => setSummary(data)).finally(() => setLoading(false))
    }, [])

    async function downloadPDF() {
        setDownloading(true)
        try {
            const response = await api.get(`/report/pdf?date=${date}`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `diet_report_${date}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success('PDF downloaded! 📄')
        } catch {
            toast.error('Failed to generate PDF. Generate a meal plan for this date first.')
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="page-header">
                <h1 className="page-title">Reports</h1>
                <p className="page-subtitle">Download your personalized diet report as PDF</p>
            </div>

            {/* Stats Summary */}
            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="animate-spin w-8 h-8 border-4 border-[#2d6a4f] border-t-transparent rounded-full" />
                </div>
            ) : summary && (
                <>
                    <div className="card bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl">
                                👤
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{summary.user?.name}</h2>
                                <p className="text-white/70 text-sm">{summary.user?.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { val: Math.round(summary.profile?.bmi ?? 0) || '—', lbl: 'BMI' },
                            { val: Math.round(summary.profile?.calories_target ?? 0) || '—', lbl: 'Calorie Target' },
                            { val: summary.stats?.total_plans_generated, lbl: 'Meal Plans' },
                            { val: summary.stats?.workout_days, lbl: 'Workout Days' },
                        ].map(m => (
                            <div key={m.lbl} className="metric-card">
                                <div className="metric-val">{m.val}</div>
                                <div className="metric-lbl">{m.lbl}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* PDF Download Card */}
            <div className="card">
                <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-4">📄 Download Diet Report (PDF)</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Generates a complete PDF including your health metrics, meal plan for the selected date, and recent 7-day progress.
                </p>
                <div className="flex items-end gap-4 flex-wrap">
                    <div>
                        <label className="input-label">Report Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="input-field" style={{ maxWidth: 200 }} />
                    </div>
                    <button onClick={downloadPDF} disabled={downloading} className="btn-gold">
                        {downloading ? '⏳ Generating PDF...' : '⬇️ Download PDF Report'}
                    </button>
                </div>
            </div>

            {/* Tips */}
            <div className="card bg-green-50/60 border border-green-100">
                <h3 className="font-semibold text-[#2d6a4f] mb-3">💡 Health Tips</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                    {[
                        'Drink at least 2-3 liters of water per day.',
                        'Eat protein-rich foods at every meal to preserve muscle mass.',
                        'A 500 kcal daily deficit leads to approximately 0.5 kg of fat loss per week.',
                        'Getting 7-9 hours of quality sleep improves metabolism and reduces cravings.',
                        'Replace refined carbs (white bread, chips) with whole grains and makhana.',
                        'Track your progress consistently — small wins compound over time.',
                    ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-[#40916c] font-bold mt-0.5">•</span>
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
