import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Utensils, Search, Plus, Trash2, Edit3, ArrowLeft, Flame, Scale, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminFoodModal from '../components/AdminFoodModal';

const AdminFoodList = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFood, setEditingFood] = useState(null);

    const { data: foods, isLoading } = useQuery({
        queryKey: ['adminFoods'],
        queryFn: async () => {
            const response = await api.get('/foods');
            return response.data;
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (formData) => {
            if (editingFood) {
                return api.put(`/foods/${editingFood.id}`, formData);
            }
            return api.post('/foods', formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminFoods']);
            toast.success(editingFood ? 'Food updated' : 'Food added');
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
        onSuccess: () => {
            queryClient.invalidateQueries(['adminFoods']);
            toast.success('Food item deleted');
        }
    });

    const handleAdd = () => {
        setEditingFood(null);
        setIsModalOpen(true);
    };

    const handleEdit = (food) => {
        setEditingFood(food);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFood(null);
    };

    const foodItems = Array.isArray(foods) ? foods : (foods?.data || []);

    const filteredFoods = foodItems?.filter(food =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Food Database</h1>
                        <p className="text-gray-500 text-sm font-medium">Manage global nutritional entries</p>
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
                            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Add Food
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Name & Brand</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Calories</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Macros (P/C/F)</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Serving</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredFoods?.map((food) => (
                                <tr key={food.id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                                <Utensils className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white/90">{food.name}</p>
                                                <p className="text-xs text-gray-400 uppercase tracking-wide">{food.brand || 'Generic'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-700">
                                        <div className="flex items-center gap-1.5">
                                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                                            {food.calories} <span className="text-gray-400 font-normal">kcal</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-3 text-xs">
                                            <div className="flex flex-col items-center">
                                                <span className="text-blue-600 font-black">{food.protein}g</span>
                                                <span className="text-gray-300 font-bold uppercase tracking-tighter">Prot</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-emerald-600 font-black">{food.carbs}g</span>
                                                <span className="text-gray-300 font-bold uppercase tracking-tighter">Carb</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-red-500 font-black">{food.fat}g</span>
                                                <span className="text-gray-300 font-bold uppercase tracking-tighter">Fat</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Scale className="w-3.5 h-3.5" />
                                            {food.serving_size}{food.serving_unit}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(food)}
                                                className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this food?')) deleteMutation.mutate(food.id);
                                                }}
                                                className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminFoodModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                food={editingFood}
                onSave={(data) => saveMutation.mutate(data)}
                loading={saveMutation.isPending}
            />
        </div>
    );
};

export default AdminFoodList;
