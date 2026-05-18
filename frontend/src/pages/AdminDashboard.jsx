import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
    Users, Utensils, BookOpen, Crown, Flame,
    Settings, ShieldAlert, TrendingUp, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['adminStats'],
        queryFn: async () => {
            const response = await api.get('/admin/stats');
            return response.data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-6 text-center">
                <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">Access Denied or Data Error</h1>
                <p className="text-gray-500">Could not load administrative statistics. Please ensure you are logged in as an administrator.</p>
                <Link to="/dashboard" className="inline-block mt-6 text-indigo-600 font-bold hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Users', value: stats.users_count || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Premium Users', value: stats.premium_users || 0, icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Total Foods', value: stats.foods_count || 0, icon: Utensils, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Cookbook Recipes', value: stats.recipes_count || 0, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Calories Logged', value: `${Math.round((stats.total_calories_logged || 0) / 1000)}k+`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
    ];

    const handleExport = async () => {
        try {
            const response = await api.get('/admin/export-users', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users_intelligence_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Export failed', err);
        }
    };

    const handleRefreshCache = async () => {
        try {
            await api.post('/admin/refresh-cache');
            toast.success('System cache synchronized!');
        } catch (err) {
            toast.error('Cache refresh failed.');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
            <div className="bg-gradient-to-r from-indigo-700 to-violet-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
                <div className="flex items-center gap-4 mb-2">
                    <ShieldAlert className="w-8 h-8 text-indigo-200" />
                    <h1 className="text-3xl font-black uppercase tracking-tight">System Admin Panel</h1>
                </div>
                <p className="text-indigo-100 font-medium">Monitoring system-wide metrics and managing data resources.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:shadow-md transition-all">
                        <div className={`p-3 rounded-xl ${card.bg} ${card.color} mb-3 group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                        <p className="text-2xl font-black text-gray-800 dark:text-white/90">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                        <Settings className="w-6 h-6 text-indigo-600" />
                        Data Management
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <Link to="/admin/users" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">U</div>
                                <span className="font-bold text-gray-700">User accounts & subscriptions</span>
                            </div>
                        </Link>
                        <Link to="/admin/foods" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold">F</div>
                                <span className="font-bold text-gray-700">Global food database</span>
                            </div>
                        </Link>
                        <Link to="/admin/recipes" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold">R</div>
                                <span className="font-bold text-gray-700">Curated Cookbook Recipes</span>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-black mb-4 uppercase tracking-tight flex items-center gap-2">
                            <Info className="w-6 h-6" />
                            Admin Actions
                        </h2>
                        <p className="text-indigo-200 mb-8 font-medium">Quickly update system parameters or refresh data caches.</p>
                        <div className="space-y-4">
                            <button
                                onClick={handleRefreshCache}
                                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all border border-white/20"
                            >
                                Refresh Nutritional Cache
                            </button>
                            <button
                                onClick={handleExport}
                                className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg shadow-indigo-950"
                            >
                                Export User Data (CSV)
                            </button>
                        </div>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
