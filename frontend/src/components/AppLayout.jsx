import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import ChatBot from './ChatBot'
import FeedbackModal from './FeedbackModal'
import ErrorBoundary from './ErrorBoundary'
import { MessageSquarePlus } from 'lucide-react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

export default function AppLayout() {
    const location = useLocation()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
    const { user, daysUntilExpiry } = useAuth()

    useBodyScrollLock(isSidebarOpen)

    return (
        <div className="flex min-h-screen bg-[#f8fafc] dark:bg-none dark:bg-[#081c15] transition-colors duration-300">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col ml-0 lg:ml-64 min-w-0 w-full">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                
                {/* Expiry Warning Banner */}
                {user?.plan_type === 'premium' && daysUntilExpiry !== null && daysUntilExpiry <= 3 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-700/50 px-4 py-3 sm:px-6 pt-[80px] lg:pt-[72px] z-10 w-full relative">
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                <span className="text-lg">⚠️</span>
                                <p>
                                    <span className="font-bold">Subscription Expiring Soon!</span> Your Premium access ends in {daysUntilExpiry === 0 ? 'less than 24 hours' : `${daysUntilExpiry} days`}.
                                </p>
                            </div>
                            <Link 
                                to="/subscription" 
                                className="whitespace-nowrap px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-full transition-colors text-xs uppercase tracking-wider"
                            >
                                Renew Now
                            </Link>
                        </div>
                    </div>
                )}

                <main className={`flex-1 px-3.5 sm:px-8 lg:px-10 pb-24 lg:pb-10 w-full max-w-[96rem] mx-auto min-w-0 ${
                    user?.plan_type === 'premium' && daysUntilExpiry !== null && daysUntilExpiry <= 3 
                        ? 'pt-4 sm:pt-6' 
                        : 'pt-24 sm:pt-28'
                }`}>
                    <ErrorBoundary locationKey={location.pathname}>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>

            {/* Quick Floating Feedback Button */}
            <button
                onClick={() => setIsFeedbackOpen(true)}
                className="fixed bottom-20 sm:bottom-6 left-6 z-30 hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-[#0d2b1f] border border-slate-200/90 dark:border-white/15 text-slate-700 dark:text-white font-bold text-xs shadow-lg hover:shadow-xl hover:border-emerald-500/50 hover:scale-105 active:scale-95 transition-all group backdrop-blur-md"
                title="Give Feedback & Earn +10 HealthCoins"
            >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                </div>
                <span>Feedback</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-200/70 dark:border-transparent">
                    +10 🪙
                </span>
            </button>

            {/* Global Feedback Modal */}
            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />

            {/* Mobile Bottom Navigation Bar */}
            <BottomNav />

            {/* AI Assistant Chatbot */}
            <ChatBot />
        </div>
    )
}
