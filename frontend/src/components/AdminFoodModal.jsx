import React, { useState, useEffect } from 'react';
import { X, Flame, Scale, Activity, Save } from 'lucide-react';

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

    const inputClasses = "w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all";
    const labelClasses = "text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">{food ? 'Edit Food Entry' : 'New Food Database Entry'}</h2>
                        <p className="text-emerald-100 text-xs font-medium mt-1">Configure nutritional parameters for the global database.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={labelClasses}>Food Name</label>
                            <input
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Greek Yogurt"
                                className={inputClasses}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className={labelClasses}>Brand Name (Optional)</label>
                            <input
                                value={form.brand}
                                onChange={e => setForm({ ...form, brand: e.target.value })}
                                placeholder="e.g. Amul"
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Calories (kcal)</label>
                            <div className="relative">
                                <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                                <input
                                    required
                                    type="number"
                                    value={form.calories}
                                    onChange={e => setForm({ ...form, calories: e.target.value })}
                                    className={`${inputClasses} pl-10`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Protein (g)</label>
                            <div className="relative">
                                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                <input
                                    required
                                    type="number"
                                    value={form.protein}
                                    onChange={e => setForm({ ...form, protein: e.target.value })}
                                    className={`${inputClasses} pl-10`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Carbs (g)</label>
                            <input
                                required
                                type="number"
                                value={form.carbs}
                                onChange={e => setForm({ ...form, carbs: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Fat (g)</label>
                            <input
                                required
                                type="number"
                                value={form.fat}
                                onChange={e => setForm({ ...form, fat: e.target.value })}
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Serving Size</label>
                            <input
                                required
                                type="number"
                                value={form.serving_size}
                                onChange={e => setForm({ ...form, serving_size: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Serving Unit</label>
                            <select
                                value={form.serving_unit}
                                onChange={e => setForm({ ...form, serving_unit: e.target.value })}
                                className={inputClasses}
                            >
                                <option value="g">Grams (g)</option>
                                <option value="ml">Milliliters (ml)</option>
                                <option value="cup">Cup</option>
                                <option value="unit">Unit/Piece</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                        {[
                            { id: 'is_veg', label: 'Vegetarian', color: 'text-green-600' },
                            { id: 'is_vegan', label: 'Vegan', color: 'text-emerald-700' },
                            { id: 'is_jain', label: 'Jain Friendly', color: 'text-orange-600' }
                        ].map(opt => (
                            <label key={opt.id} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={form[opt.id]}
                                    onChange={e => setForm({ ...form, [opt.id]: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-200 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className={`text-sm font-bold ${opt.color} opacity-80 group-hover:opacity-100 transition-opacity`}>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </form>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 uppercase tracking-tight"
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
