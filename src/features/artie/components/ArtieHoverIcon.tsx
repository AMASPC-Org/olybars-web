import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import artieHead from '/artie-head.png';
import schmidtLogo from '../../../assets/Schmidt-Only-Logo (40 x 40 px).png';
import { UserProfile, isSystemAdmin } from '../../../types';

interface ArtieHoverIconProps {
    onClick?: () => void;
    userProfile?: UserProfile;
}

export const ArtieHoverIcon: React.FC<ArtieHoverIconProps> = ({ onClick, userProfile }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    // Determine Coach Mode (Schmidt)
    // Matches logic in ArtieChatModal: Owner, Manager, or Admin
    const isOpsMode = userProfile && (isSystemAdmin(userProfile) || userProfile.role === 'owner' || userProfile.role === 'manager');

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate('/artie');
        }
    };

    return (
        <div
            className="fixed bottom-24 sm:bottom-6 right-6 z-[100] cursor-pointer group"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Tooltip / Speech Bubble */}
            <div className={`absolute bottom-full right-0 mb-3 whitespace-nowrap bg-oly-navy text-oly-gold px-3 py-1.5 rounded-xl border-2 border-oly-gold shadow-2xl transition-all duration-300 transform ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <p className="text-xs font-black uppercase tracking-widest font-league">
                    {isOpsMode ? "Coach Check-In" : "Ask Artie"}
                </p>
            </div>

            {/* Icon & Label Container (Branded Pill) - Tightened Pr-3 */}
            <div className="flex items-center bg-oly-navy border-2 border-oly-gold rounded-full shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden pr-3 group-hover:shadow-primary/20">
                {/* Icon Circle - Optimized for head framing */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-r-2 border-oly-gold/30 bg-black flex-shrink-0">
                    <img
                        src={isOpsMode ? schmidtLogo : artieHead}
                        alt={isOpsMode ? "Schmidt" : "Artie"}
                        className="w-full h-full object-contain p-0.5"
                    />
                </div>

                {/* "ASK" Label - Reduced spacing */}
                <div className="pl-2.5 flex flex-col justify-center">
                    <span className="text-oly-gold font-league font-black text-xs sm:text-sm tracking-widest mb-0.5 whitespace-nowrap">
                        ASK
                    </span>
                    <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse [animation-delay:0.4s]" />
                    </div>
                </div>
            </div>
        </div>
    );
};
