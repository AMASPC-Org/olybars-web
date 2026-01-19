import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, facebookProvider, db } from '../lib/firebase';
import { UserProfile } from '../types';

export const AuthService = {
    /**
     * Sign in with Google and sync profile to Firestore
     */
    async signInWithGoogle(): Promise<UserProfile> {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Sync or Create Profile
            return await this.syncUserProfile(user);
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    },

    /**
     * Sign in with Facebook and sync profile to Firestore
     */
    async signInWithFacebook(): Promise<UserProfile> {
        try {
            const result = await signInWithPopup(auth, facebookProvider);
            const user = result.user;

            // Sync or Create Profile
            return await this.syncUserProfile(user);
        } catch (error) {
            console.error('Facebook Sign-In Error:', error);
            throw error;
        }
    },

    /**
     * Sync Firebase User with Firestore UserProfile
     */
    async syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            // Update existing profile with latest email if changed
            const existingData = docSnap.data() as UserProfile;
            const updates: Partial<UserProfile> = {
                email: user.email || existingData.email,
                updatedAt: Date.now()
            };

            await updateDoc(userRef, updates);
            return { ...existingData, ...updates };
        } else {
            // Create new profile
            const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                handle: `@${user.displayName?.replace(/\s+/g, '').toLowerCase() || 'user_' + user.uid.slice(0, 5)}`,
                role: 'guest',
                systemRole: 'guest',
                venuePermissions: {},
                createdAt: Date.now(),
                updatedAt: Date.now(),
                stats: {
                    seasonPoints: 50, // Welcome bonus
                    lifetimeClockins: 0,
                    currentStreak: 0,
                    vibeCheckCount: 0,
                    competitionPoints: 0
                },
                weeklyBuzz: true,
                showMemberSince: true
            };

            await setDoc(userRef, newProfile);
            return newProfile;
        }
    },

    /**
     * Sign out
     */
    async signOut() {
        await auth.signOut();
    }
};
