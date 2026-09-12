import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Utensils, Search, Plus, Trash2, Edit3, ArrowLeft, Flame, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminFoodModal from '../components/AdminFoodModal';
import useDebounce from '../hooks/useDebounce';

const AdminFoodList = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 250);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFood, setEditingFood] = useState(null);

    const { data: foods, isLoading } = useQuery({
        queryKey: ['adminFoods'],
        queryFn: async () => {
            const response = await api.get('/foods?all=true');
            return response.data;
        }
    });

    const saveMutation = useMutation({
        mutationFn: async ({ formData, editingFood }) => {
            if (editingFood) {
                return api.put(`/foods/${editingFood.id}`, formData);
            }
            return api.post('/foods', formData);
        },
        onSuccess: (response, variables) => {
            const savedFood = response.data;
            const wasEditing = !!variables.editingFood;

            // Immediately update the cache with the server's fresh data
            queryClient.setQueryData(['adminFoods'], (oldData) => {
                if (!Array.isArray(oldData)) return oldData;
                if (wasEditing) {
                    return oldData.map(f => f.id === savedFood.id ? savedFood : f);
                }
                return [savedFood, ...oldData];
            });

            toast.success(wasEditing ? 'Food updated' : 'Food added');
            handleCloseModal();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (foodId) => {
            return api.delete(`/foods/${foodId}`);
        },
        onSuccess: (_, foodId) => {
            queryClient.setQueryData(['adminFoods'], (oldData) => {
                if (!Array.isArray(oldData)) return oldData;
                return oldData.filter(f => f.id !== foodId);
            });
            toast.success('Food item deleted');
        }
    });

    const handleAdd = () => { setEditingFood(null); setIsModalOpen(true); };
    const handleEdit = (food) => { setEditingFood(food); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingFood(null); };

    const foodItems = Array.isArray(foods) ? foods : (foods?.data || []);
    const filteredFoods = foodItems?.filter(food =>
        food.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        food.brand?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse pb-20">
                <div className="page-header">
                    <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-48"></div>
                    <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-72 mt-3"></div>
                </div>
                <div className="card h-64"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-fade-in">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </Link>
                    <div className="page-header mb-0">
                        <h1 className="page-title text-3xl">Food Database</h1>
                        <p className="page-subtitle text-sm mt-0">Manage global nutritional entries</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search database..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 py-2.5 text-sm w-full md:w-60"
                        />
                    </div>
                    <button onClick={handleAdd} className="btn-primary py-2.5 px-5 text-sm">
                        <Plus className="w-4 h-4" /> Add Food
                    </button>
                </div>
            </div>

            {/* Food Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/10">
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Name & Brand</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Calories</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Macros (P/C/F)</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Serving</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {filteredFoods?.map((food) => (
                                <tr key={food.id} className="hover:bg-green-50/40 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-[#2d6a4f] dark:text-green-400 rounded-xl flex items-center justify-center shrink-0">
                                                <Utensils className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white/90 text-sm">{food.name}</p>
                                                <p className="text-xs text-gray-400 uppercase tracking-wide">{food.brand || 'Generic'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-white/80">
                                        <div className="flex items-center gap-1.5">
                                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                                            {food.calories} <span className="text-gray-400 font-normal">kcal</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-3 text-xs">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[#2d6a4f] dark:text-green-400 font-black">{food.protein}g</span>
                                                <span className="text-gray-300 font-bold uppercase tracking-tighter">Prot</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-emerald-600 font-black">{food.carbs}g</span>
                                                <span className="text-gray-300 font-bold uppercase tracking-tighter">Carb</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-orange-500 font-black">{food.fat}g</span>
                                                <span className="text-gray-300 font-bold uppercase tracking-tighter">Fat</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <Scale className="w-3.5 h-3.5" />
                                            {food.serving_size}{food.serving_unit}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(food)}
                                                className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-[#2d6a4f] dark:text-green-400 rounded-xl transition-colors"
                                                title="Edit"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { if (window.confirm('Delete this food?')) deleteMutation.mutate(food.id); }}
                                                className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-xl transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredFoods?.length === 0 && (
                        <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                            <Utensils className="w-10 h-10 opacity-30" />
                            <p className="text-sm font-medium">No foods found matching "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </div>

            <AdminFoodModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                food={editingFood}
                onSave={(formData) => saveMutation.mutate({ formData, editingFood })}
                loading={saveMutation.isPending}
            />
        </div>
    );
};

export default AdminFoodList;
