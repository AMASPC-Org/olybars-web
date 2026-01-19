import { z } from 'zod';

export const ConfigSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3001'),

    // Auth & Project
    GOOGLE_CLOUD_PROJECT: z.string().default('ama-ecosystem-prod'),

    // Internal Communication (Secured via Secret Manager in Prod)
    INTERNAL_HEALTH_TOKEN: z.string().min(1, 'INTERNAL_HEALTH_TOKEN is required for diagnostic endpoints'),
    MASTER_SETUP_KEY: z.string().optional(), // Used for initial super-admin setup

    // AI / Gemini (Private Secrets)
    GOOGLE_GENAI_API_KEY: z.string().optional(), // Optional in prod (uses ADC)

    // Maps (Private Secrets - for server-side services)
    GOOGLE_BACKEND_KEY: z.string().min(1, 'GOOGLE_BACKEND_KEY is required for server-side Maps services'),

    // Frontend Assets (Public - these MUST follow VITE_ naming convention)
    VITE_GOOGLE_BROWSER_KEY: z.string().min(1, 'VITE_GOOGLE_BROWSER_KEY is required for frontend Maps display'),
    VITE_APP_CHECK_KEY: z.string().optional(), // reCAPTCHA site key (public)

    // URLs
    FRONTEND_URL: z.string().default('http://localhost:3000'),
});

export type Config = z.infer<typeof ConfigSchema>;

export const isProduction = () => process.env.NODE_ENV === 'production';
export const isLocal = () => !process.env.K_SERVICE; // K_SERVICE is set in Cloud Run
