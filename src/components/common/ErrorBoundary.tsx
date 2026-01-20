import React, { Component } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

import { logErrorToBackend } from '../../services/errorService';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to Backend
        logErrorToBackend(error, 'ErrorBoundary', errorInfo.componentStack);

        // Log to console for local dev
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-surface border-2 border-primary/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        {/* Background elements */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                                <AlertTriangle className="w-10 h-10 text-primary" strokeWidth={2.5} />
                            </div>

                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 font-league">
                                SPILL IN THE <span className="text-primary">WELL!</span>
                            </h1>

                            <p className="text-slate-400 font-bold uppercase text-xs mb-8 tracking-widest">
                                Artie hit a snag. Let's get things flowing again.
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full bg-primary text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all active:scale-95 uppercase tracking-widest text-sm"
                                >
                                    <RefreshCcw className="w-5 h-5" />
                                    Try a Fresh Pour
                                </button>

                                <button
                                    onClick={this.handleReset}
                                    className="w-full bg-slate-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all active:scale-95 uppercase tracking-widest text-sm"
                                >
                                    <Home className="w-5 h-5" />
                                    Back to the Pulse
                                </button>
                            </div>

                            <div className="mt-10 pt-6 border-t border-white/5">
                                <p className="text-[10px] text-slate-600 font-mono uppercase">
                                    Error Code: {this.state.error?.name || 'UNKNOWN_VIBE_SHIFT'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children as React.ReactElement;
    }
}
