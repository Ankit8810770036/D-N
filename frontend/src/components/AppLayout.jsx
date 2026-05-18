import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ChatBot from './ChatBot'

export default function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
                <main className="flex-1 p-4 sm:p-6 pt-28 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>
            <ChatBot />
        </div>
    )
}
