import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Flame, BookOpen, CheckCircle2, Plus, Scale, Crown } from 'lucide-react';

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
        date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
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
            <div className="space-y-6 animate-pulse max-w-4xl">
                <div className="h-5 bg-gray-200 dark:bg-white/10 rounded w-32"></div>
                <div className="card p-0 overflow-hidden">
                    <div className="h-80 bg-gray-200 dark:bg-white/10 rounded-t-[2rem]"></div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 rounded-2xl"></div>)}
                        </div>
                        <div className="space-y-3">
                            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-white/5 rounded-2xl"></div>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !recipe) {
        return (
            <div className="card flex flex-col items-center py-16 gap-4 max-w-lg mx-auto text-center">
                <BookOpen className="w-14 h-14 text-gray-300 dark:text-white/20" />
                <h2 className="font-black text-gray-700 dark:text-white text-xl">Recipe Not Found</h2>
                <p className="text-gray-400 dark:text-white/40 text-sm">This recipe may have been removed or you don't have access.</p>
                <Link to="/cookbook" className="btn-primary mt-2">Back to Cookbook</Link>
            </div>
        );
    }

    // Premium Check
    if (recipe.is_premium && user?.plan_type !== 'premium' && user?.role !== 'admin') {
        navigate('/subscription');
        return null;
    }

    const macros = [
        { label: 'Protein', value: `${Math.round(recipe.protein || 0)}g`, color: 'text-[#2d6a4f] dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Carbs',   value: `${Math.round(recipe.carbs   || 0)}g`, color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20'  },
        { label: 'Fat',     value: `${Math.round(recipe.fat     || 0)}g`, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    ];

    return (
        <div className="space-y-6 max-w-4xl pb-20 animate-fade-in">

            {/* Back link */}
            <Link
                to="/cookbook"
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-white/50 hover:text-[#2d6a4f] dark:hover:text-green-400 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Cookbook
            </Link>

            {/* Main Card */}
            <div className="card p-0 overflow-hidden">

                {/* Hero Image */}
                <div className="relative h-80 md:h-96 overflow-hidden rounded-t-[2rem]">
                    <img
                        src={recipe.image_url || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800'}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Premium badge */}
                    {recipe.is_premium && (
                        <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                            <Crown className="w-3.5 h-3.5" /> Premium
                        </div>
                    )}

                    {/* Title overlay */}
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                        <span className="text-[10px] font-black bg-[#2d6a4f]/80 backdrop-blur-sm px-2.5 py-1 rounded-lg uppercase tracking-widest">
                            Healthy Choice
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black mt-2 tracking-tighter drop-shadow-lg">
                            {recipe.name}
                        </h1>
                        <div className="flex items-center gap-5 mt-2 text-sm font-medium text-white/90">
                            <span className="flex items-center gap-1.5">
                                <Flame className="w-4 h-4 text-orange-400" />
                                {Math.round(recipe.calories || 0)} kcal
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-green-300" />
                                20 mins
                            </span>
                            <span className="flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-blue-300" />
                                {recipe.ingredients?.length || 0} ingredients
                            </span>
                        </div>
                    </div>
                </div>

                {/* Macro Strip */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-white/10 border-b border-gray-100 dark:border-white/10">
                    {macros.map(m => (
                        <div key={m.label} className="py-5 text-center">
                            <p className="metric-lbl mb-1">{m.label}</p>
                            <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="p-7 md:p-8 space-y-10">

                    {/* Description */}
                    {recipe.description && (
                        <p className="text-gray-500 dark:text-white/50 leading-relaxed border-l-4 border-[#2d6a4f] pl-4">
                            {recipe.description}
                        </p>
                    )}

                    {/* Ingredients */}
                    <div>
                        <h2 className="font-black text-gray-900 dark:text-white text-xl flex items-center gap-2 mb-5">
                            <span className="w-1.5 h-7 bg-gradient-to-b from-[#2d6a4f] to-[#40916c] rounded-full"></span>
                            Ingredients
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {recipe.ingredients?.map((ing, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-[#40916c]/30 dark:hover:border-green-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] dark:text-green-400 shrink-0" />
                                        <span className="font-bold text-gray-700 dark:text-white/80 text-sm">
                                            {ing.food?.name || ing.name}
                                        </span>
                                    </div>
                                    <span className="text-[#2d6a4f] dark:text-green-400 font-black text-sm flex items-center gap-1">
                                        <Scale className="w-3.5 h-3.5" />
                                        {ing.quantity} {ing.unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    {recipe.instructions && (
                        <div>
                            <h2 className="font-black text-gray-900 dark:text-white text-xl flex items-center gap-2 mb-5">
                                <span className="w-1.5 h-7 bg-gradient-to-b from-[#2d6a4f] to-[#40916c] rounded-full"></span>
                                Instructions
                            </h2>
                            <div className="space-y-3">
                                {recipe.instructions.split('\n').filter(s => s.trim()).map((step, idx) => (
                                    <div
                                        key={idx}
                                        className="flex gap-4 p-4 bg-green-50/60 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30"
                                    >
                                        <div className="shrink-0 w-8 h-8 bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-white rounded-full flex items-center justify-center font-black text-sm shadow-md shadow-green-900/20">
                                            {idx + 1}
                                        </div>
                                        <p className="text-gray-700 dark:text-white/70 leading-relaxed pt-1 text-sm">
                                            {step.replace(/^\d+\.\s*/, '')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add to Plan CTA */}
                    <button
                        className="btn-primary w-full py-4 text-base"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="w-5 h-5" />
                        Add to Meal Plan
                    </button>
                </div>
            </div>

            {/* Add to Plan Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#0d2b1f] w-full max-w-md rounded-[2rem] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">

                        {/* Modal Header */}
                        <div className="px-7 pt-7 pb-5 border-b border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 text-[#2d6a4f] dark:text-green-400 rounded-2xl flex items-center justify-center">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white text-lg">Add to Meal Plan</h3>
                                    <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Choose when to add <span className="font-bold">{recipe.name}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="px-7 py-6 space-y-4">
                            <div>
                                <label className="input-label">Select Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={addConfig.date}
                                    onChange={(e) => setAddConfig({ ...addConfig, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="input-label">Meal Type</label>
                                <select
                                    className="input-field"
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

                        {/* Modal Footer */}
                        <div className="px-7 pb-7 flex gap-3">
                            <button
                                className="btn-secondary flex-1 justify-center"
                                onClick={() => setIsAdding(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary flex-1"
                                onClick={handleAddToPlan}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipeDetail;
