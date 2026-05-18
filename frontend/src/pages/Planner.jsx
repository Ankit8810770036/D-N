import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BarcodeScanner from '../components/BarcodeScanner'
import { Scan } from 'lucide-react'

const mealIcons = { breakfast: '🌅', lunch: '☀️', snack: '🫐', dinner: '🌙' }
const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }

export default function Planner() {
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [showCustomFoodModal, setShowCustomFoodModal] = useState(false)
    const [customFoodForm, setCustomFoodForm] = useState({
        name: '', calories: '', protein: '', carbs: '', fat: '',
        is_veg: true, is_vegan: false, is_jain: false
    })

    const { data: plan, isFetching: fetching, refetch: fetchPlan } = useQuery({
        queryKey: ['mealPlan', date],
        queryFn: () => api.get(`/meal-plan?date=${date}`).then(res => res.data).catch(() => null),
    })

    async function generatePlan() {
        setLoading(true)
        try {
            await api.post('/generate-plan', { date })
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
            queryClient.invalidateQueries({ queryKey: ['groceryList'] })
            toast.success('Meal plan generated! 🍽️')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate plan.')
        } finally {
            setLoading(false)
        }
    }

    async function swapItem(itemId) {
        try {
            toast.loading('Swapping ingredient...', { id: 'swap' });
            await api.put(`/meal-item/${itemId}/swap`);
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] });
            queryClient.invalidateQueries({ queryKey: ['groceryList'] });
            toast.success('Swapped perfectly! 🔄', { id: 'swap' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Swap failed.', { id: 'swap' });
        }
    }

    async function toggleConsumed(itemId) {
        try {
            const res = await api.put(`/meal-item/${itemId}/consume`);
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            const label = res.data.date === new Date().toISOString().split('T')[0] ? 'today' : res.data.date;
            toast.success(`${res.data.message} — ${res.data.calories_consumed} kcal consumed on ${label}`, { duration: 2500 });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update.');
        }
    }

    async function handleAddCustomFood(e) {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post('/foods', customFoodForm)
            toast.success('Custom food added to database! 🍎')
            setShowCustomFoodModal(false)
            setCustomFoodForm({
                name: '', calories: '', protein: '', carbs: '', fat: '',
                is_veg: true, is_vegan: false, is_jain: false
            })
            // Optionally refetch something? Global foods list might be cached somewhere
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add food.')
        } finally {
            setLoading(false)
        }
    }

    const handleScannerDetected = (productData) => {
        setCustomFoodForm({
            name: productData.name,
            calories: Math.round(productData.calories),
            protein: Math.round(productData.protein),
            carbs: Math.round(productData.carbs),
            fat: Math.round(productData.fat),
            is_veg: true, // Default to true, OFF data often doesn't specify clearly enough for a simple toggle
            is_vegan: false,
            is_jain: false
        })
        setShowCustomFoodModal(true)
        toast.success(`Fetched: ${productData.name}`)
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Diet Planner</h1>
                    <p className="page-subtitle">AI-powered daily meal plans tailored to your health profile</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setShowCustomFoodModal(true)} className="px-4 py-2 bg-orange-50 border border-orange-200 text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-100 transition-all flex items-center gap-2">
                        🍎 Add Custom Food
                    </button>
                    <button onClick={() => setIsScannerOpen(true)} className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center gap-2">
                        <Scan className="w-4 h-4" /> Scan Barcode
                    </button>
                </div>
            </div>

            {/* Date + Generate */}
            <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                    <label className="input-label">Select Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        className="input-field" style={{ maxWidth: 200 }} />
                </div>
                <button onClick={generatePlan} disabled={loading}
                    className="btn-primary whitespace-nowrap mt-0 sm:mt-5">
                    {loading ? '⏳ Generating...' : '✨ Generate Meal Plan'}
                </button>

                <BarcodeScanner
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onDetected={handleScannerDetected}
                />
            </div>

            {/* Summary Row */}
            {plan?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { val: Math.round(plan.summary.calories_target), lbl: 'Total Calories' },
                        { val: `${plan.summary.protein_g}g`, lbl: 'Protein' },
                        { val: `${plan.summary.carbs_g}g`, lbl: 'Carbs' },
                        { val: `${plan.summary.fat_g}g`, lbl: 'Fat' },
                        { val: `${plan.summary.water_intake_liters}L`, lbl: 'Water Goal' },
                    ].map(m => (
                        <div key={m.lbl} className="metric-card py-3">
                            <div className="metric-val text-xl">{m.val}</div>
                            <div className="metric-lbl">{m.lbl}</div>
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
                                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                <div className="h-5 bg-gray-200 rounded w-24"></div>
                                <div className="ml-auto w-16 h-5 rounded-full bg-gray-100"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-[68px] bg-gray-50 rounded-xl"></div>
                                <div className="h-[68px] bg-gray-50 rounded-xl"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : plan?.meals ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {['breakfast', 'lunch', 'snack', 'dinner'].map(type => {
                        const items = plan.meals[type] ?? []
                        return (
                            <div key={type} className="card">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-2xl">{mealIcons[type]}</span>
                                    <h3 className="font-semibold text-gray-800 dark:text-white/90">{mealLabels[type]}</h3>
                                    {items.length > 0 && (
                                        <span className="ml-auto badge badge-green">
                                            {Math.round(items.reduce((s, i) => s + Number(i.calories), 0))} kcal
                                        </span>
                                    )}
                                </div>
                                {items.length > 0 ? (
                                    <div className="space-y-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className={`flex items-center justify-between p-3 rounded-xl group hover:shadow-sm transition-all border ${item.is_consumed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50' : 'bg-gray-50 border-transparent hover:border-gray-200 dark:bg-gray-800/50 dark:hover:border-gray-700'}`}>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!item.is_consumed}
                                                        onChange={() => toggleConsumed(item.id)}
                                                        className="w-4 h-4 accent-green-600 cursor-pointer rounded shrink-0"
                                                        title={item.is_consumed ? 'Mark as not consumed' : 'Mark as consumed'}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className={`text-sm font-medium ${item.is_consumed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-white/90'}`}>
                                                                {item.recipe ? item.recipe.name : item.food?.name}
                                                            </p>
                                                            {item.recipe && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Recipe</span>}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {item.recipe ? '1 serving' : `${item.quantity}${item.unit}`} &nbsp;·&nbsp;
                                                            P:{Math.round(item.protein)}g C:{Math.round(item.carbs)}g F:{Math.round(item.fat)}g
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {!item.is_consumed && (
                                                        <button onClick={() => swapItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 rounded-lg p-1.5 shadow-sm border border-gray-200 dark:border-gray-600 scale-95 hover:scale-105" title="Swap this ingredient for another">
                                                            🔄
                                                        </button>
                                                    )}
                                                    <span className={`text-sm font-bold ${item.is_consumed ? 'text-green-600' : 'text-[#2d6a4f]'}`}>{item.calories} kcal</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No items added</p>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="card flex flex-col items-center py-12 gap-3">
                    <span className="text-5xl">🍽️</span>
                    <p className="font-semibold text-gray-700">No meal plan for this date</p>
                    <p className="text-sm text-gray-400">Click "Generate Meal Plan" to create one automatically</p>
                </div>
            )}

            {/* Grocery List Modal */}

            {/* Custom Food Modal */}
            {showCustomFoodModal && (
                <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col my-auto relative border border-transparent dark:border-gray-700">
                        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center bg-orange-50/50 dark:bg-orange-900/10">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">🍎 Add Custom Food</h3>
                                <p className="text-xs text-gray-500">Add to your personal database for AI planning.</p>
                            </div>
                            <button onClick={() => setShowCustomFoodModal(false)} className="text-gray-400 hover:text-gray-700 font-bold p-2 text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleAddCustomFood}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="input-label">Food Name</label>
                                    <input type="text" value={customFoodForm.name} onChange={e => setCustomFoodForm({ ...customFoodForm, name: e.target.value })}
                                        className="input-field" placeholder="e.g. Grandma's Special Pasta" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="input-label">Calories (kcal)</label>
                                        <input type="number" value={customFoodForm.calories} onChange={e => setCustomFoodForm({ ...customFoodForm, calories: e.target.value })}
                                            className="input-field" placeholder="250" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Protein (g)</label>
                                        <input type="number" value={customFoodForm.protein} onChange={e => setCustomFoodForm({ ...customFoodForm, protein: e.target.value })}
                                            className="input-field" placeholder="10" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Carbs (g)</label>
                                        <input type="number" value={customFoodForm.carbs} onChange={e => setCustomFoodForm({ ...customFoodForm, carbs: e.target.value })}
                                            className="input-field" placeholder="30" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Fat (g)</label>
                                        <input type="number" value={customFoodForm.fat} onChange={e => setCustomFoodForm({ ...customFoodForm, fat: e.target.value })}
                                            className="input-field" placeholder="8" required />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={customFoodForm.is_veg} onChange={e => setCustomFoodForm({ ...customFoodForm, is_veg: e.target.checked })} className="accent-green-600" />
                                        <span className="text-sm font-medium text-gray-700">Vegetarian</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={customFoodForm.is_vegan} onChange={e => setCustomFoodForm({ ...customFoodForm, is_vegan: e.target.checked })} className="accent-green-600" />
                                        <span className="text-sm font-medium text-gray-700">Vegan</span>
                                    </label>
                                </div>
                            </div>
                            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCustomFoodModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Adding...' : 'Add Food 🍎'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
