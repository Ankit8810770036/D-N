import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ChatBot from './ChatBot'

export default function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const { user, daysUntilExpiry } = useAuth()

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-[#f0fdf7] via-white to-[#f0fdf4] dark:bg-none dark:bg-[#081c15] transition-colors duration-300">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col ml-0 lg:ml-64 min-w-0">
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

                <main className={`flex-1 px-4 sm:px-8 lg:px-10 pb-6 w-full max-w-[96rem] mx-auto ${
                    user?.plan_type === 'premium' && daysUntilExpiry !== null && daysUntilExpiry <= 3 
                        ? 'pt-4 sm:pt-6' 
                        : 'pt-28'
                }`}>
                    <Outlet />
                </main>
            </div>
            <ChatBot />
        </div>
    )
}
