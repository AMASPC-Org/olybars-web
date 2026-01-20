
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, Trophy, Crown, Info } from 'lucide-react';
import { InfoRulesModal } from '../ui/InfoRulesModal';
import logoIcon from '../../assets/OlyBars.com Emblem Logo PNG Transparent (512px by 512px).png';
import { UserProfile } from '../../types';

interface StickyHeaderProps {
    userProfile: UserProfile;
    userRank?: number;
    onMenuClick: () => void;
    onProfileClick: () => void;
    isScrolled?: boolean;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
    userProfile,
    userRank,
    onMenuClick,
    onProfileClick,
    isScrolled = false
}) => {
    const navigate = useNavigate();
    const [showInfo, setShowInfo] = useState(false);
    const isGuest = userProfile?.role === 'guest' || !userProfile;

    // Dynamic Icon based on rank/status
    const ProfileIcon = isGuest ? User : (userRank && userRank <= 10 ? Crown : Trophy);

    return (
        <div className={`sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-white/10 transition-all duration-300 ${isScrolled ? 'py-2 shadow-md' : 'py-3 shadow-md'
            }`}>
            <div className="flex justify-between items-center px-4 max-w-md mx-auto">
                {/* Logo (Left) */}
                <div
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 cursor-pointer group"
                >
                    <img
                        src={logoIcon}
                        alt="OlyBars"
                        className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform"
                    />
                    <span className="font-league font-black text-xl uppercase tracking-tighter">
                        OLYBARS<span className="text-primary">.COM</span>
                    </span>
                </div>

                {/* Profile/League Button (Right) */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onProfileClick}
                        className={`p-2 rounded-xl border-2 transition-all active:scale-95 ${isGuest
                            ? 'border-slate-800 text-slate-400 hover:border-slate-600'
                            : 'border-primary text-primary shadow-[0_0_10px_rgba(251,191,36,0.2)] hover:bg-primary/10'
                            }`}
                    >
                        <ProfileIcon size={20} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={() => setShowInfo(true)}
                        className="p-2 text-slate-400 hover:text-primary transition-all active:scale-95"
                        title="Rules & Prizes"
                    >
                        <Info size={20} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={onMenuClick}
                        className="p-2 text-white hover:text-primary transition-colors active:scale-95"
                    >
                        <Menu size={28} strokeWidth={3} />
                    </button>
                </div>
            </div>
            <InfoRulesModal
                isOpen={showInfo}
                onClose={() => setShowInfo(false)}
            />
        </div>
    );
};
