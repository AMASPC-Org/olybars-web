import { auth } from '../lib/firebase';
import { multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier, User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../types';
import { isSystemAdmin } from '../types/auth_schema';

export const MfaService = {
    /**
     * Check if a user is considered a "Partner" (Owner, Manager, Staff, or Admin)
     * Partners are required to have MFA enabled.
     */
    isPartner(profile: UserProfile | null | undefined): boolean {
        if (!profile) return false;
        // System Admins (League HQ) are partners
        if (isSystemAdmin(profile)) return true;
        // Anyone with venue permissions is a partner
        return Object.keys(profile.venuePermissions || {}).length > 0;
    },

    /**
     * Check if the current Firebase user has MFA enrolled
     */
    isEnrolled(user: FirebaseUser | null): boolean {
        if (!user) return false;
        return multiFactor(user).enrolledFactors.length > 0;
    },

    getEnrolledFactors(user: FirebaseUser | null) {
        if (!user) return [];
        return multiFactor(user).enrolledFactors;
    },

    /**
     * Initialize a RecaptchaVerifier for MFA actions
     */
    createRecaptchaVerifier(containerId: string): RecaptchaVerifier {
        return new RecaptchaVerifier(auth, containerId, {
            size: 'invisible',
            callback: () => {
                // reCAPTCHA solved
            }
        });
    },

    /**
     * Normalize phone number to E.164 format
     */
    normalizePhoneNumber(phone: string): string {
        const cleaned = phone.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+')) return cleaned;
        // Assume US/Canada for now if no prefix, but E.164 is preferred
        return `+1${cleaned.replace(/^1/, '')}`;
    },

    /**
     * Start the MFA enrollment process
     */
    async startEnrollment(user: FirebaseUser, phoneNumber: string, verifier: RecaptchaVerifier): Promise<string> {
        const normalized = this.normalizePhoneNumber(phoneNumber);
        const session = await multiFactor(user).getSession();
        const phoneInfoOptions = {
            phoneNumber: normalized,
            session
        };
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        return await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, verifier);
    },

    /**
     * Sign out the user (used for bypass protection)
     */
    async revokeSession(): Promise<void> {
        await auth.signOut();
    },

    /**
     * Complete the MFA enrollment process
     */
    async finishEnrollment(user: FirebaseUser, verificationId: string, verificationCode: string, label: string = 'Primary Phone'): Promise<void> {
        const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
        await multiFactor(user).enroll(multiFactorAssertion, label);
    },

    /**
     * Unenroll MFA
     */
    async unenroll(user: FirebaseUser, factorIndex: number = 0): Promise<void> {
        const enrolledFactors = multiFactor(user).enrolledFactors;
        if (enrolledFactors[factorIndex]) {
            await multiFactor(user).unenroll(enrolledFactors[factorIndex]);
        }
    },

    /**
     * Resolve an MFA challenge during sign-in
     */
    async resolveChallenge(resolver: any, verificationId: string, verificationCode: string): Promise<FirebaseUser> {
        const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
        const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
        return userCredential.user;
    },

    /**
     * Start the MFA challenge process (send OTP)
     */
    async startChallenge(resolver: any, factorHint: any, verifier: RecaptchaVerifier): Promise<string> {
        const phoneInfoOptions = {
            multiFactorHint: factorHint,
            session: resolver.session
        };
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        return await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, verifier);
    }
};
