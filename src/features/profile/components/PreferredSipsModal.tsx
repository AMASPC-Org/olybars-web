import React, { useState, useEffect } from 'react';
import { X, Beer, Wine, Martini, Check } from 'lucide-react';
import { UserProfile } from '../../../types';
import { updateUserProfile } from '../../../services/userService';
import { useToast } from '../../../components/ui/BrandedToast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    onSaveSuccess?: () => void;
}

const PREFERRED_SIPS = [
    { id: 'IPA', label: 'IPA', icon: '🍺' },
    { id: 'Light Beer', label: 'Light Beer', icon: '🧊' },
    { id: 'Cocktails', label: 'Cocktails', icon: '🍸' },
    { id: 'Wine', label: 'Wine', icon: '🍷' },
    { id: 'Cider/Seltzer', label: 'Cider/Seltzer', icon: '🍏' },
    { id: 'N/A', label: 'N/A', icon: '🥤' },
    { id: 'Stout/Porter', label: 'Dark Beer', icon: '🌑' },
    { id: 'Sour', label: 'Sour', icon: '🍋' },
];

export const PreferredSipsModal: React.FC<Props> = ({
    isOpen,
    onClose,
    userProfile,
    setUserProfile,
    onSaveSuccess
}) => {
    const [selectedSips, setSelectedSips] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen && userProfile.favoriteDrinks) {
            setSelectedSips(userProfile.favoriteDrinks);
        } else if (isOpen && userProfile.favoriteDrink) {
            // Legacy support
            setSelectedSips([userProfile.favoriteDrink]);
        }
    }, [isOpen, userProfile]);

    const toggleSip = (sip: string) => {
        setSelectedSips(prev =>
            prev.includes(sip)
                ? prev.filter(s => s !== sip)
                : [...prev, sip]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (userProfile.uid !== 'guest') {
                await updateUserProfile(userProfile.uid, { favoriteDrinks: selectedSips });
            }

            // Update local state
            setUserProfile(prev => ({ ...prev, favoriteDrinks: selectedSips }));

            showToast('Preferences saved! 🍻', 'success');
            onSaveSuccess?.(); // Trigger follow-up action (e.g. open menu)
            onClose();
        } catch (error) {
            console.error('Error saving sips:', error);
            showToast('Failed to save preferences.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">

                {/* Header */}
                <div className="p-6 pb-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase text-white tracking-wide font-league">
                            What's Your Poison?
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            Tap your favorites so we can curate your vibe.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Options Grid */}
                <div className="p-6 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                    {PREFERRED_SIPS.map((sip) => {
                        const isSelected = selectedSips.includes(sip.id);
                        return (
                            <button
                                key={sip.id}
                                onClick={() => toggleSip(sip.id)}
                                className={`
                  relative p-4 rounded-xl border flex items-center gap-3 transition-all active:scale-95 text-left
                  ${isSelected
                                        ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                                        : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10'
                                    }
                `}
                            >
                                <span className="text-2xl">{sip.icon}</span>
                                <span className={`text-sm font-bold uppercase tracking-wider ${isSelected ? 'text-primary' : ''}`}>
                                    {sip.label}
                                </span>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 text-primary">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-2 bg-slate-900 border-t border-white/5">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-primary hover:bg-yellow-400 text-black font-black py-4 rounded-xl uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                        {isSaving ? 'Saving...' : 'Lock It In'}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full mt-3 py-2 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300 tracking-widest"
                    >
                        Skip for Now
                    </button>
                </div>
            </div>
        </div>
    );
};
