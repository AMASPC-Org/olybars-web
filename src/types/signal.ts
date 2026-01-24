export type SignalType = "clock_in" | "vibe_report" | "photo_upload";

export interface Signal {
  id: string;
  venueId: string;
  userId: string;
  type: SignalType;
  value: any;
  timestamp: number;
  expiresAt?: Date | number; // [FINOPS] Added for Firestore TTL
  verificationMethod?: "gps" | "qr"; // Added for Vibe Check QR System
}
