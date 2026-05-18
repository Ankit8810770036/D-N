import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { BookOpen, Plus, Trash2, Edit3, ArrowLeft, Crown, Flame, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminRecipeModal from '../components/AdminRecipeModal';

const AdminRecipeList = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingRecipe, setEditingRecipe] = React.useState(null);

    const { data: recipes, isLoading } = useQuery({
        queryKey: ['adminRecipes'],
        queryFn: async () => {
            const response = await api.get('/recipes');
            return response.data;
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (formData) => {
            if (editingRecipe) {
                return api.put(`/recipes/${editingRecipe.id}`, formData);
            }
            return api.post('/recipes', formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminRecipes']);
            toast.success(editingRecipe ? 'Recipe updated' : 'Recipe created');
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
        onSuccess: () => {
            queryClient.invalidateQueries(['adminRecipes']);
            toast.success('Recipe deleted');
        }
    });

    const handleCreate = () => {
        setEditingRecipe(null);
        setIsModalOpen(true);
    };

    const handleEdit = (recipe) => {
        setEditingRecipe(recipe);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRecipe(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cookbook Management</h1>
                        <p className="text-gray-500 text-sm font-medium">Curate premium and standard recipes</p>
                    </div>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-violet-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all"
                >
                    <Plus className="w-4 h-4" /> Create Recipe
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes?.map((recipe) => (
                    <div key={recipe.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                        <div className="h-40 bg-gray-200 relative overflow-hidden">
                            {recipe.image_url ? (
                                <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                            )}
                            {recipe.is_premium && (
                                <div className="absolute top-4 right-4 bg-amber-500 text-white p-1.5 rounded-lg shadow-lg">
                                    <Crown className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <h3 className="font-black text-gray-800 dark:text-white/90 uppercase tracking-tight mb-2 line-clamp-1">{recipe.name}</h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">
                                <span className="flex items-center gap-1 text-orange-500"><Flame className="w-3 h-3" /> {recipe.calories || 0} kcal</span>
                                <span className="flex items-center gap-1 text-blue-500"><BookOpen className="w-3 h-3" /> {recipe.ingredients?.length || 0} Ing.</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(recipe)}
                                        className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Delete recipe?')) deleteMutation.mutate(recipe.id);
                                        }}
                                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Recipe #{recipe.id}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AdminRecipeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                recipe={editingRecipe}
                onSave={(data) => saveMutation.mutate(data)}
                loading={saveMutation.isPending}
            />
        </div>
    );
};

export default AdminRecipeList;
