import React, { useState } from 'react';
import { X, Home, Star } from 'lucide-react';
import { UserProfile } from '../../../types';
import { updateUserProfile } from '../../../services/userService';
import { useToast } from '../../../components/ui/BrandedToast';
import { useUser } from '../../../contexts/UserContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    venueName: string;
    venueId: string;
}

export const HomeBaseModal: React.FC<Props> = ({
    isOpen,
    onClose,
    venueId,
}) => {
    const { userProfile, refreshProfile } = useUser();
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    const handleSetHomeBase = async () => {
        setIsSaving(true);
        try {
            if (userProfile.uid !== 'guest') {
                await updateUserProfile(userProfile.uid, { homeBase: venueId });
            }

            // Update local state by refreshing context
            await refreshProfile();

            showToast(`${venueName} is now your Home Base! 🏠`, 'success');
            onClose();
        } catch (error) {
            console.error('Error saving home base:', error);
            showToast('Failed to set Home Base.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

                <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30 text-primary">
                        <Home className="w-8 h-8" />
                    </div>

                    <h2 className="text-xl font-black uppercase text-white tracking-wide font-league mb-2">
                        Is {venueName} your main spot?
                    </h2>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                        Setting your Home Base helps us personalize your feed and finding your squad.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleSetHomeBase}
                            disabled={isSaving}
                            className="w-full bg-primary hover:bg-yellow-400 text-black font-black py-3 rounded-xl uppercase tracking-[0.15em] shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? 'Setting...' : 'Yes, Set as Home Base'}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl uppercase tracking-wider transition-all"
                        >
                            Just put in Favorites
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-slate-500 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
