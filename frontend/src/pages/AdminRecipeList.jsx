import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { BookOpen, Plus, Trash2, Edit3, ArrowLeft, Crown, Flame, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminRecipeModal from '../components/AdminRecipeModal';
import useDebounce from '../hooks/useDebounce';

const AdminRecipeList = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingRecipe, setEditingRecipe] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const debouncedSearch = useDebounce(searchTerm, 250);

    const { data: recipes, isLoading } = useQuery({
        queryKey: ['adminRecipes'],
        queryFn: async () => {
            const response = await api.get('/recipes');
            return response.data;
        }
    });

    const saveMutation = useMutation({
        mutationFn: async ({ formData, editingRecipe }) => {
            if (editingRecipe) {
                return api.put(`/recipes/${editingRecipe.id}`, formData);
            }
            return api.post('/recipes', formData);
        },
        onSuccess: (response, variables) => {
            const savedRecipe = response.data;
            const wasEditing = !!variables.editingRecipe;

            // Immediately update the cache with fresh server data
            queryClient.setQueryData(['adminRecipes'], (oldData) => {
                if (!Array.isArray(oldData)) return oldData;
                if (wasEditing) {
                    return oldData.map(r => r.id === savedRecipe.id ? savedRecipe : r);
                }
                return [savedRecipe, ...oldData];
            });
            queryClient.invalidateQueries({ queryKey: ['recipes'] });

            toast.success(wasEditing ? 'Recipe updated' : 'Recipe created');
            handleCloseModal();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (recipeId) => {
            return api.delete(`/recipes/${recipeId}`);
        },
        onSuccess: (_, recipeId) => {
            queryClient.setQueryData(['adminRecipes'], (oldData) => {
                if (!Array.isArray(oldData)) return oldData;
                return oldData.filter(r => r.id !== recipeId);
            });
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
            toast.success('Recipe deleted');
        }
    });

    const handleCreate = () => { setEditingRecipe(null); setIsModalOpen(true); };
    const handleEdit = (recipe) => { setEditingRecipe(recipe); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingRecipe(null); };

    const filteredRecipes = recipes?.filter(r =>
        r.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse pb-20">
                <div className="page-header">
                    <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-56"></div>
                    <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-72 mt-3"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => <div key={i} className="card h-64"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-fade-in">

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </Link>
                    <div className="page-header mb-0">
                        <h1 className="page-title text-3xl">Cookbook Management</h1>
                        <p className="page-subtitle text-sm mt-0">Curate premium and standard recipes</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search recipes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 py-2.5 text-sm w-full md:w-56"
                        />
                    </div>
                    <button onClick={handleCreate} className="btn-primary py-2.5 px-5 text-sm">
                        <Plus className="w-4 h-4" /> Create Recipe
                    </button>
                </div>
            </div>

            {/* Recipe Grid */}
            {filteredRecipes?.length === 0 ? (
                <div className="card flex flex-col items-center py-16 gap-4 text-gray-400">
                    <BookOpen className="w-12 h-12 opacity-30" />
                    {searchTerm ? (
                        <>
                            <p className="font-medium">No recipes found for "{searchTerm}"</p>
                            <button onClick={() => setSearchTerm('')} className="btn-secondary mt-2 text-sm py-2 px-6">Clear Search</button>
                        </>
                    ) : (
                        <>
                            <p className="font-medium">No recipes yet. Create your first recipe!</p>
                            <button onClick={handleCreate} className="btn-primary mt-2">
                                <Plus className="w-4 h-4" /> Create Recipe
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecipes?.map((recipe) => (
                        <div key={recipe.id} className="card card-hover p-0 overflow-hidden group">
                            {/* Recipe Image */}
                            <div className="h-44 bg-gray-100 dark:bg-white/5 relative overflow-hidden rounded-t-[2rem]">
                                {recipe.image_url ? (
                                    <img
                                        src={recipe.image_url}
                                        alt={recipe.name}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-white/20">
                                        <BookOpen className="w-10 h-10" />
                                    </div>
                                )}
                                {recipe.is_premium && (
                                    <div className="absolute top-3 right-3 bg-amber-500 text-white p-1.5 rounded-xl shadow-lg shadow-amber-500/30">
                                        <Crown className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {/* Recipe Info */}
                            <div className="p-5">
                                <h3 className="font-black text-gray-800 dark:text-white tracking-tight mb-2 line-clamp-1">{recipe.name}</h3>
                                <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-5">
                                    <span className="flex items-center gap-1 text-orange-500">
                                        <Flame className="w-3 h-3" /> {recipe.calories || 0} kcal
                                    </span>
                                    <span className="flex items-center gap-1 text-[#40916c]">
                                        <BookOpen className="w-3 h-3" /> {recipe.ingredients?.length || 0} ingredients
                                    </span>
                                    {recipe.is_premium && (
                                        <span className="badge badge-gold py-0.5">Premium</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handleEdit(recipe)}
                                            className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-[#2d6a4f] dark:text-green-400 rounded-xl transition-colors"
                                            title="Edit Recipe"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { if (window.confirm('Delete this recipe?')) deleteMutation.mutate(recipe.id); }}
                                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-xl transition-colors"
                                            title="Delete Recipe"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-300 dark:text-white/20 uppercase tracking-widest">#{recipe.id}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AdminRecipeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                recipe={editingRecipe}
                onSave={(formData) => saveMutation.mutate({ formData, editingRecipe })}
                loading={saveMutation.isPending}
            />
        </div>
    );
};

export default AdminRecipeList;
