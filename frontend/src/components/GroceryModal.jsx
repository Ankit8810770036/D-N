import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export default function GroceryModal({ isOpen, onClose }) {
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['groceryList'],
        queryFn: () => {
            const localToday = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
            return api.get(`/grocery-list?date=${localToday}`).then(res => res.data);
        },
        enabled: isOpen,
    })

    if (!isOpen) return null

    async function toggleBought(item) {
        await queryClient.cancelQueries({ queryKey: ['groceryList'] });
        const previousList = queryClient.getQueryData(['groceryList']);

        if (previousList) {
            queryClient.setQueryData(['groceryList'], old => {
                if (!old || !old.groceries) return old;
                return {
                    ...old,
                    groceries: old.groceries.map(g =>
                        g.name === item.name ? { ...g, is_bought: !g.is_bought } : g
                    )
                };
            });
        }

        try {
            await api.put('/grocery-toggle', {
                item_ids: item.item_ids,
                is_bought: !item.is_bought
            })
            queryClient.invalidateQueries({ queryKey: ['groceryList'] })
        } catch (err) {
            if (previousList) {
                queryClient.setQueryData(['groceryList'], previousList);
            }
            toast.error('Failed to update shopping list.')
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90dvh] landscape:max-h-[95dvh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white flex justify-between items-center shadow-lg shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">🛒</div>
                        <div>
                            <h2 className="text-xl font-bold">Shopping List</h2>
                            <p className="text-xs text-green-100 opacity-80">Next 7 days of ingredients</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="animate-spin w-10 h-10 border-4 border-[#2d6a4f] border-t-transparent rounded-full" />
                            <p className="text-sm text-gray-500 font-medium">Assembling your list...</p>
                        </div>
                    ) : data?.groceries?.length > 0 ? (
                        <div className="space-y-2">
                            {data.groceries.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => toggleBought(item)}
                                    className={`group flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98]
                                        ${item.is_bought
                                            ? 'bg-gray-50 border-gray-100 opacity-60'
                                            : 'bg-white border-white hover:border-[#2d6a4f]/30 shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0
                                        ${item.is_bought
                                            ? 'bg-[#2d6a4f] border-[#2d6a4f]'
                                            : 'bg-white border-gray-200 group-hover:border-[#2d6a4f]'
                                        }`}
                                    >
                                        {item.is_bought && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold transition-all ${item.is_bought ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {item.total_quantity} {item.unit} needed
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <span className="text-5xl">🥡</span>
                            <div className="space-y-1">
                                <p className="font-bold text-gray-700">Empty Pantry!</p>
                                <p className="text-sm text-gray-500">Generate a meal plan to see what you need to buy.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 shrink-0 flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                        {data?.groceries?.filter(g => g.is_bought).length || 0} of {data?.groceries?.length || 0} items bought
                    </p>
                    <button onClick={onClose} className="btn-primary btn-sm px-6">Done</button>
                </div>
            </div>
        </div>
    )
}
