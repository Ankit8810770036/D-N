import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { BookOpen, Search, ChevronRight, Lock, Clock, Flame, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce';

import { useAuth } from '../context/AuthContext';

const Cookbook = () => {
    const { user, isPremium } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 250);

    const { data: recipes, isLoading } = useQuery({
        queryKey: ['recipes', user?.id],
        queryFn: async () => {
            const response = await api.get('/recipes');
            return response.data;
        }
    });

    const filteredRecipes = recipes?.filter(recipe =>
        recipe.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="page-header">
                    <div className="h-9 bg-gray-200 dark:bg-white/10 rounded w-56"></div>
                    <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-80 mt-3"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="card p-0 overflow-hidden">
                            <div className="h-48 bg-gray-200 dark:bg-white/10 rounded-t-[2rem]"></div>
                            <div className="p-5 space-y-3">
                                <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-full"></div>
                                <div className="h-10 bg-gray-100 dark:bg-white/5 rounded-2xl mt-4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-fade-in">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-3 mb-1">
                        <BookOpen className="w-7 h-7 text-emerald-600 dark:text-green-400" />
                        <h1 className="page-title">Healthy Indian Cookbook</h1>
                    </div>
                    <p className="page-subtitle">Discover nutritious, authentic Indian recipes curated for your health metrics and meal plan</p>
                </div>

                {/* Search */}
                <div className="relative shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search recipes..."
                        className="input-field pl-11 py-3 w-full md:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-white/40">
                <span className="font-bold">
                    {filteredRecipes?.length ?? 0}
                    <span className="font-normal ml-1">recipe{filteredRecipes?.length !== 1 ? 's' : ''}</span>
                </span>
                {isPremium && (
                    <span className="badge badge-gold inline-flex items-center gap-1.5">
                        <Crown className="w-3 h-3" /> Premium Access
                    </span>
                )}
            </div>

            {/* Recipe Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes?.map((recipe) => {
                    const isLocked = recipe.is_premium && !isPremium;

                    return (
                        <div key={recipe.id} className="card card-hover p-0 overflow-hidden group">
                            {/* Recipe Image */}
                            <div className="relative h-48 overflow-hidden rounded-t-[2rem]">
                                <img
                                    src={recipe.image_url || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400'}
                                    alt={recipe.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                                {/* Premium badge */}
                                {recipe.is_premium && (
                                    <div className="absolute top-3 right-3 bg-amber-500 text-white px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-lg shadow-amber-500/30 uppercase tracking-wider">
                                        <Crown className="w-3 h-3" />
                                        Premium
                                    </div>
                                )}

                                {/* Title overlay on image */}
                                <div className="absolute bottom-4 left-4 right-4">
                                    <span className="text-[10px] font-black bg-emerald-600/90 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest backdrop-blur-sm">
                                        Healthy
                                    </span>
                                    <h3 className="text-lg font-black text-white mt-1.5 tracking-tight line-clamp-1 drop-shadow">
                                        {recipe.name}
                                    </h3>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5">
                                <p className="text-gray-500 dark:text-white/50 text-sm line-clamp-2 mb-4 leading-relaxed">
                                    {recipe.description}
                                </p>

                                {/* Meta row */}
                                <div className="flex items-center justify-between text-xs font-bold text-gray-400 dark:text-white/40 mb-5">
                                    <div className="flex items-center gap-1.5 text-orange-500">
                                        <Flame className="w-3.5 h-3.5" />
                                        <span>{Math.round(recipe.calories || 0)} kcal</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[#40916c]">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>15–20 min</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-white/30">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>{recipe.ingredients?.length || 0} ingredients</span>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                {isLocked ? (
                                    <Link
                                        to="/subscription"
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl font-bold text-sm border-2 border-amber-200 dark:border-amber-800/50 hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:hover:bg-amber-500 dark:hover:text-white transition-all"
                                    >
                                        <Lock className="w-4 h-4" />
                                        Upgrade to Unlock
                                    </Link>
                                ) : (
                                    <Link
                                        to={`/cookbook/${recipe.id}`}
                                        className="btn-primary w-full text-sm py-3"
                                    >
                                        View Full Recipe
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Empty State */}
                {filteredRecipes?.length === 0 && (
                    <div className="col-span-full">
                        <div className="card flex flex-col items-center py-16 gap-4 text-gray-400 dark:text-white/30">
                            <BookOpen className="w-14 h-14 opacity-30" />
                            <p className="font-bold text-lg">No recipes found</p>
                            <p className="text-sm">Try a different search term</p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="btn-secondary mt-2 text-sm py-2 px-6"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cookbook;
