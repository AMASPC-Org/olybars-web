import React, { useState } from 'react';
import { Flame, Clock, Trophy, MessageCircle, Star, X } from 'lucide-react';

// --- Props ---
interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userRole: 'user' | 'guest' | string; // Assuming these are the primary roles for pathing
}

// --- Helper Functions ---

const renderIconForOnboarding = (step: number) => {
    const iconProps = { className: "w-10 h-10 text-primary", strokeWidth: 2.5 };
    switch (step) {
        case 1: return <Flame {...iconProps} />;
        case 2: return <Clock {...iconProps} />;
        case 3: return <Trophy {...iconProps} />;
        case 4: return <MessageCircle {...iconProps} />;
        case 5: return <Star {...iconProps} />;
        default: return <Star {...iconProps} />;
    }
};

const renderOnboardingContent = (step: number) => {
    switch (step) {
        case 1: return { title: "Welcome to OlyBars!", text: "The Oly Pulse shows you where the crowd is right now. Find the 'Gushing' spots and never walk into an empty bar again." };
        case 2: return { title: "The Buzz Clock", text: "We track every Happy Hour in town. Deals ending soonest are always at the top." };
        case 3: return { title: "The League", text: "Clock In to venues and take Vibe Photos to earn points. Compete for the season champion trophy." };
        case 4: return { title: "Ask Artie", text: "Artie is your personal AI concierge. Ask for directions, food recommendations, or today's hottest deal." };
        case 5: return {
            title: "GPS & Photo Rights", text: (
                <div className="space-y-3 text-left">
                    <p className="text-[10px] leading-relaxed">
                        <strong className="text-primary uppercase tracking-tighter">GPS:</strong> OlyBars uses real-time GPS verification (100ft radius) to ensure League integrity. Location data is used strictly for verification and never shared for ads.
                    </p>
                    <p className="text-[10px] leading-relaxed">
                        <strong className="text-primary uppercase tracking-tighter">Photos:</strong> Marketing Consent grants OlyBars a non-exclusive right to display photos on venue listings in exchange for Premium Points (+20).
                    </p>
                    <p className="text-[10px] pt-2 border-t border-slate-700">
                        By continuing, you agree to our <a href="/terms" target="_blank" className="text-primary hover:underline">Terms</a> & <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy</a>.
                    </p>
                </div>
            )
        };
        default: return { title: "Welcome", text: "Let's get started." };
    }
};

const MAX_ONBOARDING_STEPS = 5;

// --- Main Component ---

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, userRole }) => {
    const [step, setStep] = useState(1);
    // Removed: const [path, setPath] = useState<'league' | 'guest' | null>(null);

    if (!isOpen) return null;

    // Removed: const handlePathSelect = (selectedPath: 'league' | 'guest') => {
    // Removed:     setPath(selectedPath);
    // Removed:     setStep(1);
    // Removed: };

    const handleNext = () => {
        if (step < 5) {
            setStep(prev => prev + 1);
        } else {
            // Save preference if needed, then close
            // Removed: if (path === 'league') {
            // Removed:     localStorage.setItem('oly_onboarding_path', 'league');
            // Removed: }
            onClose();
        }
    };

    // Content based on Path (derived from Role)
    const getContent = (s: number) => {
        // Guest Path
        if (userRole === 'guest') {
            switch (s) {
                case 1: return { title: "Find the Vibe", text: "The Oly Pulse shows you where the crowd is real-time. Navigate by 'Trickle', 'Gushing', or 'Flooded'." };
                case 2: return { title: "Happy Hour Tracker", text: "Never miss a deal. We track every special in Olympia and sort them by 'Ending Soonest'." };
                case 3: return { title: "Curated Events", text: "From Karaoke to Trivia to Live Bands. Filter the map to find your scene tonight." };
                case 4: return { title: "Artie the Concierge", text: "Not sure where to go? Ask Artie. He knows every tap list and food special in town." };
                case 5: return { title: "Start Exploring", text: "Create a free account to track your Favorite Spots and get 50pts just for joining." };
                default: return { title: "", text: "" };
            }
        }
        // League Path (Default)
        switch (s) {
            case 1: return { title: "Welcome to the League", text: "OlyBars isn't just a map—it's a game. Earn points, climb the ranks, and win real prizes." };
            case 2: return { title: "Earn Points", text: "Clock In at venues (10pts), Post Vibe Checks (20pts), and hold the 'Mayor' title at your favorite bar." };
            case 3: return { title: "Win Prizes", text: "Top ranked players at the end of the season win cash, gift cards, and exclusive OlyBars swag." };
            case 4: return { title: "Verification", text: "We use GPS to verify you're actually at the bar. No cheating allowed—we keep the playing field fair." };
            case 5: return { title: "Claim Your Bonus", text: "Join as a League Player today and start with a 500pt Signing Bonus. Your glory awaits." };
            default: return { title: "", text: "" };
        }
    };

    const currentContent = getContent(step);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 shadow-2xl relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-transform hover:scale-110 z-10">
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    <div className="mb-8 relative">
                        <div className="w-20 h-20 bg-background rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-white/10 shadow-xl rotate-3">
                            {renderIconForOnboarding(step)}
                        </div>

                        {/* Progress Dots */}
                        <div className="flex justify-center gap-1.5 mb-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${step === i ? 'w-6 bg-primary' : 'w-2 bg-slate-700'}`} />
                            ))}
                        </div>

                        <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tight font-league animate-in fade-in slide-in-from-bottom-2">
                            {currentContent.title}
                        </h2>

                        <p className="text-sm text-slate-300 font-medium leading-relaxed px-2 h-20 flex items-center justify-center">
                            {currentContent.text}
                        </p>
                    </div>

                    <button
                        onClick={handleNext}
                        className="w-full bg-primary hover:bg-yellow-400 text-black font-black text-lg uppercase tracking-widest py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {step < 5 ? 'NEXT' : (userRole === 'user' ? 'JOIN THE LEAGUE' : 'START EXPLORING')}
                    </button>
                </div>
            </div>
        </div>
    );
};
