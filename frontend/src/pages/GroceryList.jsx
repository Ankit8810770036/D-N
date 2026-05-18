import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ShoppingBag, CheckCircle, Circle, Printer, Copy, RefreshCw, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const GroceryList = () => {
    const queryClient = useQueryClient();
    const [checkedItems, setCheckedItems] = useState({});

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['grocery-list'],
        queryFn: async () => {
            const response = await api.get('/grocery-list');
            return response.data;
        }
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ item_ids, is_bought }) => {
            const response = await api.put('/grocery-toggle', { item_ids, is_bought });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['grocery-list']);
        }
    });

    const handleToggle = (item) => {
        const isBought = !item.is_bought;
        toggleMutation.mutate({ item_ids: item.item_ids, is_bought: isBought });
    };

    const handleCopy = () => {
        const text = data?.groceries?.map(item => `${item.name}: ${item.total_quantity} ${item.unit}`).join('\n');
        if (text) {
            navigator.clipboard.writeText(text);
            toast.success('List copied to clipboard!');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const groceries = data?.groceries || [];

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fade-in font-outfit">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <ShoppingBag className="w-10 h-10 text-emerald-600" />
                        Smart Grocery List
                    </h1>
                    <p className="page-subtitle">Aggregated ingredients from your next {data?.days_found || 0} days of meal plans.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleCopy} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
                        <Copy className="w-4 h-4" /> Copy
                    </button>
                    <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    <button onClick={() => refetch()} className="btn-primary flex items-center gap-2 text-sm py-2 px-4 shadow-emerald-200">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            {groceries.length === 0 ? (
                <div className="card flex flex-col items-center py-16 gap-4 text-center border-dashed border-2">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl shadow-inner">🛒</div>
                    <div>
                        <h3 className="text-xl font-black text-gray-800 dark:text-white/90">Your list is empty</h3>
                        <p className="text-gray-500 max-w-xs mt-2">Generate a meal plan in the Planner section to automatically populate your shopping list.</p>
                    </div>
                    <a href="/planner" className="btn-primary mt-4">Go to Diet Planner →</a>
                </div>
            ) : (
                <div className="grid gap-4">
                    {groceries.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleToggle(item)}
                            className={`card p-5 group cursor-pointer transition-all border-2 flex items-center justify-between
                                ${item.is_bought
                                    ? 'bg-gray-50/50 border-gray-100 opacity-60'
                                    : 'hover:border-emerald-200 bg-white hover:shadow-xl hover:-translate-y-1'}`}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                    ${item.is_bought ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                    {item.is_bought ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold tracking-tight ${item.is_bought ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-white/90'}`}>
                                        {item.name}
                                    </h3>
                                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest text-[10px]">
                                        {item.category || 'Pantry Staple'}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className={`text-2xl font-black tracking-tighter ${item.is_bought ? 'text-gray-300' : 'text-emerald-700'}`}>
                                    {item.total_quantity}
                                    <span className="text-sm font-bold text-gray-400 ml-1 uppercase">{item.unit}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Hint */}
            <div className="bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-2xl">💡</div>
                    <div className="flex-1">
                        <h4 className="font-black text-lg">Did you know?</h4>
                        <p className="text-emerald-100/70 text-sm">Following a grocery list reduces impulse buys by 35% and ensures you hit your macro targets with 100% precision.</p>
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

export default GroceryList;
