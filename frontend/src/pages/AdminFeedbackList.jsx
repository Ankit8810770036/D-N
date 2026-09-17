import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, ArrowLeft, Star, Trash2, CheckCircle, Clock, Eye, AlertCircle, Smartphone, Filter, User, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { getErrorMessage } from '../utils/errors'
import toast from 'react-hot-toast'

const CATEGORY_MAP = {
    bug: { label: 'Bug Report', icon: '🐞', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
    feature: { label: 'Feature Request', icon: '💡', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
    accuracy: { label: 'Meal Accuracy', icon: '🥗', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' },
    ui: { label: 'Mobile / UI Issue', icon: '📱', badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900' },
    general: { label: 'General', icon: '💬', badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900' },
}

export default function AdminFeedbackList() {
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [expandedFeedbackId, setExpandedFeedbackId] = useState(null)
    const queryClient = useQueryClient()

    const { data: rawData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['adminFeedbacks', selectedCategory, selectedStatus],
        queryFn: async () => {
            const params = {}
            if (selectedCategory !== 'all') params.category = selectedCategory
            if (selectedStatus !== 'all') params.status = selectedStatus
            const res = await api.get('/admin/feedbacks', { params })
            return res.data
        },
    })

    // Handle array or paginated response safely
    const feedbackList = Array.isArray(rawData) 
        ? rawData 
        : (rawData?.feedbacks?.data || rawData?.feedbacks || rawData?.data || [])

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const res = await api.put(`/admin/feedbacks/${id}`, { status })
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminFeedbacks'] })
            toast.success('Feedback status updated!')
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, 'Failed to update feedback status.'))
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/admin/feedbacks/${id}`)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminFeedbacks'] })
            toast.success('Feedback deleted.')
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, 'Failed to delete feedback.'))
        }
    })

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this feedback item?')) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <div className="space-y-6 pb-20 animate-fade-in font-outfit max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </Link>
                    <div className="page-header mb-0">
                        <h1 className="page-title text-3xl">User Feedback Triage</h1>
                        <p className="page-subtitle text-sm mt-0">Review ratings, bug reports, and suggestions from real users</p>
                    </div>
                </div>
                <div className="badge badge-green flex items-center gap-2 px-4 py-2 self-start sm:self-auto">
                    <MessageSquare className="w-4 h-4" />
                    <span>{feedbackList.length} Submissions</span>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" /> Category:
                    </span>
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            selectedCategory === 'all'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                    >
                        All
                    </button>
                    {Object.entries(CATEGORY_MAP).map(([key, item]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                selectedCategory === key
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="select-sm"
                    >
                        <option value="all">⚡ All Statuses</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="reviewed">👀 Reviewed</option>
                        <option value="resolved">✅ Resolved</option>
                    </select>
                </div>
            </div>

            {/* Content List */}
            {isLoading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card h-32" />
                    ))}
                </div>
            ) : isError ? (
                <div className="card text-center py-12 space-y-3">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">Failed to load feedback list</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">{getErrorMessage(error, 'An unexpected error occurred while loading feedback.')}</p>
                    <button onClick={() => refetch()} className="btn-primary mx-auto text-xs flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                    </button>
                </div>
            ) : feedbackList.length === 0 ? (
                <div className="card text-center py-16">
                    <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">No feedback submissions found</h3>
                    <p className="text-xs text-slate-400 mt-1">Users haven't submitted any feedback matching these filter criteria yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedbackList.map((item) => {
                        const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.general
                        const isExpanded = expandedFeedbackId === item.id

                        return (
                            <div
                                key={item.id}
                                className="card p-5 sm:p-6 transition-all hover:border-emerald-500/30"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Category Badge */}
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${cat.badge}`}>
                                                <span>{cat.icon}</span>
                                                <span>{cat.label}</span>
                                            </span>

                                            {/* Rating Stars */}
                                            <div className="flex items-center gap-0.5 px-2 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className={`w-3.5 h-3.5 ${
                                                            item.rating >= s
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'text-slate-300 dark:text-slate-600'
                                                        }`}
                                                    />
                                                ))}
                                                <span className="ml-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                                    {item.rating}/5
                                                </span>
                                            </div>

                                            {/* Time */}
                                            <span className="text-[11px] text-slate-400">
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            {item.title}
                                        </h3>

                                        {/* Message */}
                                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {item.message}
                                        </p>

                                        {/* Submitter User Info */}
                                        <div className="flex items-center gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                                                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                <span>{item.user?.name || 'Anonymous User'}</span>
                                            </div>
                                            <span>•</span>
                                            <span>{item.user?.email || 'No email'}</span>
                                        </div>

                                        {/* Device Info Accordion */}
                                        {item.device_info && (
                                            <div className="pt-2">
                                                <button
                                                    onClick={() => setExpandedFeedbackId(isExpanded ? null : item.id)}
                                                    className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1"
                                                >
                                                    <Smartphone className="w-3 h-3" />
                                                    {isExpanded ? 'Hide Device Diagnostics' : 'View Device Diagnostics'}
                                                </button>

                                                {isExpanded && (
                                                    <pre className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-950 text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-white/10">
                                                        {JSON.stringify(item.device_info, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons / Status Change */}
                                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-white/10">
                                        <select
                                            value={item.status}
                                            onChange={(e) => statusMutation.mutate({ id: item.id, status: e.target.value })}
                                            disabled={statusMutation.isPending}
                                            className={`select-sm border text-xs font-bold transition-all ${
                                                item.status === 'resolved'
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                    : item.status === 'reviewed'
                                                    ? 'bg-sky-50 border-sky-300 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300'
                                                    : 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                            }`}
                                        >
                                            <option value="pending">⏳ Pending</option>
                                            <option value="reviewed">👀 Reviewed</option>
                                            <option value="resolved">✅ Resolved</option>
                                        </select>

                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deleteMutation.isPending}
                                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                            title="Delete Feedback"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
