import { useEffect } from 'react'

let lockCount = 0

/**
 * Custom hook to lock body scrolling when a modal, drawer, or overlay is open.
 * Uses reference counting so nested or multiple modals don't prematurely unlock the body.
 * 
 * @param {boolean} isLocked - Whether scroll should be locked
 */
export function useBodyScrollLock(isLocked = false) {
    useEffect(() => {
        if (!isLocked) return

        lockCount++
        const originalOverflow = document.body.style.overflow
        const originalTouchAction = document.body.style.touchAction

        if (lockCount === 1) {
            document.body.style.overflow = 'hidden'
            // Prevent bounce on iOS Safari
            document.body.style.touchAction = 'none'
        }

        return () => {
            lockCount = Math.max(0, lockCount - 1)
            if (lockCount === 0) {
                document.body.style.overflow = originalOverflow || ''
                document.body.style.touchAction = originalTouchAction || ''
            }
        }
    }, [isLocked])
}

export default useBodyScrollLock
