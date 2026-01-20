import React, { useEffect, useState } from 'react';
import { Check, X, User, MapPin, Clock, Camera, AlertCircle } from 'lucide-react';
import { fetchPendingBounties, reviewBountySubmission } from '../../../services/userService';
import { useToast } from '../../../components/ui/BrandedToast';
import { formatDistanceStrict } from 'date-fns';

interface BountySubmission {
    id: string;
    userId: string;
    venueId: string;
    photoUrl: string;
    clockInTime: number;
    submissionTime: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    pointsPotential: number;
    metadata?: any;
}

export const BountyReviewQueue: React.FC = () => {
    const [submissions, setSubmissions] = useState<BountySubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            const data = await fetchPendingBounties();
            setSubmissions(data);
        } catch (e) {
            showToast('Failed to load submissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, []);

    const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await reviewBountySubmission(id, status);
            showToast(`Bounty ${status.toLowerCase()} successfully`, 'success');
            setSubmissions(prev => prev.filter(s => s.id !== id));
        } catch (error: any) {
            showToast(error.message || 'Review failed', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Clock className="w-10 h-10 text-primary/50 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Retrieving Bounty Queue...</p>
            </div>
        );
    }

    if (submissions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-black/20 rounded-2xl border border-dashed border-white/5">
                <Camera className="w-12 h-12 text-slate-700 mb-4" />
                <p className="text-sm font-bold text-slate-500 uppercase">Queue Empty</p>
                <p className="text-[10px] text-slate-600 uppercase mt-1">No bounties currently awaiting review.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-black font-league uppercase">Flash Bounty Review</h2>
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {submissions.length} Awaiting Verification
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((sub) => {
                    const timeWindow = sub.submissionTime - sub.clockInTime;
                    const isOverTwoHours = timeWindow > 2 * 60 * 60 * 1000;

                    return (
                        <div key={sub.id} className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:border-primary/30 transition-all">
                            <div className="relative aspect-square">
                                <img src={sub.photoUrl} alt="Bounty Submission" className="w-full h-full object-cover" />
                                <div className="absolute top-3 left-3">
                                    <span className="bg-black/80 backdrop-blur-md text-[10px] font-black text-primary px-2 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                                        {sub.pointsPotential} XP AT STAKE
                                    </span>
                                </div>
                                {isOverTwoHours && (
                                    <div className="absolute bottom-3 left-3 right-3 bg-red-500/90 backdrop-blur-md p-2 rounded-lg flex items-center gap-2 border border-red-400/50">
                                        <AlertCircle className="w-4 h-4 text-white" />
                                        <span className="text-[10px] font-black text-white uppercase">Late Submission Detected</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 flex-1 flex flex-col space-y-4">
                                <div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                        <MapPin className="w-3 h-3 text-primary" />
                                        {sub.metadata?.venueName || sub.venueId}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <User className="w-3 h-3 text-blue-400" />
                                        {sub.metadata?.userHandle || sub.userId}
                                    </div>
                                </div>

                                <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                                        <span className="text-slate-500">Clock-In</span>
                                        <span className="text-slate-300">{new Date(sub.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                                        <span className="text-slate-500">Upload</span>
                                        <span className="text-slate-300">{new Date(sub.submissionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-slate-500">Window</span>
                                        <span className={isOverTwoHours ? 'text-red-500' : 'text-green-500'}>
                                            {formatDistanceStrict(sub.clockInTime, sub.submissionTime)}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => handleReview(sub.id, 'APPROVED')}
                                        className="flex-1 bg-green-500 hover:bg-green-400 text-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 group/btn"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Release Points</span>
                                    </button>
                                    <button
                                        onClick={() => handleReview(sub.id, 'REJECTED')}
                                        className="flex-1 bg-slate-800 hover:bg-red-500/20 hover:text-red-500 text-slate-400 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5"
                                    >
                                        <X className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Reject</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
