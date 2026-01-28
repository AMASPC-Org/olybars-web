import { z } from 'zod';

export const ConfigSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default(process.env.PORT || '3001'),

    // Auth & Project
    GOOGLE_CLOUD_PROJECT: z.string().default(process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'ama-ecosystem-prod'),

    // Internal Communication (Secured via Secret Manager in Prod)
    INTERNAL_HEALTH_TOKEN: z.string().default(process.env.INTERNAL_HEALTH_TOKEN || 'oly-internal-default-shared'),

    // AI / Gemini (Private Secrets)
    GOOGLE_GENAI_API_KEY: z.string().optional(), // Optional in prod (uses ADC)

    // Maps (Private Secrets - for server-side services)
    GOOGLE_BACKEND_KEY: z.string().optional(),

    // Frontend Assets (Public - these MUST follow VITE_ naming convention)
    VITE_GOOGLE_BROWSER_KEY: z.string().min(1, 'VITE_GOOGLE_BROWSER_KEY is required for frontend Maps display'),
    VITE_APP_CHECK_KEY: z.string().optional(), // reCAPTCHA site key (public)

    // URLs
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    BACKEND_URL: z.string().default('http://localhost:8080'),

    // Meta Integration (Track A: Venue Sync)
    META_APP_ID: z.string().optional(),
    META_APP_SECRET: z.string().optional(),
    META_REDIRECT_URI: z.string().optional(),

    // Voice Induction (Twilio)
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),

    // Cloud Run / Tasks Identity
    // The Service Account Email that this service runs as, or that invokes it (for OIDC checks)
    SERVICE_ACCOUNT_EMAIL: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export const isProduction = () => process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;
export const isLocal = () => !process.env.K_SERVICE;
