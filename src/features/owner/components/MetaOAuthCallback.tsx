import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Instagram } from 'lucide-react';
import { useToast } from '../../../components/ui/BrandedToast';
import { auth } from '../../../lib/firebase';
import { API_ENDPOINTS } from '../../../lib/api-config';

interface MetaOAuthCallbackProps {
    onClose?: () => void;
}

export const MetaOAuthCallback: React.FC<MetaOAuthCallbackProps> = ({ onClose }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state'); // venueId
            const errorParam = searchParams.get('error');

            if (errorParam) {
                setStatus('error');
                setError(searchParams.get('error_description') || 'Meta authentication failed.');
                return;
            }

            if (!code || !state) {
                setStatus('error');
                setError('Missing required parameters from Meta.');
                return;
            }

            try {
                // Exchange code for tokens via OlyBars backend
                const idToken = await auth.currentUser?.getIdToken();
                if (!idToken) throw new Error('You must be logged in to connect Instagram.');

                const response = await fetch(API_ENDPOINTS.META.EXCHANGE, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ code, venueId: state })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Connection to Meta failed.');
                }

                setStatus('success');
                showToast(`Connected to ${result.pageName || 'Instagram'}!`, 'success');

                // Redirect back to owner dashboard
                setTimeout(() => {
                    navigate(`/owner?venueId=${state}&tab=listing`);
                }, 2000);

            } catch (err: any) {
                console.error('[MetaOAuth] Callback Error:', err);
                setStatus('error');
                setError(err.message || 'Failed to exchange token with Meta.');
            }
        };

        handleCallback();
    }, [searchParams, navigate, showToast]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/20">
                <Instagram className="w-10 h-10 text-white" />
            </div>

            <div className="max-w-md w-full space-y-6">
                {status === 'loading' && (
                    <div className="space-y-4 animate-pulse">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Authenticating with Meta</h2>
                        <p className="text-slate-400 text-sm font-medium">Securing your connection to Artie Social Engine...</p>
                        <div className="flex justify-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4 animate-in zoom-in duration-500">
                        <div className="flex justify-center">
                            <CheckCircle2 className="w-16 h-16 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Connection Successful!</h2>
                        <p className="text-slate-400 text-sm font-medium">Redirecting you back to your dashboard...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4 animate-in shake duration-500">
                        <div className="flex justify-center">
                            <AlertCircle className="w-16 h-16 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Authentication Error</h2>
                        <p className="text-red-400/80 text-sm font-bold uppercase tracking-widest">{error}</p>
                        <button
                            onClick={() => onClose ? onClose() : navigate('/owner')}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-12">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">OlyBars Social Engine &bull; Artie V2.0</p>
            </div>
        </div>
    );
};
