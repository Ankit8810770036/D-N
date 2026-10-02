import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
    '/dashboard',
    '/planner',
    '/workouts',
    '/progress',
    '/profile',
]

/**
 * Hook to enable smooth mobile left/right swipe navigation between main bottom nav tabs
 */
export function useSwipeNavigation() {
    const location = useLocation()
    const navigate = useNavigate()
    const touchStartRef = useRef(null)
    const isSwipingRef = useRef(false)

    useEffect(() => {
        const handleTouchStart = (e) => {
            // Only on mobile / tablet screens
            if (window.innerWidth >= 1024) return

            // Check if current route is one of the main tabs
            const currentPath = location.pathname
            if (!TABS.includes(currentPath)) return

            // Don't intercept touches inside interactive elements (range sliders, scrollable tables, modals)
            const target = e.target
            if (
                target.closest('input[type="range"]') ||
                target.closest('.recharts-responsive-container') ||
                target.closest('.no-swipe') ||
                target.closest('[role="dialog"]') ||
                target.closest('textarea')
            ) {
                return
            }

            if (e.touches && e.touches.length === 1) {
                const touch = e.touches[0]
                touchStartRef.current = {
                    x: touch.clientX,
                    y: touch.clientY,
                    time: Date.now(),
                }
                isSwipingRef.current = true
            }
        }

        const handleTouchEnd = (e) => {
            if (!isSwipingRef.current || !touchStartRef.current) return

            const touch = e.changedTouches && e.changedTouches[0]
            if (!touch) {
                isSwipingRef.current = false
                return
            }

            const deltaX = touch.clientX - touchStartRef.current.x
            const deltaY = touch.clientY - touchStartRef.current.y
            const deltaTime = Date.now() - touchStartRef.current.time

            isSwipingRef.current = false
            touchStartRef.current = null

            // Must be within reasonable gesture time (< 500ms) and swipe distance >= 55px
            // and distinctly horizontal (deltaX > 1.5 * deltaY)
            const minSwipeDist = 55
            if (
                deltaTime < 600 &&
                Math.abs(deltaX) >= minSwipeDist &&
                Math.abs(deltaX) > Math.abs(deltaY) * 1.4
            ) {
                const currentPath = location.pathname
                const currentIndex = TABS.indexOf(currentPath)
                if (currentIndex === -1) return

                if (deltaX < 0) {
                    // Swipe Left (finger moves left) -> Go to next tab (e.g. Dashboard -> Planner -> Workouts -> Progress -> Profile)
                    if (currentIndex < TABS.length - 1) {
                        navigate(TABS[currentIndex + 1])
                    }
                } else {
                    // Swipe Right (finger moves right) -> Go to previous tab (e.g. Profile -> Progress -> Workouts -> Planner -> Dashboard)
                    if (currentIndex > 0) {
                        navigate(TABS[currentIndex - 1])
                    }
                }
            }
        }

        window.addEventListener('touchstart', handleTouchStart, { passive: true })
        window.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [location.pathname, navigate])
}

export default useSwipeNavigation
