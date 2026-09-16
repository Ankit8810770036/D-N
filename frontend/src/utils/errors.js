/**
 * Extracts a human-friendly, specific error message from an API error or exception.
 * Handles network failures, validation errors (422), authentication errors (401),
 * forbidden actions (403), rate limits (429), and server crashes (500+).
 */
export function getErrorMessage(error, defaultFallback = 'An unexpected error occurred. Please try again.') {
    if (!error) return defaultFallback;

    // 1. Check if user is offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return 'You are currently offline. Please check your internet connection.';
    }

    // 2. Check for Axios network error / timeout (no response received from server)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return 'Cannot connect to the server. Please check your internet connection or verify the server is running.';
    }

    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
        return 'The request timed out. Please check your connection and try again.';
    }

    // 3. Inspect HTTP response
    const response = error.response;
    if (response) {
        const { status, data } = response;

        // Validation errors (422)
        if (status === 422 && data?.errors) {
            const errorLists = Object.values(data.errors);
            const firstError = Array.isArray(errorLists[0]) ? errorLists[0][0] : errorLists[0];
            if (firstError) return firstError;
        }

        // Explicit message or error string from backend
        if (data?.message && typeof data.message === 'string' && data.message.trim() !== '') {
            return data.message;
        }

        if (data?.error && typeof data.error === 'string' && data.error.trim() !== '') {
            return data.error;
        }

        // Status-based specific fallbacks
        switch (status) {
            case 400:
                return data?.message || 'Invalid request. Please check your input.';
            case 401:
                return 'Invalid credentials or session expired. Please log in again.';
            case 403:
                return data?.message || 'You do not have permission to perform this action.';
            case 404:
                return 'The requested resource was not found.';
            case 429:
                return 'Too many requests. Please wait a moment and try again.';
            case 500:
            case 502:
            case 503:
            case 504:
                return `Server is temporarily unavailable (Error ${status}). Please try again shortly.`;
            default:
                break;
        }
    }

    // 4. Standard Error object message
    if (error.message && typeof error.message === 'string' && error.message.trim() !== '') {
        return error.message;
    }

    return defaultFallback;
}
