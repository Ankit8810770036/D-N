import api from '../services/api';

/**
 * Helper to get local date string YYYY-MM-DD
 */
function getLocalToday() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

/**
 * Prefetch handler for TanStack Query based on target route
 * @param {string} to Target route URL
 * @param {import('@tanstack/react-query').QueryClient} queryClient 
 * @param {object} [user] Current logged in user object
 */
export function prefetchRoute(to, queryClient, user = null) {
    if (!queryClient) return;

    const today = getLocalToday();
    const cleanPath = (to || '').split('?')[0].toLowerCase();

    try {
        switch (cleanPath) {
            case '/cookbook':
            case '/recipes':
                queryClient.prefetchQuery({
                    queryKey: ['recipes', user?.id],
                    queryFn: async () => {
                        const response = await api.get('/recipes');
                        return response.data;
                    },
                    staleTime: 30 * 60 * 1000,
                });
                break;

            case '/planner':
                queryClient.prefetchQuery({
                    queryKey: ['mealPlan', today],
                    queryFn: async () => {
                        const res = await api.get(`/meal-plan?date=${today}`);
                        return res.data;
                    },
                    staleTime: 5 * 60 * 1000,
                });
                queryClient.prefetchQuery({
                    queryKey: ['profile'],
                    queryFn: async () => {
                        const res = await api.get('/profile');
                        return res.data?.data || res.data;
                    },
                    staleTime: 5 * 60 * 1000,
                });
                break;

            case '/shopping-list':
            case '/grocery-list':
                queryClient.prefetchQuery({
                    queryKey: ['grocery-list'],
                    queryFn: async () => {
                        const response = await api.get(`/grocery-list?date=${today}`);
                        return response.data;
                    },
                    staleTime: 5 * 60 * 1000,
                });
                break;

            case '/profile':
                queryClient.prefetchQuery({
                    queryKey: ['profile'],
                    queryFn: async () => {
                        const { data } = await api.get('/profile');
                        return data;
                    },
                    staleTime: 5 * 60 * 1000,
                });
                queryClient.prefetchQuery({
                    queryKey: ['summary'],
                    queryFn: async () => {
                        const { data } = await api.get('/report/summary');
                        return data;
                    },
                    staleTime: 5 * 60 * 1000,
                });
                break;

            case '/dashboard':
                queryClient.prefetchQuery({
                    queryKey: ['profile', today],
                    queryFn: async () => {
                        const res = await api.get(`/profile?date=${today}`);
                        return res.data;
                    },
                    staleTime: 5 * 60 * 1000,
                });
                queryClient.prefetchQuery({
                    queryKey: ['mealPlan', today],
                    queryFn: async () => {
                        const res = await api.get(`/meal-plan?date=${today}`);
                        return res.data;
                    },
                    staleTime: 5 * 60 * 1000,
                });
                queryClient.prefetchQuery({
                    queryKey: ['summary'],
                    queryFn: async () => {
                        const res = await api.get('/report/summary');
                        return res.data;
                    },
                    staleTime: 5 * 60 * 1000,
                });
                break;

            case '/admin':
            case '/admin/foods':
                if (user?.role === 'admin') {
                    queryClient.prefetchQuery({
                        queryKey: ['adminFoods'],
                        queryFn: async () => {
                            const response = await api.get('/foods?all=true');
                            return response.data;
                        },
                        staleTime: 30 * 60 * 1000,
                    });
                }
                break;

            default:
                break;
        }
    } catch (_) {
        // Silently catch prefetch errors in background
    }
}
