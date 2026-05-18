import React, { useState, useEffect } from 'react';
import { X, BookOpen, Plus, Trash2, Save, Search, Flame, Crown, Utensils } from 'lucide-react';
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
            // Handle paginated or array response
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
            setForm({
                name: '', description: '', instructions: '', image_url: '',
                is_premium: false, ingredients: []
            });
        }
    }, [recipe, isOpen]);

    if (!isOpen) return null;

    const addIngredient = (food) => {
        if (form.ingredients.some(ing => ing.food_id === food.id)) return;
        setForm({
            ...form,
            ingredients: [
                ...form.ingredients,
                { food_id: food.id, food_name: food.name, quantity: 100, unit: 'g' }
            ]
        });
        setFoodSearch('');
    };

    const removeIngredient = (foodId) => {
        setForm({
            ...form,
            ingredients: form.ingredients.filter(ing => ing.food_id !== foodId)
        });
    };

    const updateIngredient = (foodId, field, value) => {
        setForm({
            ...form,
            ingredients: form.ingredients.map(ing =>
                ing.food_id === foodId ? { ...ing, [field]: value } : ing
            )
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    const inputClasses = "w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all";
    const labelClasses = "text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-violet-600 p-6 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">{recipe ? 'Edit Recipe' : 'New Cookbook Recipe'}</h2>
                        <p className="text-violet-100 text-xs font-medium mt-1">Curate premium culinary content for the platform.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Recipe Name</label>
                            <input
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Quinoa Avocado Salad"
                                className={inputClasses}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClasses}>Short Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="A nutritious and tasty salad..."
                                className={`${inputClasses} h-20 resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClasses}>Instructions</label>
                            <textarea
                                value={form.instructions}
                                onChange={e => setForm({ ...form, instructions: e.target.value })}
                                placeholder="1. Boil quinoa... 2. Chop vegetables..."
                                className={`${inputClasses} h-32 resize-none`}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Image URL</label>
                            <input
                                type="url"
                                value={form.image_url}
                                onChange={e => setForm({ ...form, image_url: e.target.value })}
                                placeholder="https://..."
                                className={inputClasses}
                            />
                        </div>

                        <div className="flex items-center gap-3 h-full pt-4">
                            <input
                                type="checkbox"
                                id="is_premium"
                                checked={form.is_premium}
                                onChange={e => setForm({ ...form, is_premium: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-200 text-violet-600 focus:ring-violet-500"
                            />
                            <label htmlFor="is_premium" className="text-sm font-bold text-amber-600 flex items-center gap-1.5 uppercase tracking-wide">
                                <Crown className="w-4 h-4" /> Premium Recipe
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className={labelClasses}>Add Ingredients</h3>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={foodSearch}
                                onChange={e => setFoodSearch(e.target.value)}
                                placeholder="Search foods to add..."
                                className={`${inputClasses} pl-10`}
                            />

                            {foodResults?.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                                    {foodResults.map(food => (
                                        <button
                                            key={food.id}
                                            type="button"
                                            onClick={() => addIngredient(food)}
                                            className="w-full text-left px-4 py-2 hover:bg-violet-50 flex items-center justify-between text-sm transition-colors border-b border-gray-50 last:border-0"
                                        >
                                            <span className="font-bold text-gray-700">{food.name}</span>
                                            <span className="text-xs text-gray-400">{food.calories} kcal/100g</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {form.ingredients.map((ing, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">{ing.food_name}</p>
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            value={ing.quantity}
                                            onChange={e => updateIngredient(ing.food_id, 'quantity', e.target.value)}
                                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                                        />
                                    </div>
                                    <div className="w-16">
                                        <select
                                            value={ing.unit}
                                            onChange={e => updateIngredient(ing.food_id, 'unit', e.target.value)}
                                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                                        >
                                            <option value="g">g</option>
                                            <option value="ml">ml</option>
                                            <option value="unit">unit</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeIngredient(ing.food_id)}
                                        className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {form.ingredients.length === 0 && (
                                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <Utensils className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400 font-medium px-4">No ingredients added yet. Search and select foods above.</p>
                                </div>
                            )}
                        </div>
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
                        className="flex-1 px-4 py-3 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2 uppercase tracking-tight"
                    >
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
