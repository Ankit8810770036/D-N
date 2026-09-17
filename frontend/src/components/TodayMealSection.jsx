import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Clock, Utensils, ChevronRight, ArrowRight, Zap, Flame, Sparkles, Check, CheckCircle2 } from 'lucide-react'

const MEAL_SCHEDULE = {
    breakfast: {
        label: 'Breakfast',
        icon: '🌅',
        timeWindow: '5:00 AM – 11:30 AM',
        tagline: 'Morning energizing nutrition',
    },
    lunch: {
        label: 'Lunch',
        icon: '☀️',
        timeWindow: '11:30 AM – 4:30 PM',
        tagline: 'Midday balanced nutrition',
    },
    snack: {
        label: 'Evening Snack',
        icon: '🫐',
        timeWindow: '4:30 PM – 7:30 PM',
        tagline: 'Afternoon healthy refreshment',
    },
    dinner: {
        label: 'Dinner',
        icon: '🌙',
        timeWindow: '7:30 PM – 5:00 AM',
        tagline: 'Nutritious dinner to end your day',
    },
}

function getActiveMealKey() {
    const now = new Date()
    const decimalHour = now.getHours() + now.getMinutes() / 60

    if (decimalHour >= 5.0 && decimalHour < 11.5) return 'breakfast'
    if (decimalHour >= 11.5 && decimalHour < 16.5) return 'lunch'
    if (decimalHour >= 16.5 && decimalHour < 19.5) return 'snack'
    // 7:30 PM to 4:59 AM is Dinner / Late evening
    return 'dinner'
}

export default function TodayMealSection({ plan, localToday, profile }) {
    const queryClient = useQueryClient()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [selectedSlot, setSelectedSlot] = useState(null)

    // Update live clock every 30 seconds
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000)
        return () => clearInterval(timer)
    }, [])

    const liveActiveKey = useMemo(() => getActiveMealKey(), [currentTime])
    const currentViewKey = selectedSlot || liveActiveKey
    const activeMeal = MEAL_SCHEDULE[currentViewKey] || MEAL_SCHEDULE.breakfast
    const items = plan?.meals?.[currentViewKey] ?? []

    // Calculate calories & macros for the current active meal
    const totalCalories = useMemo(() => {
        return items.reduce((sum, item) => {
            return sum + Number(item.calories || item.food?.calories || item.recipe?.calories || 0)
        }, 0)
    }, [items])

    // Toggle consumption directly from Dashboard
    const toggleMutation = useMutation({
        mutationFn: async (itemId) => {
            const res = await api.put(`/meal-item/${itemId}/consume`)
            return res.data
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Meal updated! ✅')
            queryClient.invalidateQueries({ queryKey: ['mealPlan', localToday] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            queryClient.invalidateQueries({ queryKey: ['tokens'] })
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to update meal consumption status.')
        }
    })

    // 1-Click meal plan generation if missing
    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/generate-plan', { date: localToday })
            return res.data
        },
        onSuccess: () => {
            toast.success("Today's AI meal plan generated successfully! 🥗")
            queryClient.invalidateQueries({ queryKey: ['mealPlan', localToday] })
            queryClient.invalidateQueries({ queryKey: ['groceryList'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to generate meal plan. Please check your health profile.')
        }
    })

    // If no plan exists for today
    if (!plan) {
        return (
            <div className="card w-full min-w-0 flex flex-col justify-between p-6 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-slate-50 dark:to-[#0c241a] border border-emerald-500/20">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                            🍽️
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-white text-base">Current Meal Slot</h2>
                            <p className="text-[11px] text-slate-400 font-medium">Based on your local time</p>
                        </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="py-6 flex flex-col items-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-2xl shadow-md shadow-emerald-700/10">
                        {activeMeal.icon}
                    </div>
                    <div className="space-y-1 max-w-sm">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            {activeMeal.label} ({activeMeal.timeWindow})
                        </p>
                        <h3 className="font-black text-slate-800 dark:text-white text-base">
                            No Meal Plan Generated for Today
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Generate your personalized meals for today based on your health metrics.
                        </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending}
                            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            {generateMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Generating Plan...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 fill-current" />
                                    <span>Generate Today's Plan</span>
                                </>
                            )}
                        </button>
                        <Link
                            to="/planner"
                            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <span>Open Planner</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="card w-full min-w-0 flex flex-col justify-between p-5 sm:p-6">
            {/* Top Bar: Live Meal Status + Clock */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-base shadow-sm shrink-0">
                        🍽️
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                                Current Meal
                            </h2>
                            {currentViewKey === liveActiveKey && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                    ACTIVE NOW
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            Live time-based meal tracker
                        </p>
                    </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shrink-0 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {/* Meal Slot Switcher Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-gray-800/80 rounded-2xl mb-3">
                {Object.entries(MEAL_SCHEDULE).map(([key, config]) => {
                    const isSelected = key === currentViewKey
                    const isLive = key === liveActiveKey
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedSlot(key)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 relative ${
                                isSelected
                                    ? 'bg-white dark:bg-[#0c241a] text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-500/30'
                                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <span>{config.icon}</span>
                            <span className="truncate text-[11px] sm:text-xs">{config.label.split(' ')[0]}</span>
                            {isLive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" title="Active meal time" />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Current Ongoing Meal Spotlight Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 dark:to-[#0c241a] border border-emerald-500/20 space-y-4">
                {/* Meal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#081c15] shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center text-2xl shrink-0">
                            {activeMeal.icon}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg truncate">
                                {activeMeal.label}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                                {activeMeal.timeWindow} · {activeMeal.tagline}
                            </p>
                        </div>
                    </div>

                    {/* Total Calories Badge */}
                    <div className="px-3 py-1.5 rounded-2xl bg-white dark:bg-[#081c15] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-white shrink-0 self-start sm:self-auto">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>{Math.round(totalCalories)} kcal</span>
                    </div>
                </div>

                {/* Items List */}
                {items.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 italic">
                        No food items planned for {activeMeal.label.toLowerCase()} yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item, idx) => {
                            const name = item.recipe ? item.recipe.name : item.food?.name
                            const calories = item.calories || item.food?.calories || item.recipe?.calories || 0
                            const serving = item.serving_size_g ? `${item.serving_size_g}g` : (item.quantity ? `${item.quantity} ${item.unit || 'serving'}` : '')
                            const isConsumed = !!item.is_consumed

                            return (
                                <div
                                    key={item.id || idx}
                                    className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all shadow-2xs ${
                                        isConsumed
                                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40 opacity-80'
                                            : 'bg-white/90 dark:bg-[#081c15]/90 border-slate-200/70 dark:border-white/10 hover:border-emerald-500/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => item.id && toggleMutation.mutate(item.id)}
                                            disabled={toggleMutation.isPending || !item.id}
                                            title={isConsumed ? 'Mark as not eaten' : 'Mark as eaten'}
                                            className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                                                isConsumed
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : 'border-2 border-slate-300 dark:border-gray-600 hover:border-emerald-500 bg-transparent'
                                            }`}
                                        >
                                            {isConsumed && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                        <div className="min-w-0">
                                            <p className={`text-xs sm:text-sm font-bold truncate ${isConsumed ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                                {name}
                                            </p>
                                            {serving && (
                                                <p className="text-[11px] text-slate-400">
                                                    Portion: {serving}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <span className={`text-xs font-bold shrink-0 px-2.5 py-1 rounded-xl ${
                                        isConsumed
                                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-green-400'
                                    }`}>
                                        {calories} kcal
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Footer Action */}
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-200/50 dark:border-white/10">
                    <span className="text-slate-400 font-medium">
                        {items.length} item{items.length !== 1 ? 's' : ''} in this meal
                    </span>
                    <Link
                        to="/planner"
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 group"
                    >
                        <span>View Full 7-Day Plan</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
