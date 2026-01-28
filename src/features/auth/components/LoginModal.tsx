import React, { useState, useEffect } from 'react';
import {
  X, Hash, Home, Beer, Mail, Phone, Shield, Lock, Facebook, Smartphone, Zap
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  RecaptchaVerifier,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { UserProfile, Venue, UserRole, SystemRole } from '../../../types';
import { MfaService } from '../../../services/mfaService';
import { useToast } from '../../../components/ui/BrandedToast';
import { mapAuthErrorToMessage } from '../utils/authErrorHandler';
import { AuthService } from '../../../services/authService';
import { useUser, useLayout } from '../../../contexts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional props for standalone usage (otherwise uses Context users/state)
  loginMode?: 'user' | 'owner';
  setLoginMode?: (mode: 'user' | 'owner') => void;
  userSubMode?: 'login' | 'signup';
  setUserSubMode?: (mode: 'login' | 'signup') => void;
  userProfile?: UserProfile;
  setUserProfile?: React.Dispatch<React.SetStateAction<UserProfile>>;
  venues?: Venue[];
  alertPrefs?: any;
  setAlertPrefs?: (prefs: any) => void;
  openInfo?: (title: string, text: string) => void;
  onOwnerSuccess?: () => void;
  // New props for GlobalModals support
  initialMode?: 'user' | 'live' | 'signup' | 'login';
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  loginMode: propLoginMode,
  setLoginMode: propSetLoginMode,
  userSubMode: propUserSubMode,
  setUserSubMode: propSetUserSubMode,
  userProfile: propUserProfile,
  setUserProfile: propSetUserProfile,
  venues, // Unused
  alertPrefs,
  setAlertPrefs,
  openInfo: propOpenInfo,
  onOwnerSuccess,
  initialMode = 'user',
  onSuccess
}) => {
  const { showToast } = useToast();

  // Context Fallbacks
  const { userProfile: contextUserProfile, setUserProfile: contextSetUserProfile } = useUser();
  const { openModal } = useLayout(); // fallback for openInfo logic if needed (usually unrelated)

  // Resolve Effective State/Setters
  const userProfile = propUserProfile || contextUserProfile;
  const setUserProfile = propSetUserProfile || contextSetUserProfile;

  // Internal State for Modes if props not provided
  const [internalLoginMode, setInternalLoginMode] = useState<'user' | 'owner'>((initialMode === 'live' || initialMode === 'user') ? 'user' : 'owner');
  const [internalUserSubMode, setInternalUserSubMode] = useState<'login' | 'signup'>(initialMode === 'signup' ? 'signup' : 'login');

  const loginMode = propLoginMode || internalLoginMode;
  const setLoginMode = propSetLoginMode || setInternalLoginMode;

  const userSubMode = propUserSubMode || internalUserSubMode;
  const setUserSubMode = propSetUserSubMode || setInternalUserSubMode;

  const [email, setEmail] = useState(userProfile.email || '');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState(userProfile.handle || '');

  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [pendingVenueName, setPendingVenueName] = useState('');

  // Pre-fill Business Name from Auth Bridge (Claim Intent)
  useEffect(() => {
    const bridgeData = sessionStorage.getItem('claim_intent_venue');
    if (bridgeData) {
      try {
        const intent = JSON.parse(bridgeData);
        if (intent.name) {
          setPendingVenueName(intent.name);
        }
      } catch (e) {
        console.error('Failed to parse bridge data', e);
      }
    }
  }, []);

  // Onboarding specific state
  // const [joinLeague, setJoinLeague] = useState(true); // Default to Guest now
  // const [weeklyBuzz, setWeeklyBuzz] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // MFA State
  const [mfaResolver, setMfaResolver] = useState<any>(null);
  const [mfaId, setMfaId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfaStep, setShowMfaStep] = useState(false);
  const [showMfaEnrollmentStep, setShowMfaEnrollmentStep] = useState(false);
  const [mfaEnrollPhone, setMfaEnrollPhone] = useState('');
  const [mfaEnrollStep, setMfaEnrollStep] = useState<'phone' | 'code'>('phone');
  const [mfaEnrollVerificationId, setMfaEnrollVerificationId] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  const interestOptions = [
    { id: 'karaoke', label: 'Karaoke', icon: '🎤' },
    { id: 'trivia', label: 'Trivia', icon: '🧠' },
    { id: 'live_music', label: 'Live Music', icon: '🎸' },
    { id: 'arcade', label: 'Arcade', icon: '👾' },
  ];

  if (!isOpen) return null;

  const handleOwnerSignup = async () => {
    if (!handle.trim()) { showToast('Contact Name is required.'); return; }
    if (!pendingVenueName.trim()) { showToast('Business Name is required.'); return; }
    if (!ownerEmail.includes('@')) { showToast('Valid Business Email required.'); return; }
    if (ownerPassword.length < 6) { showToast('Password must be 6+ chars.'); return; }

    setIsLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, ownerEmail, ownerPassword);
      const uid = userCredential.user.uid;

      // 2. Create Owner Profile
      const newProfile: UserProfile = {
        uid: uid,
        role: 'owner', // Immediate Owner Role for onboarding flow
        systemRole: 'guest',
        venuePermissions: {}, // Will be linked in ClaimVenuePage via bridge
        handle: handle, // Contact Name
        email: ownerEmail,
        phone: '', // Can be added later
        homeBase: '',
        favoriteDrinks: [],
        weeklyBuzz: true,
        showMemberSince: true,
        createdAt: Date.now(),
        pendingVenueName: pendingVenueName // Capture business name intent
      };

      await setDoc(doc(db, 'users', uid), newProfile);

      // 3. Funnel through finishLogin to enforce MFA
      await finishLogin(userCredential.user);

    } catch (error: any) {
      console.error("Partner Registration Error:", error);
      showToast(mapAuthErrorToMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserLogin = async () => {
    // ... existing user login logic ...
    if (!email.includes('@')) { showToast('Please enter a valid email.'); return; }
    if (!password) { showToast('Please enter your password.'); return; }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const profileSnap = await getDoc(doc(db, 'users', uid));

      if (profileSnap.exists()) {
        await finishLogin(userCredential.user);
      } else {
        showToast('Profile not found. Please register.');
        setUserSubMode('signup');
      }
    } catch (error: any) {
      showToast(mapAuthErrorToMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const profile = await AuthService.signInWithGoogle();
      await finishLogin(auth.currentUser!);
    } catch (error: any) {
      if (error.code === 'auth/multi-factor-auth-required') {
        await handleMfaRequired(error);
      } else if (error.code !== 'auth/popup-closed-by-user') {
        showToast(mapAuthErrorToMessage(error.code));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      const profile = await AuthService.signInWithFacebook();
      await finishLogin(auth.currentUser!);
    } catch (error: any) {
      if (error.code === 'auth/multi-factor-auth-required') {
        await handleMfaRequired(error);
      } else if (error.code !== 'auth/popup-closed-by-user') {
        showToast(mapAuthErrorToMessage(error.code));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async () => {
    if (!handle.trim()) { showToast('You need a Handle for the League!'); return; }
    if (!email.includes('@')) { showToast('Please enter a valid email.'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters.'); return; }
    if (!acceptTerms) { showToast('Please accept the Terms & Conditions.'); return; }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const newProfile: UserProfile = {
        uid: uid,
        role: 'guest', // Default to Guest
        systemRole: 'guest',
        venuePermissions: {},
        handle,
        email,
        phone: '', // Collected later
        homeBase: '', // Collected later
        favoriteDrinks: [], // Collected later
        weeklyBuzz: true, // Default to true, opt-out later
        showMemberSince: true,
        createdAt: Date.now(),
        stats: { // Initialize empty stats just in case
          seasonPoints: 50, // Welcome bonus (Shadow points until join?)
          lifetimeClockins: 0,
          currentStreak: 0,
          vibeCheckCount: 0,
          competitionPoints: 0
        }
      };

      setAlertPrefs?.({
        ...alertPrefs,
        weeklyDigest: true
      });

      await setDoc(doc(db, 'users', uid), newProfile);
      setUserProfile(newProfile);
      onClose();
      showToast(`Welcome to OlyBars, ${handle}!`, 'success');
    } catch (error: any) {
      console.error("Registration Error:", error);
      showToast(mapAuthErrorToMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOwnerLogin = async () => {
    if (!ownerEmail.includes('@')) { showToast('Please enter a valid email.'); return; }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, ownerEmail, ownerPassword);
      await finishLogin(userCredential.user);
    } catch (error: any) {
      if (error.code === 'auth/multi-factor-auth-required') {
        await handleMfaRequired(error);
      } else {
        showToast(mapAuthErrorToMessage(error.code));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaRequired = async (error: any) => {
    const resolver = getMultiFactorResolver(auth, error);
    setMfaResolver(resolver);

    const hints = resolver.hints;
    if (hints[0] && hints[0].factorId === 'phone') {
      const verifier = MfaService.createRecaptchaVerifier('recaptcha-container');
      setRecaptchaVerifier(verifier);
      const verificationId = await MfaService.startChallenge(resolver, hints[0], verifier);
      setMfaId(verificationId);
      setShowMfaStep(true);
      showToast('ONE-TIME CODE SENT TO SECURE DEVICE', 'success');
    } else {
      showToast('MFA REQUIRED: PLEASE CONTACT HQ FOR SETUP', 'error');
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaCode || !mfaResolver || !mfaId) return;
    setIsLoading(true);
    try {
      const firebaseUser = await MfaService.resolveChallenge(mfaResolver, mfaId, mfaCode);
      await finishLogin(firebaseUser);
    } catch (error: any) {
      showToast('INVALID MFA CODE. PLEASE RETRY.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const finishLogin = async (firebaseUser: FirebaseUser) => {
    const uid = firebaseUser.uid;
    const profileSnap = await getDoc(doc(db, 'users', uid));
    if (profileSnap.exists()) {
      const profileData = profileSnap.data() as UserProfile;

      if (firebaseUser.email === 'ryan@amaspc.com') {
        // The Ryan Rule: Always force super-admin rights
        const superAdminData = {
          role: 'super-admin' as UserRole,
          systemRole: 'admin' as SystemRole,
          handle: profileData.handle || 'Ryan (Admin)',
          email: 'ryan@amaspc.com',
          venuePermissions: profileData.venuePermissions || {},
        };

        await setDoc(doc(db, 'users', uid), {
          ...superAdminData,
          ...(profileData.stats?.seasonPoints === 9999 ? { stats: { ...profileData.stats, seasonPoints: 0 } } : {})
        }, { merge: true });

        setUserProfile({ ...profileData, ...superAdminData });
        if (onOwnerSuccess) onOwnerSuccess();
        if (onSuccess) onSuccess();
        onClose();
        showToast(`Logged in as SUPER - ADMIN(Golden Ticket)`, 'success');
        return;
      }

      setUserProfile(profileData);

      // RBAC Access Check
      const hasPartnerAccess = MfaService.isPartner(profileData);
      const hasIntent = sessionStorage.getItem('claim_intent_venue');
      const isSignupFlow = userSubMode === 'signup' || !!profileData.pendingVenueName;

      if (loginMode === 'owner') {
        if (!hasPartnerAccess && !hasIntent && !isSignupFlow) {
          showToast(`Access Denied: ${profileData.email} is not authorized for Venue management.`);
          setIsLoading(false);
          return;
        }

        // Check for enrollment for partners
        if (!MfaService.isEnrolled(firebaseUser)) {
          setShowMfaEnrollmentStep(true);
          showToast('MFA ENROLLMENT REQUIRED FOR PARTNER ACCESS', 'info');
          return; // Block further login progress
        }
        if (onOwnerSuccess) onOwnerSuccess();
        if (onSuccess) onSuccess();
        onClose();
        showToast(`Logged in as ${profileData.handle || 'Owner'} `, 'success');
      } else {
        if (onSuccess) onSuccess();
        onClose();
        showToast(`Welcome back, ${profileData.handle || 'Legend'} !`, 'success');
      }
    } else {
      showToast('Profile not found. Please register.');
      if (loginMode !== 'owner') {
        setUserSubMode('signup');
      }
    }
  };

  const handleStartMfaEnrollment = async () => {
    if (!auth.currentUser || !mfaEnrollPhone) return;
    setIsLoading(true);
    try {
      const verifier = MfaService.createRecaptchaVerifier('recaptcha-enroll-container');
      setRecaptchaVerifier(verifier);
      const vId = await MfaService.startEnrollment(auth.currentUser, mfaEnrollPhone, verifier);
      setMfaEnrollVerificationId(vId);
      setMfaEnrollStep('code');
      showToast('VERIFICATION CODE SENT', 'success');
    } catch (error: any) {
      console.error('MFA Enrollment Error:', error);
      showToast('FAILED TO START ENROLLMENT. CHECK PHONE FORMAT.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfaEnrollment = async () => {
    if (!auth.currentUser || !mfaEnrollVerificationId || !mfaCode) return;
    setIsLoading(true);
    try {
      await MfaService.finishEnrollment(auth.currentUser, mfaEnrollVerificationId, mfaCode);
      showToast('MFA SECURED. ACCESS GRANTED.', 'success');

      // Cleanup recaptcha
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      }

      // Resume login flow through finishLogin to ensure state is fully updated
      await finishLogin(auth.currentUser);
    } catch (error: any) {
      showToast('INVALID CODE. PLEASE RETRY.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaEnrollCancel = async () => {
    await MfaService.revokeSession();
    setShowMfaEnrollmentStep(false);
    setMfaEnrollStep('phone');
    onClose();
    showToast('LOGIN CANCELLED: MFA REQUIRED FOR PARTNERS.', 'info');
  };

  const inputClasses = "w-full glass-input rounded-md py-3 text-sm outline-none font-bold pl-10 focus:ring-opacity-50";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-sm rounded-xl relative flex flex-col max-h-[90vh] overflow-hidden">
        {userSubMode === 'login' && !showMfaStep && (
          <div className="flex border-b border-white/10">
            <button onClick={() => setLoginMode('user')} className={`flex-1 py-4 font-black uppercase tracking-wider transition-colors ${loginMode === 'user' ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`}>Player</button>
            <button onClick={() => setLoginMode('owner')} className={`flex-1 py-4 font-black uppercase tracking-wider transition-colors ${loginMode === 'owner' ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`}>Partner</button>
          </div>
        )}

        <div className="p-6 overflow-y-auto text-white">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/50 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-all active:scale-90 z-10"><X className="w-4 h-4" /></button>

          <div id="recaptcha-container"></div>
          <div id="recaptcha-enroll-container"></div>

          {showMfaEnrollmentStep ? (
            <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-primary/30">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase">Secure Your Account</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">MFA is required for Venue Partners</p>
              </div>

              {mfaEnrollStep === 'phone' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={mfaEnrollPhone}
                      onChange={(e) => setMfaEnrollPhone(e.target.value)}
                      placeholder="+1 555-000-0000"
                      className={inputClasses}
                    />
                  </div>
                  <button
                    onClick={handleStartMfaEnrollment}
                    disabled={isLoading || !mfaEnrollPhone}
                    className="w-full bg-primary text-black font-bold py-3 rounded uppercase disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : 'Send Security Code'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="6-Digit Code"
                      className="w-full glass-input text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-md outline-none"
                      maxLength={6}
                    />
                  </div>
                  <button
                    onClick={handleVerifyMfaEnrollment}
                    disabled={isLoading || mfaCode.length < 6}
                    className="w-full bg-primary text-black font-bold py-3 rounded uppercase disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : 'Verify & Finish'}
                  </button>
                  <button
                    onClick={() => setMfaEnrollStep('phone')}
                    className="text-[10px] text-slate-500 hover:text-white uppercase font-bold"
                  >
                    Change Phone Number
                  </button>
                </div>
              )}

              <button
                onClick={handleMfaEnrollCancel}
                className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest pt-4"
              >
                Log Out & Exit
              </button>
            </div>
          ) : showMfaStep ? (
            <div className="space-y-6 text-center">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-primary/30">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase">Identity Verification</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Check your text messages for a code</p>
              </div>

              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="6-Digit Code"
                  className="w-full glass-input text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-md outline-none"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleVerifyMfa}
                disabled={isLoading || mfaCode.length < 6}
                className="w-full bg-primary text-black font-bold py-3 rounded uppercase disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Unlock Dashboard'}
              </button>

              <button
                onClick={() => setShowMfaStep(false)}
                className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest"
              >
                Cancel
              </button>
            </div>
          ) : loginMode === 'user' ? (
            <>
              <form onSubmit={(e) => { e.preventDefault(); userSubMode === 'signup' ? saveUser() : handleUserLogin(); }} className="space-y-4">
                <div className="text-center">
                  <h3 className="type-h2">{userSubMode === 'signup' ? 'Create Account' : 'Player Login'}</h3>
                  <p className="type-label mt-1">{userSubMode === 'signup' ? 'Join the nightlife network' : 'Level up your night'}</p>
                </div>

                <div className="space-y-2 pb-4 border-b border-slate-700">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full glass-ghost text-white font-bold py-3 rounded flex items-center justify-center gap-3 uppercase disabled:opacity-50 hover:bg-white hover:text-black active:scale-95 transition-all group"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                    </svg>
                    Google
                  </button>

                  <button
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                    className="w-full glass-ghost text-white font-bold py-3 rounded flex items-center justify-center gap-3 uppercase disabled:opacity-50 hover:bg-[#1877F2] active:scale-95 transition-all group"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </button>
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Or use email</span>
                </div>

                {userSubMode === 'signup' && (
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Handle" className={inputClasses} />
                  </div>
                )}

                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClasses} />
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputClasses} autoComplete="current-password" />
                </div>

                {userSubMode === 'signup' && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary"
                      />
                      <label htmlFor="acceptTerms" className="text-[10px] font-bold text-slate-400 uppercase">
                        I accept the <a href="/terms" target="_blank" className="text-primary hover:underline">Terms & Conditions</a>
                      </label>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-black font-black py-3 rounded mt-4 uppercase disabled:opacity-50 active:scale-95 transition-transform shadow-[0_0_20px_-5px_rgba(251,191,36,0.4)]"
                >
                  {isLoading ? 'Processing...' : userSubMode === 'signup' ? 'Create Account' : 'Login'}
                </button>
              </form>



              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setUserSubMode(userSubMode === 'signup' ? 'login' : 'signup')}
                  className="text-[10px] text-slate-500 hover:text-primary uppercase font-bold"
                >
                  {userSubMode === 'signup' ? 'Already have an account? Login' : 'Need an account? Sign Up'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-red-900/20 p-3 text-[10px] text-red-300 rounded border border-red-800 uppercase text-center font-bold mb-4">
                {userSubMode === 'signup' ? 'Partner Registration' : 'Partner Access'}
              </div>

              {/* Social Login Buttons - Moved to Top */}
              <div className="space-y-2 pb-4 border-b border-slate-700">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full glass-ghost text-white font-bold py-3 rounded flex items-center justify-center gap-3 uppercase disabled:opacity-50 hover:bg-white hover:text-black active:scale-95 transition-all group"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                  className="w-full glass-ghost text-white font-bold py-3 rounded flex items-center justify-center gap-3 uppercase disabled:opacity-50 hover:bg-[#1877F2] active:scale-95 transition-all group"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
              </div>

              <div className="text-center py-4">
                <span className="text-[10px] font-bold uppercase text-slate-500">Or use email</span>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); userSubMode === 'signup' ? handleOwnerSignup() : handleOwnerLogin(); }} className="space-y-4">

                {userSubMode === 'signup' && (
                  <>
                    <div className="relative">
                      <Home className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="Contact Name (e.g. John Doe)"
                        className={inputClasses}
                      />
                    </div>
                    <div className="relative">
                      <Beer className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={pendingVenueName}
                        onChange={(e) => setPendingVenueName(e.target.value)}
                        placeholder="Business Name (e.g. The Artesian)"
                        className={inputClasses}
                      />
                    </div>
                  </>
                )}

                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="Business Email" className={inputClasses} />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} placeholder="Password" className={inputClasses} autoComplete="current-password" />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-black font-black py-3 rounded mt-4 uppercase hover:bg-yellow-500 active:scale-95 transition-all shadow-[0_0_20px_-5px_rgba(251,191,36,0.4)]"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : userSubMode === 'signup' ? 'Register Venue' : 'Login'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Redirect to claim flow instead of toggle
                      window.location.href = '/partners/claim';
                    }}
                    className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest"
                  >
                    CLAIM YOUR VENUE
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
