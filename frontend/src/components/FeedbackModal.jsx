import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Star, MessageSquarePlus, Sparkles, Smartphone, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../services/api'
import { getErrorMessage } from '../utils/errors'
import toast from 'react-hot-toast'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

const CATEGORIES = [
    { id: 'bug', label: 'Bug Report', icon: '🐞', color: 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
    { id: 'feature', label: 'Feature Request', icon: '💡', color: 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
    { id: 'accuracy', label: 'Meal Plan Accuracy', icon: '🥗', color: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
    { id: 'ui', label: 'Mobile / UI Issue', icon: '📱', color: 'border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800' },
    { id: 'general', label: 'General Feedback', icon: '💬', color: 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
]

export default function FeedbackModal({ isOpen, onClose, onSuccess, initialCategory = 'general' }) {
    useBodyScrollLock(isOpen)
    const [category, setCategory] = useState(initialCategory || 'general')
    const [rating, setRating] = useState(5)
    const [hoverRating, setHoverRating] = useState(0)
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true)

    const queryClient = useQueryClient()

    useEffect(() => {
        if (isOpen && initialCategory) {
            setCategory(initialCategory)
        }
    }, [isOpen, initialCategory])

    const mutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/feedback', payload)
            return res.data
        },
        onSuccess: (data) => {
            toast.success(data?.message || 'Feedback submitted! +10 HealthCoins earned!')
            queryClient.invalidateQueries({ queryKey: ['userFeedbacks'] })
            queryClient.invalidateQueries({ queryKey: ['walletBalance'] })
            queryClient.invalidateQueries({ queryKey: ['walletTransactions'] })
            setTitle('')
            setMessage('')
            setCategory('general')
            setRating(5)
            if (onSuccess) onSuccess()
            if (onClose) onClose()
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, 'Failed to submit feedback.'))
        }
    })

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!title.trim()) {
            toast.error('Please enter a brief summary / title.')
            return
        }
        if (!message.trim()) {
            toast.error('Please enter your feedback message.')
            return
        }

        const payload = {
            category,
            rating,
            title: title.trim(),
            message: message.trim(),
        }

        if (includeDeviceInfo) {
            payload.device_info = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screen: `${window.screen.width}x${window.screen.height}`,
                window: `${window.innerWidth}x${window.innerHeight}`,
                pixelRatio: window.devicePixelRatio,
                language: navigator.language,
                standalonePWA: window.matchMedia('(display-mode: standalone)').matches,
            }
        }

        mutation.mutate(payload)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="relative w-full max-w-lg bg-white dark:bg-[#0c241a] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn font-outfit"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
                            <MessageSquarePlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">Share Your Feedback</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Help us improve your nutrition journey</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Coin Reward Banner */}
                <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/70 dark:border-amber-900/40 flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-300">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Earn <strong className="font-bold">+10 HealthCoins</strong> on submitting feedback!</span>
                    </div>
                    <span className="text-[10px] bg-amber-200/70 dark:bg-amber-900/60 px-2 py-0.5 rounded-full font-black">REWARD</span>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Select Category
                        </label>
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
                            {CATEGORIES.map((cat) => {
                                 const isSelected = category === cat.id
                                return (
                                    <button
                                        type="button"
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`px-3 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all text-left ${
                                            isSelected 
                                                ? `${cat.color} ring-2 ring-emerald-500 shadow-sm font-black scale-[1.02]`
                                                : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <span className="text-base shrink-0">{cat.icon}</span>
                                        <span className="truncate">{cat.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Star Rating */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Your Rating
                        </label>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="p-1 text-slate-300 dark:text-slate-600 hover:scale-125 transition-transform"
                                    >
                                        <Star
                                            className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                                                (hoverRating || rating) >= star
                                                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                                    : 'text-slate-300 dark:text-slate-600'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:mt-1 sm:ml-2 text-center sm:text-left">
                                {rating === 5 && '⭐️⭐️⭐️⭐️⭐️ Outstanding'}
                                {rating === 4 && '⭐️⭐️⭐️⭐️ Good'}
                                {rating === 3 && '⭐️⭐️⭐️ Average'}
                                {rating === 2 && '⭐️⭐️ Needs Improvement'}
                                {rating === 1 && '⭐️ Poor'}
                            </span>
                        </div>
                    </div>

                    {/* Title Input */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Topic / Summary <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Login scroll bug on mobile, recipe request..."
                            maxLength={150}
                            required
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                    </div>

                    {/* Message Details */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Feedback Details <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Please tell us what went well, what we can improve, or steps to reproduce an issue..."
                            rows={4}
                            maxLength={2000}
                            required
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                        />
                        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                            <span>Be as specific as possible</span>
                            <span>{message.length}/2000</span>
                        </div>
                    </div>

                    {/* Diagnostic checkbox */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-start gap-3 cursor-pointer" onClick={() => setIncludeDeviceInfo(!includeDeviceInfo)}>
                        <input
                            type="checkbox"
                            checked={includeDeviceInfo}
                            onChange={(e) => setIncludeDeviceInfo(e.target.checked)}
                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <div className="text-xs">
                            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                Attach anonymous device specs
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                                Includes screen size &amp; browser to help our developers reproduce visual/mobile issues faster.
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            {mutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <span>Submit &amp; Earn +10 Coins</span>
                                    <span>✨</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
