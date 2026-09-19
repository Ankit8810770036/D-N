import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BarcodeScanner from '../components/BarcodeScanner'
import { Scan, Lock, Sparkles, Calendar, Zap, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

const mealIcons = { breakfast: '🌅', lunch: '☀️', snack: '🫐', dinner: '🌙' }
const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }
const mealDescriptions = {
    breakfast: 'Poha, Idli Sambhar, Moong Chilla, Eggs Bhurji, Oats & Fresh Fruits',
    lunch: 'Balanced Thali: Phulkas / Basmati Rice + Dal / Paneer / Chicken + Sabzi',
    snack: 'Roasted Makhana, Bhuna Chana, Sprouts Chaat, Chaas & Green Tea',
    dinner: 'Light & Nutritious: Rotis / Khichdi + Dal / Soya / Paneer + Salad'
}

export default function Planner() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const { user, isAdmin } = useAuth()
    const isPremium = user?.plan_type === 'premium' || isAdmin
    const [loading, setLoading] = useState(false)
    const [aiWeeklyLoading, setAiWeeklyLoading] = useState(false)
    const [showAiWeeklyModal, setShowAiWeeklyModal] = useState(false)
    const [date, setDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0])
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [showCustomFoodModal, setShowCustomFoodModal] = useState(false)
    
    useBodyScrollLock(showAiWeeklyModal || showCustomFoodModal)
    const [customFoodForm, setCustomFoodForm] = useState({
        name: '', calories: '', protein: '', carbs: '', fat: '',
        is_veg: true, is_vegan: false, is_jain: false
    })

    const todayStr = useMemo(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], [])
    
    // Limits: Past 30 days and Future 30 days (1 month)
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

    const isPastDate = date < todayStr

    const { data: profileData } = useQuery({
        queryKey: ['profile'],
        queryFn: () => api.get('/profile').then(res => res.data?.data || res.data).catch(() => null),
    })

    const { data: plan, isPending: fetching, refetch: fetchPlan } = useQuery({
        queryKey: ['mealPlan', date],
        queryFn: () => api.get(`/meal-plan?date=${date}`).then(res => res.data).catch(() => null),
    })

    // Compute 7-day strip around currently selected date (bounded to [minDate, maxDate])
    const weekDays = useMemo(() => {
        const list = []
        const base = new Date(date)
        for (let i = -2; i <= 4; i++) {
            const d = new Date(base)
            d.setDate(base.getDate() + i)
            const dateStr = d.toISOString().split('T')[0]
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
            const dayNum = d.getDate()
            const isToday = dateStr === todayStr
            const isPast = dateStr < todayStr
            const isOutOfRange = dateStr < minDate || dateStr > maxDate
            list.push({ dateStr, dayName, dayNum, isToday, isPast, isOutOfRange })
        }
        return list
    }, [date, todayStr, minDate, maxDate])

    async function generatePlan() {
        if (isPastDate) {
            toast.error('Meal plans cannot be generated for past dates. Please select today or a future date.')
            return
        }
        setLoading(true)
        try {
            await api.post('/generate-plan', { date })
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
            queryClient.invalidateQueries({ queryKey: ['groceryList'] })
            queryClient.invalidateQueries({ queryKey: ['grocery-list'] })
            toast.success(`Meal plan generated for ${date}! 🍽️`)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate plan.')
        } finally {
            setLoading(false)
        }
    }

    async function generateAiWeeklyPlan() {
        const targetStartDate = date < todayStr ? todayStr : date
        setAiWeeklyLoading(true)
        try {
            const res = await api.post('/generate-ai-weekly-plan', { start_date: targetStartDate })
            if (date < todayStr) {
                setDate(todayStr)
            }
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
            queryClient.invalidateQueries({ queryKey: ['groceryList'] })
            queryClient.invalidateQueries({ queryKey: ['grocery-list'] })
            toast.success(res.data?.message || '7-Day AI Weekly Meal Plan generated successfully! 🥗', { duration: 4500 })
            setShowAiWeeklyModal(false)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate AI Weekly Plan.')
        } finally {
            setAiWeeklyLoading(false)
        }
    }

    async function swapItem(itemId) {
        try {
            toast.loading('Swapping ingredient...', { id: 'swap' });
            await api.put(`/meal-item/${itemId}/swap`);
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] });
            queryClient.invalidateQueries({ queryKey: ['groceryList'] });
            queryClient.invalidateQueries({ queryKey: ['grocery-list'] });
            toast.success('Swapped perfectly! 🔄', { id: 'swap' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Swap failed.', { id: 'swap' });
        }
    }

    async function toggleConsumed(itemId) {
        if (isPastDate) {
            toast('Past meal records are locked and read-only.', {
                icon: '🔒',
                id: 'past-lock',
            });
            return;
        }

        await queryClient.cancelQueries({ queryKey: ['mealPlan', date] });
        const previousPlan = queryClient.getQueryData(['mealPlan', date]);

        let willBeConsumed = true;
        let itemName = 'Meal';

        if (previousPlan && previousPlan.meals) {
            queryClient.setQueryData(['mealPlan', date], old => {
                if (!old || !old.meals) return old;
                const newMeals = {};
                for (const type in old.meals) {
                    newMeals[type] = old.meals[type].map(item => {
                        if (String(item.id) === String(itemId)) {
                            willBeConsumed = !item.is_consumed;
                            itemName = item.recipe?.name || item.food?.name || item.name || 'Meal';
                            return { ...item, is_consumed: !item.is_consumed };
                        }
                        return item;
                    });
                }
                return { ...old, meals: newMeals };
            });
        }

        // Instant responsive toast without network round-trip delay
        const toastId = `meal-${itemId}`;
        toast.success(willBeConsumed ? `Marked ${itemName} as consumed ✅` : `Unmarked ${itemName}`, {
            id: toastId,
            duration: 2000,
        });

        try {
            await api.put(`/meal-item/${itemId}/consume`);
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        } catch (err) {
            if (previousPlan) {
                queryClient.setQueryData(['mealPlan', date], previousPlan);
            }
            toast.error(err.response?.data?.message || 'Failed to update.', { id: toastId, duration: 2000 });
        }
    }

    async function handleAddCustomFood(e) {
        e.preventDefault()
        // Guard on the frontend too — saves a round-trip for free users
        if (!isPremium) {
            toast.error('Upgrade to Premium to add custom foods! ⭐', { duration: 2000 })
            setShowCustomFoodModal(false)
            navigate('/subscription')
            return
        }
        setLoading(true)
        try {
            await api.post('/foods', customFoodForm)
            toast.success('Custom food added! 🎉', { duration: 2000 })
            setShowCustomFoodModal(false)
            setCustomFoodForm({ name: '', calories: '', protein: '', carbs: '', fat: '', is_veg: true, is_vegan: false, is_jain: false })
            queryClient.invalidateQueries({ queryKey: ['foods'] })
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.premium_required) {
                toast.error('This feature requires a Premium subscription. Upgrade now! ⭐', { duration: 2000 })
                setShowCustomFoodModal(false)
                navigate('/subscription')
            } else {
                toast.error(err.response?.data?.message || 'Failed to add custom food.', { duration: 2000 })
            }
        } finally {
            setLoading(false)
        }
    }

    const handleScannerDetected = (productData, wasLogged = false) => {
        if (wasLogged) {
            // Already logged and compensated via the scanner confirmation card
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
            queryClient.invalidateQueries({ queryKey: ['progress'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            return
        }

        setCustomFoodForm({
            name: productData.name || '',
            calories: productData.calories !== undefined ? String(Math.round(productData.calories)) : '',
            protein: productData.protein !== undefined ? String(Math.round(productData.protein)) : '',
            carbs: productData.carbs !== undefined ? String(Math.round(productData.carbs)) : '',
            fat: productData.fat !== undefined ? String(Math.round(productData.fat)) : '',
            is_veg: productData.is_veg !== undefined ? productData.is_veg : true,
            is_vegan: productData.is_vegan || false,
            is_jain: false
        })
        setShowCustomFoodModal(true)
    }

    return (
        <div className="space-y-6 w-full pb-10 animate-fade-in">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <span>Diet Planner</span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                            Slot-Balanced 🥗
                        </span>
                    </h1>
                    <p className="page-subtitle">AI-powered meal plans with strict authentic slot balance (Breakfast, Lunch, Snacks, Dinner)</p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto">
                    <button
                        onClick={() => setShowAiWeeklyModal(true)}
                        className="h-11 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap active:scale-95"
                    >
                        <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                        <span>Generate AI Weekly Plan</span>
                    </button>
                    <button
                        onClick={() => setShowCustomFoodModal(true)}
                        className="h-11 px-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 text-orange-600 dark:text-orange-400 rounded-xl font-bold text-xs sm:text-sm hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap active:scale-95"
                    >
                        <span className="shrink-0">🍎</span>
                        <span>Add Custom Food</span>
                        {!isPremium && <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0" title="Premium feature" />}
                    </button>
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="h-11 px-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs sm:text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap active:scale-95"
                    >
                        <Scan className="w-4 h-4 shrink-0" />
                        <span>Scan Barcode</span>
                    </button>
                </div>
            </div>

            {/* 7-Day Quick Strip Navigator */}
            <div className="card p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'long' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                if (date <= minDate) return
                                const prev = new Date(date)
                                prev.setDate(prev.getDate() - 1)
                                setDate(prev.toISOString().split('T')[0])
                            }}
                            disabled={date <= minDate}
                            className={`p-1.5 rounded-xl transition-colors ${
                                date <= minDate
                                    ? 'text-slate-300 dark:text-white/20 cursor-not-allowed'
                                    : 'text-slate-500 hover:bg-slate-100 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white'
                            }`}
                            title={date <= minDate ? 'Limited to past 30 days' : 'Previous Day'}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0])}
                            className="px-3 py-1 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => {
                                if (date >= maxDate) return
                                const next = new Date(date)
                                next.setDate(next.getDate() + 1)
                                setDate(next.toISOString().split('T')[0])
                            }}
                            disabled={date >= maxDate}
                            className={`p-1.5 rounded-xl transition-colors ${
                                date >= maxDate
                                    ? 'text-slate-300 dark:text-white/20 cursor-not-allowed'
                                    : 'text-slate-500 hover:bg-slate-100 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white'
                            }`}
                            title={date >= maxDate ? 'Limited to 30 days in advance' : 'Next Day'}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                    {weekDays.map((d) => {
                        const isSelected = d.dateStr === date
                        return (
                            <button
                                key={d.dateStr}
                                onClick={() => !d.isOutOfRange && setDate(d.dateStr)}
                                disabled={d.isOutOfRange}
                                className={`py-2.5 px-1.5 rounded-2xl text-center transition-all duration-200 flex flex-col items-center justify-center border ${
                                    d.isOutOfRange
                                        ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'
                                        : isSelected
                                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/25 dark:shadow-[0_0_20px_rgba(16,185,129,0.3)] font-bold scale-[1.03] border-emerald-500/50 dark:border-emerald-400'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/60 hover:border-slate-300 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/80 dark:border-white/10 dark:hover:border-white/20'
                                }`}
                            >
                                <span className={`text-[11px] uppercase tracking-wider font-semibold ${isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-white/40'}`}>
                                    {d.dayName}
                                </span>
                                <span className="text-sm sm:text-base font-black leading-tight mt-0.5">
                                    {d.dayNum}
                                </span>
                                {d.isToday && (
                                    <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white shadow-[0_0_6px_white]' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'}`} />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Quick Actions & Date Input */}
            <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <label className="input-label text-xs mb-0">Jump to Date</label>
                            {isPastDate && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" /> Past History (Read-Only)
                                </span>
                            )}
                        </div>
                        <input
                            type="date"
                            min={minDate}
                            max={maxDate}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="input-field py-1.5 text-sm"
                            style={{ maxWidth: 180 }}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={generatePlan}
                        disabled={loading || aiWeeklyLoading || isPastDate}
                        className={`btn-secondary whitespace-nowrap flex items-center gap-1.5 py-2 px-4 text-sm ${isPastDate ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-gray-800 text-slate-400' : ''}`}
                        title={isPastDate ? 'Cannot generate meal plans for past dates' : 'Generate single day meal plan'}
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" /> : isPastDate ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : '✨'}
                        <span>{loading ? 'Generating...' : isPastDate ? 'Past Date (Read Only)' : 'Re-generate Single Day'}</span>
                    </button>
                </div>
            </div>

            {/* Summary Row */}
            {plan?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                        { val: `${Math.round(plan.summary.calories_target)} kcal`, lbl: 'Daily Target' },
                        { val: `${Math.round(plan.summary.protein_g)}g`, lbl: 'Protein Target' },
                        { val: `${Math.round(plan.summary.carbs_g)}g`, lbl: 'Carbs Target' },
                        { val: `${Math.round(plan.summary.fat_g)}g`, lbl: 'Healthy Fats' },
                        { val: `${plan.summary.water_intake_liters}L`, lbl: 'Hydration Target' },
                    ].map(m => (
                        <div key={m.lbl} className="metric-card py-3">
                            <div className="metric-val text-lg sm:text-xl text-slate-800 dark:text-white font-extrabold">{m.val}</div>
                            <div className="metric-lbl text-xs">{m.lbl}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Meals */}
            {fetching ? (
                <div className="grid md:grid-cols-2 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                <div className="ml-auto w-16 h-5 rounded-full bg-gray-100 dark:bg-gray-700"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-[68px] bg-slate-100 dark:bg-white/5 rounded-2xl"></div>
                                <div className="h-[68px] bg-slate-100 dark:bg-white/5 rounded-2xl"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : plan?.meals ? (
                <div className="grid md:grid-cols-2 gap-5">
                    {['breakfast', 'lunch', 'snack', 'dinner'].map(type => {
                        const items = plan.meals[type] ?? []
                        const totalCalories = items.reduce((s, i) => s + Number(i.calories), 0)
                        return (
                            <div key={type} className="card flex flex-col justify-between hover:border-emerald-300/60 dark:hover:border-emerald-500/40 transition-all shadow-sm">
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-white/10">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-2xl p-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-transparent dark:border-white/10">{mealIcons[type]}</span>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{mealLabels[type]}</h3>
                                                <p className="text-[11px] text-slate-400 dark:text-white/50 font-medium">{mealDescriptions[type]}</p>
                                            </div>
                                        </div>
                                        {items.length > 0 && (
                                            <span className="badge badge-green text-xs font-bold shrink-0">
                                                {Math.round(totalCalories)} kcal
                                            </span>
                                        )}
                                    </div>
                                    {items.length > 0 ? (
                                        <div className="space-y-2.5">
                                            {items.map((item, idx) => {
                                                const isConsumed = Boolean(item.is_consumed);
                                                return (
                                                    <div 
                                                        key={item.id || idx} 
                                                        onClick={() => {
                                                            if (isPastDate) {
                                                                toast('Past meal records are locked and read-only.', { icon: '🔒', id: 'past-lock' });
                                                            } else {
                                                                toggleConsumed(item.id);
                                                            }
                                                        }}
                                                        className={`flex items-center justify-between p-3 rounded-2xl group transition-all border select-none ${
                                                            isPastDate ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'
                                                        } ${
                                                            isConsumed 
                                                                ? 'bg-emerald-50/90 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700/60 shadow-xs' 
                                                                : 'bg-slate-50/80 border-slate-200/60 hover:border-emerald-300 dark:bg-white/5 dark:border-white/10 dark:hover:border-white/20'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <button
                                                                type="button"
                                                                disabled={isPastDate}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (isPastDate) {
                                                                        toast('Past meal records are locked and read-only.', { icon: '🔒', id: 'past-lock' });
                                                                    } else {
                                                                        toggleConsumed(item.id);
                                                                    }
                                                                }}
                                                                aria-checked={isConsumed}
                                                                role="checkbox"
                                                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 border ${
                                                                    isPastDate
                                                                        ? isConsumed
                                                                            ? 'bg-emerald-600/80 border-emerald-600/80 text-white cursor-not-allowed'
                                                                            : 'border-slate-300/60 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                                                                        : isConsumed
                                                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs shadow-emerald-700/30'
                                                                            : 'border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 hover:border-emerald-500'
                                                                }`}
                                                                title={isPastDate ? 'Past date — read-only history' : (isConsumed ? 'Mark as not consumed' : 'Mark as consumed')}
                                                            >
                                                                {isConsumed ? (
                                                                    <Check className="w-4 h-4 stroke-[3] text-white" />
                                                                ) : isPastDate ? (
                                                                    <Lock className="w-3 h-3 text-slate-400 dark:text-white/40" />
                                                                ) : null}
                                                            </button>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <p className={`text-sm font-semibold transition-all ${isConsumed ? 'line-through text-slate-400 dark:text-white/40' : 'text-slate-800 dark:text-white/90'}`}>
                                                                        {item.recipe ? item.recipe.name : item.food?.name}
                                                                    </p>
                                                                    {item.recipe && <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">Recipe</span>}
                                                                    {isPastDate && (
                                                                        <span className="text-[9px] bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-slate-300 px-1.5 py-0.2 rounded font-medium">
                                                                            {isConsumed ? 'Consumed' : 'Skipped'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5 font-medium">
                                                                    {item.recipe ? '1 serving' : `${item.quantity}${item.unit}`} &nbsp;·&nbsp;
                                                                    P:{Math.round(item.protein)}g C:{Math.round(item.carbs)}g F:{Math.round(item.fat)}g
                                                                </p>
                                                            </div>
                                                        </div>
                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                        {!item.is_consumed && !isPastDate && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    swapItem(item.id);
                                                                }}
                                                                className="p-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white hover:bg-slate-100 dark:bg-black/40 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95"
                                                                title="Swap with another item in this category"
                                                                aria-label="Swap food item"
                                                            >
                                                                <RefreshCw className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <span className={`text-sm font-bold ${item.is_consumed ? 'text-emerald-600' : 'text-emerald-700 dark:text-emerald-400'}`}>{item.calories} kcal</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 dark:text-white/40 italic py-4 text-center">No items added to this meal slot</p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="card flex flex-col items-center py-12 gap-3 text-center">
                    <span className="text-5xl">{isPastDate ? '📜' : '🍽️'}</span>
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                        {isPastDate ? `No historical diet log for ${date}` : `No meal plan for ${date}`}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                        {isPastDate
                            ? 'Meal plans cannot be generated for past dates. You can navigate to today or future dates to generate new meal plans.'
                            : 'Click "Generate AI Weekly Plan" to build a full 7-day clinical schedule, or "Re-generate Single Day" for this specific date.'}
                    </p>
                    {isPastDate ? (
                        <button
                            onClick={() => setDate(todayStr)}
                            className="btn-primary mt-2 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold"
                        >
                            <Calendar className="w-4 h-4" />
                            <span>Go to Today</span>
                        </button>
                    ) : (
                        <button
                            onClick={generatePlan}
                            disabled={loading || aiWeeklyLoading}
                            className="btn-primary mt-2"
                        >
                            {loading ? '⏳ Generating...' : '✨ Generate Single Day Plan'}
                        </button>
                    )}
                </div>
            )}

            {/* AI Weekly Generation Modal */}
            {showAiWeeklyModal && (
                <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
                    <div className="bg-white dark:bg-[#071f15] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto relative border border-slate-200 dark:border-white/20">
                        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white text-center relative">
                            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner border border-white/20">
                                🥗
                            </div>
                            <h3 className="text-xl font-black">7-Day AI Weekly Meal Planner</h3>
                            <p className="text-emerald-100 text-xs mt-1">Powered by MetriBot Clinical Intelligence</p>
                            <button
                                onClick={() => setShowAiWeeklyModal(false)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white text-xl p-1 font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Profile Metrics Snapshot */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-sm space-y-2">
                                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-white/50">
                                    <span>YOUR ACTIVE HEALTH METRICS</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ Calibrated</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div>
                                        <p className="text-xs text-slate-400">Target Calories</p>
                                        <p className="font-bold text-slate-800 dark:text-white">{profileData?.calories_target ?? plan?.summary?.calories_target ?? 2000} kcal/day</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Dietary Preference</p>
                                        <p className="font-bold text-slate-800 dark:text-white capitalize">{profileData?.food_preference ?? 'Vegetarian'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Primary Goal</p>
                                        <p className="font-bold text-slate-800 dark:text-white capitalize">{profileData?.goal ?? 'Maintain Weight'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Medical Safeguards</p>
                                        <p className="font-bold text-slate-800 dark:text-white">
                                            {profileData?.diseases?.length ? profileData.diseases.join(', ') : 'General Wellness'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="input-label text-xs">Start Date for 7-Day Plan</label>
                                <input
                                    type="date"
                                    min={todayStr}
                                    max={maxDate}
                                    value={date < todayStr ? todayStr : date}
                                    onChange={e => setDate(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-500 dark:text-gray-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                <p className="font-semibold text-emerald-800 dark:text-emerald-300">What MetriBot will create:</p>
                                <p>• 7 distinct days with authentic Indian regional meal variety</p>
                                <p>• Strict Indian slot compliance (Poha/Chilla/Idli/Eggs for Breakfast, Makhana/Sprouts for Snacks, Thalis for Lunch &amp; Dinner)</p>
                                <p>• Immediate synchronization with your 7-Day Indian Grocery List</p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAiWeeklyModal(false)}
                                    className="btn-secondary flex-1"
                                    disabled={aiWeeklyLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={generateAiWeeklyPlan}
                                    disabled={aiWeeklyLoading}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold"
                                >
                                    {aiWeeklyLoading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Building 7 Days...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            <span>Generate 7-Day Plan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Food Modal */}
            {showCustomFoodModal && (
                <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-[#0d2b1f] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto relative border border-slate-200 dark:border-white/10">
                        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white/90">🍎 Add Custom Food</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Add to your personal database for AI planning.</p>
                            </div>
                            <button onClick={() => setShowCustomFoodModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold p-2 text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleAddCustomFood}>
                            {!isPremium && (
                                <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-start gap-2 text-sm">
                                    <span className="text-amber-500 mt-0.5">⭐</span>
                                    <div>
                                        <p className="font-semibold text-amber-800 dark:text-amber-300">Premium Feature</p>
                                        <p className="text-amber-700 dark:text-amber-400/90 text-xs mt-0.5">Adding custom foods requires a Premium plan. <button type="button" onClick={() => { setShowCustomFoodModal(false); navigate('/subscription') }} className="underline font-bold hover:text-amber-900 dark:hover:text-amber-200">Upgrade now →</button></p>
                                    </div>
                                </div>
                            )}
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="input-label">Food Name</label>
                                    <input type="text" value={customFoodForm.name} onChange={e => setCustomFoodForm({ ...customFoodForm, name: e.target.value })}
                                        className="input-field" placeholder="e.g. Paneer Bhurji / Oats Smoothie (200g)" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="input-label">Calories (kcal)</label>
                                        <input type="number" value={customFoodForm.calories} onChange={e => setCustomFoodForm({ ...customFoodForm, calories: e.target.value })}
                                            className="input-field" placeholder="e.g. 250 kcal" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Protein (g)</label>
                                        <input type="number" value={customFoodForm.protein} onChange={e => setCustomFoodForm({ ...customFoodForm, protein: e.target.value })}
                                            className="input-field" placeholder="e.g. 18g" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Carbs (g)</label>
                                        <input type="number" value={customFoodForm.carbs} onChange={e => setCustomFoodForm({ ...customFoodForm, carbs: e.target.value })}
                                            className="input-field" placeholder="e.g. 30g" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Fat (g)</label>
                                        <input type="number" value={customFoodForm.fat} onChange={e => setCustomFoodForm({ ...customFoodForm, fat: e.target.value })}
                                            className="input-field" placeholder="e.g. 8g" required />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={customFoodForm.is_veg} onChange={e => setCustomFoodForm({ ...customFoodForm, is_veg: e.target.checked })} className="accent-emerald-600" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Vegetarian</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={customFoodForm.is_vegan} onChange={e => setCustomFoodForm({ ...customFoodForm, is_vegan: e.target.checked })} className="accent-emerald-600" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Vegan</span>
                                    </label>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCustomFoodModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Adding...' : 'Add Food 🍎'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <BarcodeScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onDetected={handleScannerDetected}
            />
        </div>
    )
}

