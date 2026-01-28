import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoginModal } from '../components/LoginModal';
import { UserProfile, Venue } from '../../../types';

interface AuthPageProps {
    userProfile: UserProfile;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    venues: Venue[];
    alertPrefs?: any;
    setAlertPrefs?: (prefs: any) => void;
    openInfo: (title: string, text: string) => void;
    onOwnerSuccess: () => void;
    loginMode: 'user' | 'owner';
    setLoginMode: (mode: 'user' | 'owner') => void;
    userSubMode: 'login' | 'signup';
    setUserSubMode: (mode: 'login' | 'signup') => void;
}

export const AuthPage: React.FC<AuthPageProps> = (props) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const redirectPath = searchParams.get('redirect') || '/';
    const modeParam = searchParams.get('mode');

    useEffect(() => {
        if (modeParam === 'owner') {
            props.setLoginMode('owner');
            props.setUserSubMode('login');
        } else if (modeParam === 'register_venue') {
            props.setLoginMode('owner');
            props.setUserSubMode('signup');
        } else if (modeParam === 'signup') {
            props.setLoginMode('user');
            props.setUserSubMode('signup');
        } else {
            // Default common path
            props.setLoginMode('user');
            props.setUserSubMode('login');
        }
    }, [modeParam, props]);

    const handleModalClose = () => {
        // If user is logged in (not guest), redirect to target
        if (props.userProfile.uid !== 'guest') {
            navigate(redirectPath);
        } else {
            // If cancelled/still guest, go home
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background - CSS only, no external SVG */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] opacity-20" />

            <LoginModal
                {...props}
                isOpen={true}
                onClose={handleModalClose}
            />
        </div>
    );
};
