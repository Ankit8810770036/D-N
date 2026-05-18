import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Flame, Info, CheckCircle2, ChevronRight, Plus } from 'lucide-react';

const RecipeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: recipe, isLoading, error } = useQuery({
        queryKey: ['recipe', id],
        queryFn: async () => {
            const response = await api.get(`/recipes/${id}`);
            return response.data;
        }
    });

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const response = await api.get('/me');
            return response.data;
        }
    });

    const [isAdding, setIsAdding] = React.useState(false);
    const [addConfig, setAddConfig] = React.useState({
        date: new Date().toISOString().split('T')[0],
        meal_type: 'breakfast'
    });

    const handleAddToPlan = async () => {
        try {
            await api.post('/generate-plan', {
                date: addConfig.date,
                recipe_id: recipe.id,
                meal_type: addConfig.meal_type
            });
            toast.success(`${recipe.name} added to your plan! 🍳`);
            setIsAdding(false);
            navigate('/planner');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add recipe to plan.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !recipe) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">Recipe not found or access denied.</p>
                <Link to="/cookbook" className="text-emerald-600 hover:underline mt-4 inline-block">Back to Cookbook</Link>
            </div>
        );
    }

    // Premium Check
    if (recipe.is_premium && user?.plan_type !== 'premium' && user?.role !== 'admin') {
        navigate('/subscription');
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 pb-20">
            <Link to="/cookbook" className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Back to Cookbook
            </Link>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="relative h-96">
                    <img
                        src={recipe.image_url || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800'}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-8 left-8 text-white right-8">
                        <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">{recipe.name}</h1>
                        <div className="flex items-center gap-6 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-400" />
                                {Math.round(recipe.calories)} Calories
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-emerald-400" />
                                20 mins
                            </div>
                            <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/30">
                                Healthy Choice
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
                    <div className="p-6 text-center">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Protein</p>
                        <p className="text-2xl font-black text-gray-800 dark:text-white/90">{Math.round(recipe.protein)}g</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Carbs</p>
                        <p className="text-2xl font-black text-gray-800 dark:text-white/90">{Math.round(recipe.carbs)}g</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Fat</p>
                        <p className="text-2xl font-black text-gray-800 dark:text-white/90">{Math.round(recipe.fat)}g</p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="mb-10">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
                            <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
                            Ingredients
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recipe.ingredients.map((ing, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors">
                                    <span className="font-bold text-gray-700">{ing.food.name}</span>
                                    <span className="text-emerald-600 font-black">{ing.quantity} {ing.unit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
                            <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
                            Instructions
                        </h2>
                        <div className="space-y-4">
                            {recipe.instructions?.split('\n').map((step, idx) => (
                                <div key={idx} className="flex gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-sm">
                                        {idx + 1}
                                    </div>
                                    <p className="text-gray-700 leading-relaxed pt-1">{step.replace(/^\d+\.\s*/, '')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="w-6 h-6" />
                        Add to Meal Plan
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Add to Meal Plan</h3>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Select Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-gray-700"
                                        value={addConfig.date}
                                        onChange={(e) => setAddConfig({ ...addConfig, date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Meal Type</label>
                                    <select
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-gray-700 appearance-none"
                                        value={addConfig.meal_type}
                                        onChange={(e) => setAddConfig({ ...addConfig, meal_type: e.target.value })}
                                    >
                                        <option value="breakfast">🌅 Breakfast</option>
                                        <option value="lunch">☀️ Lunch</option>
                                        <option value="snack">🫐 Snack</option>
                                        <option value="dinner">🌙 Dinner</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                                    onClick={() => setIsAdding(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                                    onClick={handleAddToPlan}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipeDetail;
