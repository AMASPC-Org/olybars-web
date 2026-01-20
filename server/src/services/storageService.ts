import { storage } from '../firebaseAdmin.js';
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
            throw new Error('GOOGLE_CLOUD_PROJECT env var missing');
        }

        const bucket = storage.bucket(`${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`); // Default Firebase bucket
        // If separate bucket needed, use config.STORAGE_BUCKET

        const filename = `venues/${venueId}/${folder}/${Date.now()}_${randomUUID()}.png`;
        const file = bucket.file(filename);

        await file.save(buffer, {
            metadata: {
                contentType: 'image/png',
            },
            public: true, // Make publicly accessible
        });

        // Use publicUrl() directly if available or construct it
        // Note: publicUrl() usually returns a signed URL or authenticated link.
        // For public assets, we want the long-lived public link.

        // Standard Firebase Storage Public URL format
        return `https://storage.googleapis.com/${bucket.name}/${filename}`;
    }
}
