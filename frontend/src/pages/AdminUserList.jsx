import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Crown, Mail, Calendar, ArrowLeft, MoreVertical, CheckCircle, Trash2 } from 'lucide-react';
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
            queryClient.invalidateQueries(['adminUsers']);
            toast.success('User updated successfully');
        }
    });

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
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Manage Users</h1>
                        <p className="text-gray-500 text-sm font-medium">Control roles and subscription levels</p>
                    </div>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-indigo-700">{users?.length} Registered</span>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Plan</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Profile</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users?.map((user) => (
                                <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-blue-500'}`}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white/90">
                                                    {user.name}
                                                    {user.id === currentUser?.id && <span className="ml-2 text-[10px] bg-indigo-50 color-indigo-600 px-1.5 py-0.5 rounded-md border border-indigo-100">YOU</span>}
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
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase">
                                                <Shield className="w-3 h-3" /> Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase">
                                                User
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.plan_type === 'premium' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-black uppercase">
                                                <Crown className="w-3 h-3" /> Premium
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-black uppercase">
                                                Basic
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.profile ? (
                                            <div className="text-xs space-y-1">
                                                <p className="text-gray-600 font-bold">{user.profile.goal?.replace('_', ' ').toUpperCase()}</p>
                                                <p className="text-gray-400">{user.profile.calories_target} kcal/day</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300 italic">No Profile</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.id !== currentUser?.id && (
                                                <>
                                                    {user.plan_type === 'basic' && (
                                                        <button
                                                            onClick={() => updateMutation.mutate({ userId: user.id, data: { plan_type: 'premium' } })}
                                                            className="p-2 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                                                            title="Give Premium"
                                                        >
                                                            <Crown className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {user.role === 'user' ? (
                                                        <button
                                                            onClick={() => updateMutation.mutate({ userId: user.id, data: { role: 'admin' } })}
                                                            className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                                                            title="Make Admin"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Are you sure you want to remove admin privileges from this user?')) {
                                                                    updateMutation.mutate({ userId: user.id, data: { role: 'user' } });
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                                            title="Remove Admin"
                                                        >
                                                            <Shield className="w-4 h-4 fill-current" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            <button className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
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
