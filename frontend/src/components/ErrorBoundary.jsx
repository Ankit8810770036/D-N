import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }

    componentDidUpdate(prevProps) {
        // Automatically recover and reset error state when user changes route/section
        if (this.state.hasError && this.props.locationKey && this.props.locationKey !== prevProps.locationKey) {
            this.setState({ hasError: false, error: null });
        }
    }

    handleTryAgain = () => {
        this.setState({ hasError: false, error: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="py-12 px-4 flex items-center justify-center font-outfit w-full">
                    <div className="card max-w-md w-full text-center p-8 shadow-2xl border border-rose-500/20 bg-white dark:bg-[#0c241a]">
                        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-5 shadow-sm">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-2">Something went wrong</h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
                            This section encountered a temporary issue. You can retry or switch to another section anytime.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleTryAgain}
                                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm"
                            >
                                <Home className="w-4 h-4" />
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
