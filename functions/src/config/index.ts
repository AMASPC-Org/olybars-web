import { ConfigSchema, type Config } from "./schema";
import { loadLocalEnv } from "./envLoader";

/**
 * Validates and exports the server configuration.
 * Single source of truth for the OlyBars backend.
 */
function initializeConfig(): Config {
  // 1. Load local environment files if not in production
  loadLocalEnv();

  // 2. Validate process.env against schema
  try {
    const config = ConfigSchema.parse(process.env);
    console.log("✅ [CONFIG] Configuration validated successfully.");
    return config;
  } catch (error: any) {
    console.error("❌ [CONFIG] Invalid Configuration:");
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`   - ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error(error.message);
    }
    process.exit(1); // Fail Fast
  }
}

// Lazy Load Configuration to prevent crashes during Deployment/Discovery/Build
// when Runtime Environment Variables (Secret Manager) are not yet available.
let _config: Config | undefined;

function getConfig(): Config {
  if (!_config) {
    _config = initializeConfig();
  }
  return _config;
}

export const config = new Proxy({} as Config, {
  get: (_target, prop) => {
    return getConfig()[prop as keyof Config];
  },
});

export const isLocal = (): boolean => {
  // Cloud Run sets K_SERVICE, Cloud Functions sets FUNCTION_TARGET
  // Local development usually has neither, or NODE_ENV != production
  const isCloud =
    !!process.env.K_SERVICE ||
    !!process.env.FUNCTION_TARGET ||
    process.env.NODE_ENV === "production";
  return !isCloud;
};

export default config;
