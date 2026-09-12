import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

const activityLevels = [
    { value: 'sedentary', label: '🪑 Sedentary', desc: 'Little/no exercise' },
    { value: 'light', label: '🚶 Light', desc: '1-3 days/week' },
    { value: 'moderate', label: '🏃 Moderate', desc: '3-5 days/week' },
    { value: 'active', label: '💪 Active', desc: '6-7 days/week' },
    { value: 'very_active', label: '🔥 Very Active', desc: 'Hard daily' },
]

export default function OnboardingWizard({ isOpen, onComplete, initialData = {} }) {
    const queryClient = useQueryClient()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        age: initialData.age || '',
        gender: initialData.gender || 'male',
        height_cm: initialData.height_cm || '',
        weight_kg: initialData.weight_kg || '',
        waist_cm: initialData.waist_cm || '',
        goal: initialData.goal || 'maintain',
        activity_level: initialData.activity_level || 'sedentary',
        sleep_hours: initialData.sleep_hours || '7',
        food_preference: initialData.food_preference || 'veg',
        diseases: initialData.diseases || [],
        allergies: initialData.allergies || [],
    })

    if (!isOpen) return null

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const next = () => setStep(s => s + 1)
    const prev = () => setStep(s => s - 1)

    async function handleFinish() {
        setLoading(true)
        try {
            await api.put('/profile/update', form)
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            toast.success('Awesome! Your profile is all set. 🚀')
            onComplete()
        } catch (err) {
            const errors = err.response?.data?.errors
            toast.error(errors ? Object.values(errors).flat()[0] : 'Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    const steps = [
        // Step 1: Welcome
        (
            <div className="space-y-4 text-center animate-fadeIn">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🧬</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome to Your New Self!</h2>
                <p className="text-gray-500 dark:text-gray-400">We need a few details to create a meal plan that actually works for your body and goals.</p>
                <div className="pt-6">
                    <button onClick={next} className="btn-primary w-full py-3 text-lg">Let's Get Started! →</button>
                </div>
            </div>
        ),
        // Step 2: Basics
        (
            <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">The Basics</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="input-label">How old are you?</label>
                        <input type="number" value={form.age} onChange={e => set('age', e.target.value)} className="input-field text-center text-lg" placeholder="25" />
                    </div>
                    <div>
                        <label className="input-label">Gender</label>
                        <select value={form.gender} onChange={e => set('gender', e.target.value)} className="input-field text-lg text-center">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="input-label">Avg. Sleep (hours)</label>
                    <input type="range" min="4" max="12" step="0.5" value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)} className="w-full accent-[#2d6a4f]" />
                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                        <span>4h</span>
                        <span className="font-bold text-[#2d6a4f] dark:text-[#52b788] text-sm">{form.sleep_hours} hours</span>
                        <span>12h</span>
                    </div>
                </div>
                <div className="flex gap-3 pt-4">
                    <button onClick={prev} className="btn-secondary flex-1">Back</button>
                    <button onClick={next} className="btn-primary flex-1" disabled={!form.age}>Next →</button>
                </div>
            </div>
        ),
        // Step 3: Metrics
        (
            <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Body Metrics</h2>
                <div className="space-y-4">
                    <div>
                        <label className="input-label">Height (cm)</label>
                        <input type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} className="input-field text-center text-lg" placeholder="170" />
                    </div>
                    <div>
                        <label className="input-label">Current Weight (kg)</label>
                        <input type="number" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} className="input-field text-center text-lg" placeholder="70" />
                    </div>
                </div>
                <div className="flex gap-3 pt-4">
                    <button onClick={prev} className="btn-secondary flex-1">Back</button>
                    <button onClick={next} className="btn-primary flex-1" disabled={!form.height_cm || !form.weight_kg}>Next →</button>
                </div>
            </div>
        ),
        // Step 4: Activity & Goal
        (
            <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Goal & Activity</h2>
                <div>
                    <label className="input-label mb-2">What is your primary goal?</label>
                    <div className="flex gap-2">
                        {[['lose', '⬇️ Lose'], ['maintain', '✅ Maintain'], ['gain', '⬆️ Gain']].map(([v, l]) => (
                            <button key={v} onClick={() => set('goal', v)}
                                className={`flex-1 py-3 text-sm font-bold rounded-2xl border-2 transition-all
                                ${form.goal === v ? 'border-[#2d6a4f] bg-green-50 dark:bg-green-950/20 text-[#2d6a4f] dark:text-[#52b788]' : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="input-label mb-2">Activity Level</label>
                    <div className="grid grid-cols-1 gap-2">
                        {activityLevels.map(al => (
                            <button key={al.value} onClick={() => set('activity_level', al.value)}
                                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left
                                ${form.activity_level === al.value ? 'border-[#2d6a4f] bg-green-50 dark:bg-green-950/20' : 'border-gray-100 dark:border-gray-700'}`}>
                                <span className="text-xl">{al.label.split(' ')[0]}</span>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{al.label.split(' ')[1]}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{al.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button onClick={prev} className="btn-secondary flex-1">Back</button>
                    <button onClick={next} className="btn-primary flex-1">Next →</button>
                </div>
            </div>
        ),
        // Step 5: Food Preferences
        (
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Food Preferences</h2>
                <div className="grid grid-cols-2 gap-3">
                    {['veg', 'non-veg', 'vegan', 'jain'].map(v => (
                        <button key={v} onClick={() => set('food_preference', v)}
                            className={`py-4 rounded-2xl border-2 capitalize font-bold transition-all
                            ${form.food_preference === v ? 'border-[#2d6a4f] bg-green-50 dark:bg-green-950/20 text-[#2d6a4f] dark:text-[#52b788]' : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            {v}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center italic">We'll use this to filter ingredients in your meal plans.</p>
                <div className="flex gap-3 pt-4">
                    <button onClick={prev} className="btn-secondary flex-1">Back</button>
                    <button onClick={next} className="btn-primary flex-1">Almost Done! →</button>
                </div>
            </div>
        ),
        // Step 6: Summary & Finish
        (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="text-5xl mb-4">🏁</div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">You're All Set!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Ready to see your personalized calorie targets and meal plan?</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/10 rounded-2xl p-5 border border-green-100 dark:border-green-900/30 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Selected Goal</span>
                        <span className="font-bold text-[#2d6a4f] dark:text-[#52b788] capitalize">{form.goal} Weight</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Diet Type</span>
                        <span className="font-bold text-[#2d6a4f] dark:text-[#52b788] capitalize">{form.food_preference}</span>
                    </div>
                </div>
                <div className="flex gap-3 pt-4">
                    <button onClick={prev} className="btn-secondary flex-1" disabled={loading}>Review</button>
                    <button onClick={handleFinish} className="btn-primary flex-1 py-3" disabled={loading}>
                        {loading ? 'Calculating...' : 'See Results! ✨'}
                    </button>
                </div>
            </div>
        )
    ]
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-[32px] shadow-2xl w-full max-w-md max-h-[90dvh] landscape:max-h-[95dvh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-300">
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex">
                    <div
                        className="h-full bg-gradient-to-r from-[#2d6a4f] to-[#52b788] transition-all duration-500 ease-out"
                        style={{ width: `${(step / steps.length) * 100}%` }}
                    />
                </div>

                <div className="p-8 overflow-y-auto flex-1 min-h-0 scrollbar-thin">
                    {steps[step - 1]}
                </div>

                <div className="px-8 pb-6 text-center flex-shrink-0">
                    <p className="text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-600 font-bold">
                        Step {step} of {steps.length}
                    </p>
                </div>
            </div>
        </div>
    )
}
