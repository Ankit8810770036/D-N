import React, { useState, useEffect } from 'react';
import { X, BookOpen, Trash2, Save, Search, Crown } from 'lucide-react';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';

const AdminRecipeModal = ({ isOpen, onClose, onSave, recipe = null, loading = false }) => {
    const [form, setForm] = useState({
        name: '',
        description: '',
        instructions: '',
        image_url: '',
        is_premium: false,
        ingredients: []
    });

    const [foodSearch, setFoodSearch] = useState('');

    const { data: foodResults } = useQuery({
        queryKey: ['foodSearch', foodSearch],
        queryFn: async () => {
            if (!foodSearch) return [];
            const response = await api.get(`/foods?search=${foodSearch}`);
            return Array.isArray(response.data) ? response.data : (response.data.data || []);
        },
        enabled: foodSearch.length > 1
    });

    useEffect(() => {
        if (recipe) {
            setForm({
                name: recipe.name || '',
                description: recipe.description || '',
                instructions: recipe.instructions || '',
                image_url: recipe.image_url || '',
                is_premium: recipe.is_premium || false,
                ingredients: recipe.ingredients?.map(ing => ({
                    food_id: ing.food_id,
                    food_name: ing.food?.name,
                    quantity: ing.quantity,
                    unit: ing.unit
                })) || []
            });
        } else {
            setForm({ name: '', description: '', instructions: '', image_url: '', is_premium: false, ingredients: [] });
        }
    }, [recipe, isOpen]);

    if (!isOpen) return null;

    const addIngredient = (food) => {
        if (form.ingredients.some(ing => ing.food_id === food.id)) return;
        setForm({ ...form, ingredients: [...form.ingredients, { food_id: food.id, food_name: food.name, quantity: 100, unit: 'g' }] });
        setFoodSearch('');
    };

    const removeIngredient = (foodId) => {
        setForm({ ...form, ingredients: form.ingredients.filter(ing => ing.food_id !== foodId) });
    };

    const updateIngredient = (foodId, field, value) => {
        setForm({ ...form, ingredients: form.ingredients.map(ing => ing.food_id === foodId ? { ...ing, [field]: value } : ing) });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0d2b1f] w-full max-w-2xl rounded-[2rem] shadow-2xl shadow-black/20 overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-white/10">

                {/* Header */}
                <div className="px-7 pt-7 pb-5 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 text-[#2d6a4f] dark:text-green-400 rounded-2xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                {recipe ? 'Edit Recipe' : 'New Cookbook Recipe'}
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-white/40 font-medium mt-0.5">
                                Curate premium culinary content for the platform.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 dark:text-white/40">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

                    {/* Recipe Name */}
                    <div>
                        <label className="input-label">Recipe Name *</label>
                        <input
                            required
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Quinoa Avocado Salad"
                            className="input-field"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="input-label">Short Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="A nutritious and tasty salad..."
                            className="input-field h-20 resize-none"
                        />
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="input-label">Instructions</label>
                        <textarea
                            value={form.instructions}
                            onChange={e => setForm({ ...form, instructions: e.target.value })}
                            placeholder="1. Boil quinoa... 2. Chop vegetables..."
                            className="input-field h-28 resize-none"
                        />
                    </div>

                    {/* Image URL + Premium toggle */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="input-label">Image URL</label>
                            <input
                                type="url"
                                value={form.image_url}
                                onChange={e => setForm({ ...form, image_url: e.target.value })}
                                placeholder="https://..."
                                className="input-field"
                            />
                        </div>
                        <div className="flex items-end pb-1">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, is_premium: !form.is_premium })}
                                className={`w-full py-3.5 px-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200
                                    ${form.is_premium
                                        ? 'border-amber-400 bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                        : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-amber-300 dark:hover:border-amber-800'
                                    }`}
                            >
                                <Crown className="w-4 h-4" />
                                {form.is_premium ? 'Premium Recipe ✓' : 'Mark as Premium'}
                            </button>
                        </div>
                    </div>

                    {/* Ingredients Section */}
                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                        <label className="input-label mb-3">Add Ingredients</label>

                        {/* Food Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30 z-10" />
                            <input
                                type="text"
                                value={foodSearch}
                                onChange={e => setFoodSearch(e.target.value)}
                                placeholder="Search foods to add..."
                                className="input-field pl-11"
                            />

                            {/* Dropdown */}
                            {foodResults?.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#0d2b1f] border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto">
                                    {foodResults.map(food => (
                                        <button
                                            key={food.id}
                                            type="button"
                                            onClick={() => addIngredient(food)}
                                            className="w-full text-left px-5 py-3 hover:bg-green-50 dark:hover:bg-white/5 flex items-center justify-between text-sm transition-colors border-b border-gray-50 dark:border-white/5 last:border-0"
                                        >
                                            <span className="font-bold text-gray-700 dark:text-white/80">{food.name}</span>
                                            <span className="text-xs text-gray-400 dark:text-white/30">{food.calories} kcal/100g</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Ingredient List */}
                        <div className="space-y-2">
                            {form.ingredients.map((ing, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/10">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 dark:text-white/80 truncate">{ing.food_name}</p>
                                    </div>
                                    <input
                                        type="number"
                                        value={ing.quantity}
                                        onChange={e => updateIngredient(ing.food_id, 'quantity', e.target.value)}
                                        className="w-20 px-2 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 text-gray-700 dark:text-white/80"
                                    />
                                    <select
                                        value={ing.unit}
                                        onChange={e => updateIngredient(ing.food_id, 'unit', e.target.value)}
                                        className="w-16 px-2 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 text-gray-700 dark:text-white/80"
                                    >
                                        <option value="g">g</option>
                                        <option value="ml">ml</option>
                                        <option value="unit">unit</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => removeIngredient(ing.food_id)}
                                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-xl transition-colors shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {form.ingredients.length === 0 && (
                                <div className="text-center py-8 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
                                    <BookOpen className="w-8 h-8 text-gray-300 dark:text-white/20 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400 dark:text-white/30 font-medium">No ingredients yet. Search and select foods above.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-7 py-5 border-t border-gray-100 dark:border-white/10 flex gap-3">
                    <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 disabled:opacity-60 disabled:cursor-not-allowed">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {recipe ? 'Save Changes' : 'Create Recipe'}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AdminRecipeModal;
