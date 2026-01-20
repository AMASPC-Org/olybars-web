import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';

export class StorageService {
    /**
     * Uploads a buffer to Firebase Storage and returns the public URL.
     * @param buffer Image buffer
     * @param venueId Venue ID for organization
     * @param folder Subfolder (default: 'generated')
     */
    static async uploadImage(buffer: Buffer, venueId: string, folder: string = 'generated'): Promise<string> {
        if (!process.env.GOOGLE_CLOUD_PROJECT) {
            // Fallback for local emulator if env missing (though usually present)
            console.warn('GOOGLE_CLOUD_PROJECT missing, defaulting to ama-ecosystem-prod');
        }
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'ama-ecosystem-prod';

        // Use the default bucket or specific one
        const bucket = admin.storage().bucket(`${projectId}.appspot.com`);

        const filename = `venues/${venueId}/${folder}/${Date.now()}_${randomUUID()}.png`;
        const file = bucket.file(filename);

        await file.save(buffer, {
            metadata: {
                contentType: 'image/png',
            },
            public: true, // Make publicly accessible
        });

        return `https://storage.googleapis.com/${bucket.name}/${filename}`;
    }
}
