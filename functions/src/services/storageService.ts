import * as admin from "firebase-admin";
import { randomUUID } from "crypto";
import { config } from "../config";

export class StorageService {
  /**
   * Uploads a buffer to Firebase Storage and returns the public URL.
   * @param buffer Image buffer
   * @param venueId Venue ID for organization
   * @param folder Subfolder (default: 'generated')
   */
  static async uploadImage(
    buffer: Buffer,
    venueId: string,
    folder: string = "generated",
  ): Promise<string> {
    const projectId = config.GOOGLE_CLOUD_PROJECT;

    // Use the default bucket or specific one
    const bucket = admin.storage().bucket(`${projectId}.appspot.com`);

    const filename = `venues/${venueId}/${folder}/${Date.now()}_${randomUUID()}.png`;
    const file = bucket.file(filename);

    await file.save(buffer, {
      metadata: {
        contentType: "image/png",
      },
      public: true, // Make publicly accessible
    });

    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
  }
}
