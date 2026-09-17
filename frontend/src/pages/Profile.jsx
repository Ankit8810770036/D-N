import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { Camera, Trash2, User as UserIcon } from 'lucide-react'
import CustomSelect from '../components/CustomSelect'
import UserAvatar, { resolvePhotoUrl } from '../components/UserAvatar'

const activityLevels = [
    { value: 'sedentary', label: '🪑 Sedentary', desc: 'Little or no exercise' },
    { value: 'light', label: '🚶 Light', desc: '1-3 days/week' },
    { value: 'moderate', label: '🏃 Moderate', desc: '3-5 days/week' },
    { value: 'active', label: '💪 Active', desc: '6-7 days/week' },
    { value: 'very_active', label: '🔥 Very Active', desc: 'Hard daily' },
]

const diseases = ['diabetes', 'hypertension', 'thyroid', 'heart_disease', 'pcod']
const allergyOpts = ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish']

export default function Profile() {
    const { user: authUser, setUser, isPremium } = useAuth()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const [form, setForm] = useState({
        age: '', gender: 'male', height_cm: '', weight_kg: '', waist_cm: '',
        goal: 'maintain', activity_level: 'sedentary', sleep_hours: '',
        diseases: [], allergies: [], food_preference: 'veg',
    })
    const [loading, setLoading] = useState(false)
    const [photoLoading, setPhotoLoading] = useState(false)

    // Load existing profile via React Query cache
    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data } = await api.get('/profile')
            return data
        },
        staleTime: 60 * 1000,
    })

    const { data: metrics } = useQuery({
        queryKey: ['summary'],
        queryFn: async () => {
            const { data } = await api.get('/report/summary')
            return data.stats
        },
        staleTime: 60 * 1000,
    })

    useEffect(() => {
        if (profile) {
            const p = profile.profile || profile
            setForm({
                age: p.age ?? '',
                gender: p.gender ?? 'male',
                height_cm: p.height_cm ?? '',
                weight_kg: p.weight_kg ?? '',
                waist_cm: p.waist_cm ?? '',
                goal: p.goal ?? 'maintain',
                activity_level: p.activity_level ?? 'sedentary',
                sleep_hours: p.sleep_hours ?? '',
                diseases: p.diseases ?? [],
                allergies: p.allergies ?? [],
                food_preference: p.food_preference ?? 'veg',
            })
        }
    }, [profile])

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const toggle = (key, val) => setForm(f => ({
        ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val]
    }))

    async function handlePhotoUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file (JPEG, PNG, WebP).')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size must be under 2 MB.')
            return
        }

        const formData = new FormData()
        formData.append('photo', file)

        setPhotoLoading(true)
        try {
            const { data } = await api.post('/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const updatedUser = data.user || { ...authUser, profile_photo_url: data.profile_photo_url }
            setUser(updatedUser)
            localStorage.setItem('user', JSON.stringify(updatedUser))
            toast.success('Profile photo updated! 📸')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to upload profile photo.')
        } finally {
            setPhotoLoading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function handlePhotoDelete() {
        setPhotoLoading(true)
        try {
            const { data } = await api.delete('/profile/photo')
            const updatedUser = data.user || { ...authUser, profile_photo_url: data.profile_photo_url, profile_photo_path: null }
            setUser(updatedUser)
            localStorage.setItem('user', JSON.stringify(updatedUser))
            toast.success('Profile photo removed.')
        } catch (err) {
            toast.error('Failed to remove photo.')
        } finally {
            setPhotoLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        try {
            await api.put('/profile/update', form)
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] })

            // Sync AuthContext so navbar/sidebar reflect any name or role changes immediately
            const { data: freshUser } = await api.get('/me')
            setUser(freshUser)
            localStorage.setItem('user', JSON.stringify(freshUser))

            toast.success('Profile updated! ✅')
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.premium_required) {
                toast.error('Keto/Paleo plans require Premium subscription!');
                navigate('/subscription');
            } else {
                const errors = err.response?.data?.errors;
                toast.error(errors ? Object.values(errors).flat()[0] : 'Failed to update.');
            }
        } finally {
            setLoading(false)
        }
    }

    const hasCustomPhoto = authUser?.profile_photo_path || (authUser?.profile_photo_url && !authUser.profile_photo_url.includes('ui-avatars.com'))

    return (
        <div className="space-y-6 w-full pb-10 animate-fade-in">
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg border-2 border-white dark:border-white/10 ring-4 ring-green-50 dark:ring-green-900/20 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center relative">
                            <UserAvatar user={authUser} size="2xl" className="w-full h-full rounded-3xl object-cover text-2xl" />
                            {photoLoading && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center rounded-3xl">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute -bottom-2 -right-2 flex items-center gap-1.5">
                            <label
                                title="Upload new photo"
                                className="p-2 bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-white rounded-xl shadow-lg border-2 border-white dark:border-[#081c15] cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                            >
                                <Camera className="w-4 h-4" />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handlePhotoUpload}
                                    disabled={photoLoading || loading}
                                />
                            </label>

                            {hasCustomPhoto && (
                                <button
                                    type="button"
                                    onClick={handlePhotoDelete}
                                    disabled={photoLoading || loading}
                                    title="Remove custom photo"
                                    className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg border-2 border-white dark:border-[#081c15] cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <h1 className="page-title">My Health Profile</h1>
                        <p className="page-subtitle">Personalize your avatar, metrics, calorie targets, and dietary preferences</p>
                    </div>
                </div>
            </div>

            {/* Gamification Badges */}
            {metrics && (
                <div className="card">
                    <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-4 flex items-center justify-between">
                        <span>🏆 Achievements & Badges</span>
                        <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
                            <span className="text-xl">🔥</span>
                            <span className="font-bold text-orange-600">{metrics.streak || 0} Day Streak</span>
                        </div>
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { name: 'Starter Streak', days: 7, icon: '🥉', desc: '7 consecutive days logged' },
                            { name: 'Consistency Master', days: 30, icon: '🥈', desc: '1 month of dedicated logging' },
                            { name: 'Health Champion', days: 100, icon: '🥇', desc: '100 days of perfection!' },
                        ].map(b => {
                            const achieved = (metrics.streak || 0) >= b.days;
                            return (
                                <div key={b.days} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${achieved ? 'border-yellow-400 bg-yellow-50 shadow-sm' : 'border-gray-100 bg-gray-50 opacity-60 grayscale'}`}>
                                    <span className="text-4xl mb-2 filter drop-shadow-md">{b.icon}</span>
                                    <h4 className={`text-sm font-bold text-center ${achieved ? 'text-gray-900' : 'text-gray-500'}`}>{b.name}</h4>
                                    <p className="text-xs text-center text-gray-400 mt-1">{b.desc}</p>
                                    {!achieved && <span className="text-[10px] font-semibold text-gray-400 mt-2 bg-gray-200 px-2 py-0.5 rounded-full">{b.days - (metrics.streak || 0)} days left</span>}
                                    {achieved && <span className="text-[10px] font-bold text-yellow-700 mt-2 bg-yellow-200 px-2 py-0.5 rounded-full">UNLOCKED</span>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Form */}
            <div className="card">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white/90 mb-3">Basic Information</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="input-label">Age</label>
                                <input type="number" value={form.age} onChange={e => set('age', e.target.value)}
                                    className="input-field" placeholder="e.g. 25" min="1" max="120" required />
                            </div>
                            <div>
                                <CustomSelect
                                    label="Gender"
                                    value={form.gender}
                                    onChange={val => set('gender', val)}
                                    options={[
                                        { value: 'male', label: 'Male', icon: '👨' },
                                        { value: 'female', label: 'Female', icon: '👩' },
                                        { value: 'other', label: 'Other', icon: '⚧' },
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="input-label">Sleep Hours (Daily)</label>
                                <input type="number" value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)}
                                    className="input-field" placeholder="e.g. 7.5 hrs" min="0" max="24" step="0.5" required />
                            </div>
                        </div>
                    </div>

                    {/* Body Metrics */}
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white/90 mb-3">Body Metrics</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="input-label">Height (cm)</label>
                                <input type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)}
                                    className="input-field" placeholder="e.g. 175 cm" required />
                            </div>
                            <div>
                                <label className="input-label">Weight (kg)</label>
                                <input type="number" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)}
                                    className="input-field" placeholder="e.g. 70 kg" required />
                            </div>
                            <div>
                                <label className="input-label">Waist (cm)</label>
                                <input type="number" value={form.waist_cm} onChange={e => set('waist_cm', e.target.value)}
                                    className="input-field" placeholder="e.g. 82 cm" required />
                            </div>
                        </div>
                    </div>

                    {/* Goals */}
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white/90 mb-3">Goal & Activity</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Primary Goal</label>
                                <div className="flex gap-2 mt-1">
                                    {[['lose', '⬇️ Lose Weight'], ['maintain', '✅ Maintain'], ['gain', '⬆️ Gain Muscle']].map(([v, l]) => (
                                        <button type="button" key={v} onClick={() => set('goal', v)}
                                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all
                        ${form.goal === v
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50 hover:border-emerald-500/40 dark:hover:border-white/20'}`}>
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Food Preference</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {['veg', 'non-veg', 'vegan', 'jain', 'keto', 'paleo'].map(v => (
                                        <button
                                            type="button"
                                            key={v}
                                            onClick={() => set('food_preference', v)}
                                            className={`px-3 py-2 text-[10px] font-bold rounded-xl border-2 capitalize transition-all relative overflow-hidden
                                                ${form.food_preference === v
                                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                                                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50 hover:border-emerald-500/40 dark:hover:border-white/20'}
                                                ${['keto', 'paleo'].includes(v) && !isPremium ? 'opacity-70' : ''}`}
                                        >
                                            {v}
                                            {['keto', 'paleo'].includes(v) && !isPremium && (
                                                <div className="absolute top-0 right-0 p-0.5 bg-amber-500 text-white rounded-bl-lg">
                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="input-label mb-2">Activity Level</label>
                            <div className="grid md:grid-cols-5 gap-2">
                                {activityLevels.map(al => (
                                    <button type="button" key={al.value} onClick={() => set('activity_level', al.value)}
                                        className={`p-3 rounded-xl border-2 text-center transition-all
                      ${form.activity_level === al.value
                          ? 'border-emerald-600 bg-emerald-600 shadow-md shadow-emerald-700/20 text-white'
                          : 'border-slate-200 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-white/20'}`}>
                                        <p className={`text-sm font-bold ${form.activity_level === al.value ? 'text-white' : 'text-slate-800 dark:text-white/80'}`}>{al.label}</p>
                                        <p className={`text-xs mt-0.5 ${form.activity_level === al.value ? 'text-white/80' : 'text-slate-400 dark:text-white/40'}`}>{al.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Diseases */}
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-2">Medical Conditions <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></h3>
                        <div className="flex flex-wrap gap-2">
                            {diseases.map(d => (
                                <button type="button" key={d} onClick={() => toggle('diseases', d)}
                                    className={`px-4 py-2 rounded-2xl text-xs font-bold border-2 capitalize transition-all
                    ${form.diseases.includes(d)
                        ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20'
                        : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-rose-300 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400'}`}>
                                    {d.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Allergies */}
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-2">Allergies <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></h3>
                        <div className="flex flex-wrap gap-2">
                            {allergyOpts.map(a => (
                                <button type="button" key={a} onClick={() => toggle('allergies', a)}
                                    className={`px-4 py-2 rounded-2xl text-xs font-bold border-2 capitalize transition-all
                    ${form.allergies.includes(a)
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20'
                        : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-amber-300 dark:hover:border-amber-800 hover:text-amber-600 dark:hover:text-amber-400'}`}>
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto px-10">
                        {loading ? 'Saving...' : 'Save & Calculate Metrics 🧬'}
                    </button>
                </form>
            </div>
        </div>
    )
}
