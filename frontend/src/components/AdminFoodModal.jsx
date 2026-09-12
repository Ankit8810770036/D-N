import React, { useState, useEffect } from 'react';
import { X, Flame, Activity, Save, Utensils } from 'lucide-react';

const AdminFoodModal = ({ isOpen, onClose, onSave, food = null, loading = false }) => {
    const [form, setForm] = useState({
        name: '',
        brand: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        serving_size: '100',
        serving_unit: 'g',
        is_veg: true,
        is_vegan: false,
        is_jain: false
    });

    useEffect(() => {
        if (food) {
            setForm({
                name: food.name || '',
                brand: food.brand || '',
                calories: food.calories || '',
                protein: food.protein || '',
                carbs: food.carbs || '',
                fat: food.fat || '',
                serving_size: food.serving_size || '100',
                serving_unit: food.serving_unit || 'g',
                is_veg: food.is_veg ?? true,
                is_vegan: food.is_vegan ?? false,
                is_jain: food.is_jain ?? false
            });
        } else {
            setForm({
                name: '', brand: '', calories: '', protein: '', carbs: '', fat: '',
                serving_size: '100', serving_unit: 'g', is_veg: true, is_vegan: false, is_jain: false
            });
        }
    }, [food, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0d2b1f] w-full max-w-lg rounded-[2rem] shadow-2xl shadow-black/20 overflow-hidden flex flex-col max-h-[90dvh] landscape:max-h-[95dvh] border border-gray-100 dark:border-white/10">

                {/* Header */}
                <div className="px-7 pt-7 pb-5 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 text-[#2d6a4f] dark:text-green-400 rounded-2xl flex items-center justify-center">
                            <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                {food ? 'Edit Food Entry' : 'New Food Entry'}
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-white/40 font-medium mt-0.5">
                                Configure nutritional parameters for the global database.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 dark:text-white/40"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

                    {/* Food Name */}
                    <div>
                        <label className="input-label">Food Name *</label>
                        <input
                            required
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Greek Yogurt"
                            className="input-field"
                        />
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="input-label">Brand Name <span className="normal-case font-normal text-gray-300">(optional)</span></label>
                        <input
                            value={form.brand}
                            onChange={e => setForm({ ...form, brand: e.target.value })}
                            placeholder="e.g. Amul"
                            className="input-field"
                        />
                    </div>

                    {/* Calories + Protein */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="input-label">Calories (kcal) *</label>
                            <div className="relative">
                                <Flame className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 z-10" />
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    value={form.calories}
                                    onChange={e => setForm({ ...form, calories: e.target.value })}
                                    className="input-field pl-11"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Protein (g) *</label>
                            <div className="relative">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2d6a4f] dark:text-green-400 z-10" />
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={form.protein}
                                    onChange={e => setForm({ ...form, protein: e.target.value })}
                                    className="input-field pl-11"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Carbs + Fat */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="input-label">Carbs (g) *</label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.1"
                                value={form.carbs}
                                onChange={e => setForm({ ...form, carbs: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="input-label">Fat (g) *</label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.1"
                                value={form.fat}
                                onChange={e => setForm({ ...form, fat: e.target.value })}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Serving Size + Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="input-label">Serving Size *</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={form.serving_size}
                                onChange={e => setForm({ ...form, serving_size: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="input-label">Serving Unit *</label>
                            <select
                                value={form.serving_unit}
                                onChange={e => setForm({ ...form, serving_unit: e.target.value })}
                                className="input-field"
                            >
                                <option value="g">Grams (g)</option>
                                <option value="ml">Milliliters (ml)</option>
                                <option value="cup">Cup</option>
                                <option value="unit">Unit / Piece</option>
                            </select>
                        </div>
                    </div>

                    {/* Dietary Tags */}
                    <div>
                        <label className="input-label mb-3">Dietary Tags</label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { id: 'is_veg',   label: '🌿 Vegetarian',  activeClass: 'bg-green-50 dark:bg-green-900/30 border-[#40916c] text-[#2d6a4f] dark:text-green-400' },
                                { id: 'is_vegan', label: '🌱 Vegan',        activeClass: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400' },
                                { id: 'is_jain',  label: '🟡 Jain Friendly', activeClass: 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-400' },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setForm({ ...form, [opt.id]: !form[opt.id] })}
                                    className={`px-4 py-2 rounded-2xl border-2 text-sm font-bold transition-all duration-200
                                        ${form[opt.id]
                                            ? opt.activeClass
                                            : 'border-gray-100 dark:border-white/10 text-gray-400 dark:text-white/30 hover:border-gray-200 dark:hover:border-white/20'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                </form>

                {/* Footer Actions */}
                <div className="px-7 py-5 border-t border-gray-100 dark:border-white/10 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary flex-1 justify-center"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {food ? 'Update Entry' : 'Create Entry'}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AdminFoodModal;
