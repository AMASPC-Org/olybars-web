import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv: RulesTestEnvironment;

describe('Firestore Security Rules', () => {
    beforeAll(async () => {
        testEnv = await initializeTestEnvironment({
            projectId: 'olybars-rules-test',
            firestore: {
                rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf-8'),
                host: '127.0.0.1',
                port: 8080
            }
        });
    });

    beforeEach(async () => {
        await testEnv.clearFirestore();
    });

    afterAll(async () => {
        await testEnv.cleanup();
    });

    it('denies access to non-existent users for private data', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await assertFails(getDoc(doc(alice.firestore(), 'users/alice')));
    });

    it('allows a user to read their own profile', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'users/alice'), { email: 'alice@example.com', role: 'user' });
        });
        await assertSucceeds(getDoc(doc(alice.firestore(), 'users/alice')));
    });

    it('denies Ryan@amaspc.com access to admin data if role is "user"', async () => {
        const ryan = testEnv.authenticatedContext('ryan', { email: 'ryan@amaspc.com' });
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'users/ryan'), { email: 'ryan@amaspc.com', role: 'user' });
        });

        // Try to read another user's private data (requires isSuperAdmin)
        await assertFails(getDoc(doc(ryan.firestore(), 'users/alice')));

        // Try to create a venue (requires isSuperAdmin)
        await assertFails(setDoc(doc(ryan.firestore(), 'venues/new-venue'), { name: 'New Venue' }));
    });

    it('allows a user with "super-admin" role access to admin data', async () => {
        const admin = testEnv.authenticatedContext('admin_user');
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'users/admin_user'), { email: 'admin@example.com', role: 'super-admin' });
        });

        // Should succeed reading any user data
        await assertSucceeds(getDoc(doc(admin.firestore(), 'users/alice')));

        // Should succeed creating a venue
        await assertSucceeds(setDoc(doc(admin.firestore(), 'venues/new-venue'), { name: 'New Venue' }));
    });

    it('denies unauthenticated users from reading venues private data', async () => {
        const guest = testEnv.unauthenticatedContext();
        await assertFails(getDoc(doc(guest.firestore(), 'venues/venue1/private_data/secret')));
    });
});
