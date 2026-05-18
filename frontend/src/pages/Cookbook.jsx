import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Book, Search, Filter, ChevronRight, Lock, Clock, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

const Cookbook = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('All');

    const { data: recipes, isLoading } = useQuery({
        queryKey: ['recipes'],
        queryFn: async () => {
            const response = await api.get('/recipes');
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

    const filteredRecipes = recipes?.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Book className="w-8 h-8 text-emerald-600" />
                        Healthy Cookbook
                    </h1>
                    <p className="text-gray-600 mt-1">Discover nutritious recipes for your meal plan</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search recipes..."
                            className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredRecipes?.map((recipe) => (
                    <div key={recipe.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100">
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={recipe.image_url || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400'}
                                alt={recipe.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            {recipe.is_premium && (
                                <div className="absolute top-4 right-4 bg-amber-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    PREMIUM
                                </div>
                            )}
                            <div className="absolute bottom-4 left-4 text-white">
                                <span className="text-xs font-medium bg-emerald-500/80 px-2 py-1 rounded">Healthy</span>
                                <h3 className="text-xl font-bold mt-1 uppercase tracking-tight">{recipe.name}</h3>
                            </div>
                        </div>

                        <div className="p-5">
                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                {recipe.description}
                            </p>

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                                <div className="flex items-center gap-1.5">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    <span>{Math.round(recipe.calories)} kcal</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-emerald-500" />
                                    <span>15-20 min</span>
                                </div>
                            </div>

                            {recipe.is_premium && user?.plan_type !== 'premium' && user?.role !== 'admin' ? (
                                <Link
                                    to="/subscription"
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                >
                                    <Lock className="w-4 h-4" />
                                    Upgrade to View
                                </Link>
                            ) : (
                                <Link
                                    to={`/cookbook/${recipe.id}`}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-600 hover:text-white transition-all"
                                >
                                    View Full Recipe
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>
                ))}

                {filteredRecipes?.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500">
                        <p className="text-xl">No recipes found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cookbook;
