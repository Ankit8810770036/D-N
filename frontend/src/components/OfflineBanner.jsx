import { useState, useEffect, useRef } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

export default function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
    const wasOfflineRef = useRef(false)
    const queryClient = useQueryClient()

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            if (wasOfflineRef.current) {
                toast.success('🟢 Back online! Synced latest data.', {
                    id: 'network-status-toast',
                    duration: 3000,
                    iconTheme: { primary: '#10b981', secondary: '#ffffff' },
                })
                // Silently refresh cached queries
                queryClient.invalidateQueries()
            }
            wasOfflineRef.current = false
        }

        const handleOffline = () => {
            setIsOnline(false)
            wasOfflineRef.current = true
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [queryClient])

    if (isOnline) return null

    return (
        <div 
            role="status"
            aria-live="polite"
            className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 text-white py-1.5 px-4 shadow-lg flex items-center justify-center gap-2 text-xs font-semibold backdrop-blur-md animate-slide-down border-b border-amber-400/30 select-none"
        >
            <WifiOff className="w-3.5 h-3.5 text-amber-200 animate-pulse shrink-0" />
            <span className="truncate">⚡ You are in offline mode. Showing cached data.</span>
        </div>
    )
}
