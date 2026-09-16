import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Crown, Mail, ArrowLeft, Trash2 } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminUserList = () => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    const { data: users, isLoading } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const response = await api.get('/admin/users');
            return response.data;
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ userId, data }) => {
            return api.put(`/admin/users/${userId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            toast.success('User updated successfully');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (userId) => {
            return api.delete(`/admin/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            toast.success('User deleted successfully');
        }
    });

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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </Link>
                    <div className="page-header mb-0">
                        <h1 className="page-title text-3xl">Manage Users</h1>
                        <p className="page-subtitle text-sm mt-0">Control roles and subscription levels</p>
                    </div>
                </div>
                <div className="badge badge-green flex items-center gap-2 px-4 py-2">
                    <Users className="w-4 h-4" />
                    <span>{users?.length} Registered</span>
                </div>
            </div>

            {/* Users Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/10">
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Plan</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Profile</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {users?.map((user) => (
                                <tr key={user.id} className="hover:bg-green-50/40 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={user} size="md" />
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white/90 text-sm">
                                                    {user.name}
                                                    {user.id === currentUser?.id && (
                                                        <span className="ml-2 text-[10px] bg-green-50 dark:bg-green-900/30 text-[#2d6a4f] dark:text-green-400 px-1.5 py-0.5 rounded-md border border-green-100 dark:border-green-800 font-black uppercase">YOU</span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === 'admin' ? (
                                            <span className="badge badge-green inline-flex items-center gap-1.5">
                                                <Shield className="w-3 h-3" /> Admin
                                            </span>
                                        ) : (
                                            <span className="badge badge-blue">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.plan_type === 'premium' ? (
                                            <span className="badge badge-gold inline-flex items-center gap-1.5">
                                                <Crown className="w-3 h-3" /> Premium
                                            </span>
                                        ) : (
                                            <span className="badge bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/10">Basic</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.profile ? (
                                            <div className="text-xs space-y-0.5">
                                                <p className="text-gray-700 dark:text-white/80 font-bold">{user.profile.goal?.replace('_', ' ').toUpperCase()}</p>
                                                <p className="text-gray-400">{user.profile.calories_target} kcal/day</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300 dark:text-white/20 italic">No Profile</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.id !== currentUser?.id && (
                                                <>
                                                    {user.plan_type === 'basic' ? (
                                                        <button
                                                            onClick={() => updateMutation.mutate({ userId: user.id, data: { plan_type: 'premium' } })}
                                                            className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 rounded-xl transition-colors"
                                                            title="Give Premium"
                                                        >
                                                            <Crown className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Remove premium access from this user?')) {
                                                                    updateMutation.mutate({ userId: user.id, data: { plan_type: 'basic' } });
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 rounded-xl transition-colors"
                                                            title="Remove Premium"
                                                        >
                                                            <Crown className="w-4 h-4 opacity-50" />
                                                        </button>
                                                    )}
                                                    {user.role === 'user' ? (
                                                        <button
                                                            onClick={() => updateMutation.mutate({ userId: user.id, data: { role: 'admin' } })}
                                                            className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-[#2d6a4f] dark:text-green-400 rounded-xl transition-colors"
                                                            title="Make Admin"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Remove admin privileges from this user?')) {
                                                                    updateMutation.mutate({ userId: user.id, data: { role: 'user' } });
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-xl transition-colors"
                                                            title="Remove Admin"
                                                        >
                                                            <Shield className="w-4 h-4 fill-current" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to completely delete this user? This cannot be undone.')) {
                                                                deleteMutation.mutate(user.id);
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUserList;
