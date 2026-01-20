import { auth } from '../firebaseAdmin.js';

async function generateToken(uid: string) {
    try {
        console.log(`Generating custom token for UID: ${uid}...`);
        const customToken = await auth.createCustomToken(uid);
        console.log('---TOKEN_START---');
        console.log(customToken);
        console.log('---TOKEN_END---');
    } catch (error) {
        console.error('Error generating custom token:', error);
        process.exit(1);
    }
}

const uid = process.argv[2] || 'user_1';
generateToken(uid).then(() => process.exit(0));
