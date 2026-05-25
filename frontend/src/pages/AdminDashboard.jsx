import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
    Users, Utensils, BookOpen, Crown, Flame,
    Settings, ShieldAlert, TrendingUp
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
            <div className="space-y-6 animate-pulse">
                <div className="page-header">
                    <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-48"></div>
                    <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-80 mt-3"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="card h-28"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <ShieldAlert className="w-14 h-14 text-rose-400" />
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Access Denied</h1>
                <p className="text-gray-500 text-center max-w-sm">Could not load administrative statistics. Please ensure you are logged in as an administrator.</p>
                <Link to="/dashboard" className="btn-primary mt-2">Return to Dashboard</Link>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Users',     value: stats.users_count || 0,                                              icon: Users,    color: 'text-[#2d6a4f]',  bg: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Premium Users',   value: stats.premium_users || 0,                                            icon: Crown,    color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Total Foods',     value: stats.foods_count || 0,                                              icon: Utensils, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Recipes',         value: stats.recipes_count || 0,                                            icon: BookOpen, color: 'text-[#1b4332]',  bg: 'bg-green-100 dark:bg-green-900/30' },
        { label: 'Calories Logged', value: `${Math.round((stats.total_calories_logged || 0) / 1000)}k+`,       icon: Flame,    color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-900/20' },
    ];

    const handleExport = async () => {
        try {
            const response = await api.get('/admin/export-users', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
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
        } catch (err) {
            console.error('Cache refresh failed.', err);
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-fade-in">

            {/* Page Header */}
            <div className="page-header">
                <div className="flex items-center gap-3 mb-1">
                    <ShieldAlert className="w-7 h-7 text-[#2d6a4f]" />
                    <h1 className="page-title">Admin Panel</h1>
                </div>
                <p className="page-subtitle">Monitor system-wide metrics and manage platform data resources.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statCards.map((card, idx) => (
                    <div key={idx} className="metric-card card-hover group">
                        <div className={`p-3 rounded-2xl ${card.bg} ${card.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <p className="metric-lbl">{card.label}</p>
                        <p className="metric-val text-2xl">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Management Links + Admin Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Data Management */}
                <div className="card">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2 text-lg">
                        <Settings className="w-5 h-5 text-[#2d6a4f]" />
                        Data Management
                    </h2>
                    <div className="space-y-3">
                        <Link
                            to="/admin/users"
                            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-[#40916c]/40 hover:bg-green-50 dark:hover:bg-white/10 transition-all group"
                        >
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-[#2d6a4f] rounded-xl flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-white text-sm">User Accounts & Subscriptions</p>
                                <p className="text-xs text-gray-400">Manage roles and plan types</p>
                            </div>
                        </Link>

                        <Link
                            to="/admin/foods"
                            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-emerald-300/40 hover:bg-emerald-50 dark:hover:bg-white/10 transition-all group"
                        >
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <Utensils className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-white text-sm">Global Food Database</p>
                                <p className="text-xs text-gray-400">Add, edit, and remove food entries</p>
                            </div>
                        </Link>

                        <Link
                            to="/admin/recipes"
                            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-amber-300/40 hover:bg-amber-50 dark:hover:bg-white/10 transition-all group"
                        >
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-white text-sm">Curated Cookbook Recipes</p>
                                <p className="text-xs text-gray-400">Manage premium and standard recipes</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Admin Actions */}
                <div className="card">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-[#2d6a4f]" />
                        Admin Actions
                    </h2>
                    <p className="page-subtitle text-sm mb-6">Quickly update system parameters or refresh data caches.</p>
                    <div className="space-y-3">
                        <button onClick={handleRefreshCache} className="btn-secondary w-full justify-center">
                            Refresh Nutritional Cache
                        </button>
                        <button onClick={handleExport} className="btn-primary w-full">
                            Export User Data (CSV)
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
