import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    ShoppingBag, 
    CheckCircle, 
    Circle, 
    Printer, 
    Copy, 
    RefreshCw, 
    Calendar, 
    Tag, 
    FileDown, 
    Share2, 
    MessageCircle,
    Loader2,
    Check
} from 'lucide-react';
import toast from 'react-hot-toast';

// Map category slugs → human labels + emoji
const CATEGORY_META = {
    'vegetables':  { label: 'Vegetables',       emoji: '🥦' },
    'fruits':      { label: 'Fruits',           emoji: '🍎' },
    'grains':      { label: 'Grains & Cereals', emoji: '🌾' },
    'protein':     { label: 'Protein Foods',    emoji: '🍗' },
    'dairy':       { label: 'Dairy',            emoji: '🥛' },
    'nuts':        { label: 'Nuts & Seeds',     emoji: '🥜' },
    'oils':        { label: 'Oils & Fats',      emoji: '🫙' },
    'spices':      { label: 'Spices & Herbs',   emoji: '🌿' },
    'beverages':   { label: 'Beverages',        emoji: '🥤' },
    'legumes':     { label: 'Legumes & Pulses', emoji: '🫘' },
    'seafood':     { label: 'Seafood',          emoji: '🐟' },
    'custom':      { label: 'Custom Foods',     emoji: '✨' },
    'other':       { label: 'Other',            emoji: '🛒' },
};

function getCategoryMeta(cat) {
    const key = (cat || 'other').toLowerCase();
    return CATEGORY_META[key] || { label: cat || 'Other', emoji: '🛒' };
}

const GroceryList = () => {
    const queryClient = useQueryClient();
    const navigate    = useNavigate();
    const { user }    = useAuth();
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [copied, setCopied] = useState(false);

    const getLocalToday = () => {
        return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    };

    const localToday = getLocalToday();

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['grocery-list'],
        queryFn: async () => {
            const response = await api.get(`/grocery-list?date=${localToday}`);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 min cache
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ item_ids, is_bought }) => {
            const response = await api.put('/grocery-toggle', { item_ids, is_bought });
            return response.data;
        },
        onMutate: async ({ item_ids, is_bought }) => {
            await queryClient.cancelQueries({ queryKey: ['grocery-list'] });

            const previousData = queryClient.getQueryData(['grocery-list']);

            if (previousData) {
                queryClient.setQueryData(['grocery-list'], old => {
                    if (!old || !old.groceries) return old;
                    return {
                        ...old,
                        groceries: old.groceries.map(g => 
                            JSON.stringify(g.item_ids) === JSON.stringify(item_ids) 
                                ? { ...g, is_bought } 
                                : g
                        )
                    };
                });
            }

            return { previousData };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['grocery-list'], context.previousData);
            }
            toast.error('Failed to update item.');
        }
    });

    const handleToggle = (item) => {
        const currentData = queryClient.getQueryData(['grocery-list']);
        let currentState = item.is_bought;
        
        if (currentData && currentData.groceries) {
            const cacheItem = currentData.groceries.find(g => JSON.stringify(g.item_ids) === JSON.stringify(item.item_ids));
            if (cacheItem) {
                currentState = cacheItem.is_bought;
            }
        }
        
        toggleMutation.mutate({ item_ids: item.item_ids, is_bought: !currentState });
    };

    const groceries  = data?.groceries  || [];
    const planDates  = data?.plan_dates  || [];
    const dateRange  = data?.date_range  || null;
    const daysFound  = data?.days_found  || 0;

    // Group items by category
    const grouped = groceries.reduce((acc, item) => {
        const cat = (item.category || 'other').toLowerCase();
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    // Build structured text for WhatsApp and Clipboard
    const generateFormattedText = () => {
        let lines = [];
        lines.push(`🛒 *Weekly Grocery Shopping List*`);
        if (dateRange) {
            lines.push(`📅 *Period:* ${dateRange} (${daysFound} days)`);
        }
        if (user?.name) {
            lines.push(`👤 *Plan for:* ${user.name}`);
        }
        lines.push('');

        const sortedCats = Object.keys(grouped).sort();
        sortedCats.forEach(cat => {
            const meta = getCategoryMeta(cat);
            const items = grouped[cat];
            lines.push(`${meta.emoji} *${meta.label.toUpperCase()}*`);
            items.forEach(item => {
                const checkMark = item.is_bought ? '[✓]' : '[ ]';
                lines.push(`${checkMark} ${item.name} — ${item.total_quantity} ${item.unit}`);
            });
            lines.push('');
        });

        lines.push(`_Generated via Diet & Nutrition Planner_`);
        return lines.join('\n');
    };

    const handleWhatsAppShare = () => {
        if (groceries.length === 0) {
            toast.error('Your grocery list is empty.');
            return;
        }
        const text = generateFormattedText();
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        toast.success('Opening WhatsApp... 💬');
    };

    const handleDownloadPDF = async () => {
        if (groceries.length === 0) {
            toast.error('Your grocery list is empty.');
            return;
        }
        setDownloadingPdf(true);
        try {
            const response = await api.get(`/grocery-list/pdf?date=${localToday}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `grocery_shopping_list_${localToday}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Grocery list PDF downloaded! 📄');
        } catch (err) {
            console.error('PDF download error:', err);
            toast.error('Failed to download PDF. Please try again.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleCopy = () => {
        if (groceries.length === 0) return;
        const text = generateFormattedText();
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Formatted shopping list copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
    };

    const handlePrint = () => window.print();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
            </div>
        );
    }

    const boughtCount = groceries.filter(i => i.is_bought).length;
    const progress    = groceries.length > 0 ? Math.round((boughtCount / groceries.length) * 100) : 0;

    return (
        <div className="w-full space-y-8 pb-20 font-outfit animate-fade-in">

            {/* ── Header ── */}
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <ShoppingBag className="w-9 h-9 text-emerald-600" />
                        Smart Grocery List
                    </h1>
                    {dateRange ? (
                        <p className="page-subtitle flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            Covering your meal plans: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{dateRange}</span>
                            <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{daysFound} day{daysFound !== 1 ? 's' : ''}</span>
                        </p>
                    ) : (
                        <p className="page-subtitle">No upcoming meal plans found.</p>
                    )}
                </div>

                {/* ── Action Buttons ── */}
                <div className="flex gap-2 flex-wrap items-center">
                    {/* WhatsApp Button */}
                    <button
                        onClick={handleWhatsAppShare}
                        disabled={groceries.length === 0}
                        title="Share consolidated grocery list to WhatsApp"
                        className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2 px-3.5 rounded-xl text-sm flex items-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                    >
                        <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                        <span>WhatsApp</span>
                    </button>

                    {/* PDF Download Button */}
                    <button
                        onClick={handleDownloadPDF}
                        disabled={groceries.length === 0 || downloadingPdf}
                        title="Download printable PDF shopping list"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-sm flex items-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                    >
                        {downloadingPdf ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileDown className="w-4 h-4" />
                        )}
                        <span>{downloadingPdf ? 'Exporting...' : 'PDF List'}</span>
                    </button>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        disabled={groceries.length === 0}
                        title="Copy structured list with checkboxes"
                        className="btn-secondary flex items-center gap-2 text-sm py-2 px-3 disabled:opacity-40"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    {/* Print Button */}
                    <button
                        onClick={handlePrint}
                        disabled={groceries.length === 0}
                        title="Print shopping list"
                        className="btn-secondary flex items-center gap-2 text-sm py-2 px-3 disabled:opacity-40"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Print</span>
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        title="Refresh grocery list"
                        className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ── Date pills ── */}
            {planDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {planDates.map(d => (
                        <span key={d} className="inline-flex items-center gap-1 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                            <Calendar className="w-3 h-3" /> {d}
                        </span>
                    ))}
                </div>
            )}

            {/* ── Progress bar ── */}
            {groceries.length > 0 && (
                <div className="card py-4 px-5 flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                            <span>{boughtCount} of {groceries.length} items bought</span>
                            <span className="text-emerald-600 font-bold">{progress}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    {progress === 100 && (
                        <span className="text-2xl animate-bounce" title="All done!">🎉</span>
                    )}
                </div>
            )}

            {/* ── Empty State ── */}
            {groceries.length === 0 ? (
                <div className="card flex flex-col items-center py-16 gap-4 text-center border-dashed border-2 border-slate-200">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl shadow-inner">🛒</div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white/90">Your list is empty</h3>
                        <p className="text-slate-500 max-w-xs mt-2 text-sm">
                            Generate a meal plan for today or upcoming days in the Planner — your shopping list will automatically fill up here.
                        </p>
                    </div>
                    <button onClick={() => navigate('/planner')} className="btn-primary mt-4">
                        Go to Diet Planner →
                    </button>
                </div>
            ) : (
                /* ── Grouped Items ── */
                <div className="space-y-6">
                    {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => {
                        const meta        = getCategoryMeta(cat);
                        const allBought   = items.every(i => i.is_bought);
                        const boughtInCat = items.filter(i => i.is_bought).length;

                        return (
                            <div key={cat}>
                                {/* Category header */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">{meta.emoji}</span>
                                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">{meta.label}</h2>
                                    <span className="ml-auto text-xs font-semibold text-slate-400">{boughtInCat}/{items.length}</span>
                                    <div className={`w-2 h-2 rounded-full ${allBought ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>

                                <div className="grid gap-3">
                                    {items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleToggle(item)}
                                            className={`card p-4 group cursor-pointer transition-all border flex items-center justify-between gap-4
                                                ${item.is_bought
                                                    ? 'bg-slate-50/60 dark:bg-gray-800/30 border-slate-100 dark:border-gray-700/50 opacity-60'
                                                    : 'hover:border-emerald-300 bg-white dark:bg-gray-800 hover:shadow-md hover:-translate-y-0.5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                {/* Checkbox circle */}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                                                    ${item.is_bought
                                                        ? 'bg-emerald-500 text-white shadow-sm'
                                                        : 'bg-slate-100 dark:bg-gray-700 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                                                    }`}>
                                                    {item.is_bought
                                                        ? <CheckCircle className="w-5 h-5" />
                                                        : <Circle className="w-5 h-5" />
                                                    }
                                                </div>

                                                <div className="min-w-0">
                                                    <p className={`font-bold text-base tracking-tight truncate
                                                        ${item.is_bought ? 'line-through text-slate-400 dark:text-gray-500' : 'text-slate-800 dark:text-white/90'}`}>
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                        <Tag className="w-2.5 h-2.5" /> {meta.label}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quantity badge */}
                                            <div className="shrink-0 text-right">
                                                <p className={`text-2xl font-black tabular-nums leading-none
                                                    ${item.is_bought ? 'text-slate-300' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                                    {item.total_quantity}
                                                    <span className="text-xs font-bold text-slate-400 ml-1 uppercase">
                                                        {item.unit}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Tip Banner ── */}
            <div className="bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-2xl shrink-0">💡</div>
                    <div className="flex-1">
                        <h4 className="font-black text-lg">Pro Grocery Tip</h4>
                        <p className="text-emerald-100/70 text-sm mt-1">
                            Click <strong>WhatsApp</strong> to instantly send your grocery checklist to family members, or click <strong>PDF List</strong> to generate a clean, categorized shopping sheet for supermarket visits.
                        </p>
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
};

export default GroceryList;
