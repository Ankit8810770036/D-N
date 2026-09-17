import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquarePlus, Star, Clock, CheckCircle2, Eye, Sparkles, Filter, AlertTriangle, ShieldCheck, HeartHandshake } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import FeedbackModal from '../components/FeedbackModal'
import api from '../services/api'

const CATEGORY_MAP = {
    bug: { label: 'Bug Report', icon: '🐞', badge: 'badge-rose bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
    feature: { label: 'Feature Request', icon: '💡', badge: 'badge-amber bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
    accuracy: { label: 'Meal Plan Accuracy', icon: '🥗', badge: 'badge-emerald bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' },
    ui: { label: 'Mobile / UI Issue', icon: '📱', badge: 'badge-sky bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900' },
    general: { label: 'General Feedback', icon: '💬', badge: 'badge-purple bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900' },
}

const STATUS_MAP = {
    pending: { label: 'Under Review', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
    reviewed: { label: 'Reviewed', icon: Eye, color: 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800' },
    resolved: { label: 'Resolved / Implemented', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' },
}

export default function FeedbackPage() {
    const { isAdmin } = useAuth()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('general')
    const [activeTab, setActiveTab] = useState('all')

    const { data: myFeedbacks, isLoading } = useQuery({
        queryKey: ['userFeedbacks'],
        queryFn: async () => {
            if (!isAdmin) return []
            try {
                const res = await api.get('/admin/feedbacks')
                return res.data
            } catch (err) {
                return []
            }
        },
        enabled: Boolean(isAdmin),
        retry: false,
    })

    return (
        <div className="space-y-8 pb-24 animate-fade-in font-outfit max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-700/20">
                            💬
                        </div>
                        <div>
                            <h1 className="page-title text-3xl">Feedback &amp; Suggestions</h1>
                            <p className="page-subtitle text-sm mt-0.5">Help us craft the most accurate and beautiful nutrition experience.</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-lg shadow-emerald-700/25 hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
                >
                    <MessageSquarePlus className="w-5 h-5" />
                    <span>Give Feedback (+10 🪙)</span>
                </button>
            </div>

            {/* Feature Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-400">
                        <HeartHandshake className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Community-Driven</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Your feedback directly drives our recipe additions, meal calculations, and bug fixes.
                        </p>
                    </div>
                </div>

                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 flex items-start gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-700 dark:text-amber-400">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Instant Token Rewards</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Every quality feedback submission awards +10 HealthCoins immediately to your wallet.
                        </p>
                    </div>
                </div>

                <div className="p-5 rounded-3xl bg-gradient-to-br from-sky-500/10 to-indigo-500/5 border border-sky-500/20 flex items-start gap-4">
                    <div className="p-3 bg-sky-500/20 rounded-2xl text-sky-700 dark:text-sky-400">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Transparent Triage</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            All feedback is reviewed by the engineering team with live status updates.
                        </p>
                    </div>
                </div>
            </div>

            {/* Feedback Categories Quick Cards */}
            <div className="card p-6 sm:p-8">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>What can you share with us today?</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(CATEGORY_MAP).map(([key, item]) => (
                        <button
                            key={key}
                            onClick={() => {
                                setSelectedCategory(key)
                                setIsModalOpen(true)
                            }}
                            className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-left transition-all hover:scale-[1.02] flex items-center gap-3.5 group"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {item.label}
                                </p>
                                <p className="text-xs text-slate-400">Click to submit {item.label.toLowerCase()}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Modal */}
            <FeedbackModal
                isOpen={isModalOpen}
                initialCategory={selectedCategory}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
