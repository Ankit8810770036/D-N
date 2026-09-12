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

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-zinc-950 font-outfit">
                    <div className="card max-w-md w-full text-center p-8 shadow-2xl border border-red-500/20">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Something went wrong</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            An unexpected application error occurred. You can reload the page or return to the dashboard.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReload}
                                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 text-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reload
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm"
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
