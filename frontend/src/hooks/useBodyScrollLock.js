import { useEffect } from 'react'

let lockCount = 0

/**
 * Custom hook to lock body and html scrolling when a modal, drawer, or overlay is open.
 * Uses reference counting so nested or multiple modals don't prematurely unlock the body.
 * 
 * @param {boolean} isLocked - Whether scroll should be locked
 */
export function useBodyScrollLock(isLocked = false) {
    useEffect(() => {
        if (!isLocked) return

        lockCount++
        const originalBodyOverflow = document.body.style.overflow
        const originalHtmlOverflow = document.documentElement.style.overflow
        const originalTouchAction = document.body.style.touchAction

        if (lockCount === 1) {
            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
            document.body.style.touchAction = 'none'
        }

        return () => {
            lockCount = Math.max(0, lockCount - 1)
            if (lockCount === 0) {
                document.body.style.overflow = originalBodyOverflow || ''
                document.documentElement.style.overflow = originalHtmlOverflow || ''
                document.body.style.touchAction = originalTouchAction || ''
            }
        }
    }, [isLocked])
}

export default useBodyScrollLock
