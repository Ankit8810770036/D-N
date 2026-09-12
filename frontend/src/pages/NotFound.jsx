import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
    const { user } = useAuth()

    return (
        <div className="min-h-screen relative flex items-center justify-center font-outfit bg-cover bg-center bg-[#081c15] overflow-x-hidden"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1498837167922-41c3735b2385?auto=format&fit=crop&q=80')" }}>

            {/* Background Glow Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] left-[-10%] w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />

            <div className="relative z-10 w-full max-w-lg mx-auto px-6 text-center animate-slide-up">
                <div className="bg-transparent backdrop-blur-sm border border-white/20 rounded-[2rem] p-10 sm:p-14 shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-col items-center">
                    
                    {/* Floating 404 Icon */}
                    <div className="relative mb-8 group">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl group-hover:bg-red-500/30 transition-all duration-500" />
                        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 text-5xl shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                            🛸
                        </div>
                    </div>

                    <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 mb-2 tracking-tighter">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">
                        Lost in space?
                    </h2>
                    
                    <p className="text-gray-300 font-medium mb-8 leading-relaxed max-w-sm">
                        The page you're looking for has drifted out of orbit or doesn't exist in our nutritional universe.
                    </p>

                    <Link 
                        to={user ? "/dashboard" : "/login"}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-700 text-white font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-green-900/40 uppercase tracking-widest text-[11px] flex justify-center items-center gap-2"
                    >
                        <span>←</span> Return to {user ? "Dashboard" : "Login"}
                    </Link>

                </div>
            </div>
        </div>
    )
}
