import { useEffect } from 'react'

let lockCount = 0
let originalBodyOverflow = ''
let originalHtmlOverflow = ''

/**
 * Custom hook to lock body and html scrolling when a modal, drawer, or overlay is open.
 * Uses reference counting so nested or multiple modals don't prematurely unlock or permanently lock the body.
 * 
 * @param {boolean} isLocked - Whether scroll should be locked
 */
export function useBodyScrollLock(isLocked = false) {
    useEffect(() => {
        if (!isLocked) return

        if (lockCount === 0) {
            // Snapshot the pristine, unlocked styles
            originalBodyOverflow = document.body.style.overflow || ''
            originalHtmlOverflow = document.documentElement.style.overflow || ''

            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
        }
        lockCount++

        return () => {
            lockCount = Math.max(0, lockCount - 1)
            if (lockCount === 0) {
                // Restore pristine styles
                document.body.style.overflow = originalBodyOverflow
                document.documentElement.style.overflow = originalHtmlOverflow
            }
        }
    }, [isLocked])
}

/**
 * Force reset scroll lock on route change to guarantee no page gets frozen
 */
export function resetBodyScrollLock() {
    lockCount = 0
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    document.body.style.touchAction = ''
}

export default useBodyScrollLock

