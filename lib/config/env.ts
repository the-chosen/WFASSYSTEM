/**
 * Environment variable validation and configuration
 * This ensures all required environment variables are set and provides defaults
 */

const requiredEnvVars = [] as const;
const optionalEnvVars = {
  DATABASE_URL: "",
  SESSION_SECRET: "wichi-farms-secret-change-in-prod",
  PORT: "5000",
  NODE_ENV: "development",
} as const;

type EnvVar = typeof requiredEnvVars[number] | keyof typeof optionalEnvVars;

function validateEnv(): Record<string, string> {
  const env: Record<string, string> = { ...optionalEnvVars };

  // Check required environment variables
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
    env[varName] = value;
  }

  // Set optional environment variables
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    env[key] = process.env[key] || defaultValue;
  }

  // Warn if DATABASE_URL is not set (using SQLite fallback)
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL not set. Using SQLite for local development.");
    console.warn("Set DATABASE_URL for cloud database access.");
  }

  return env;
}

export const env = validateEnv();

// Type-safe environment variable access
export function getEnv(key: EnvVar): string {
  return env[key as string];
}
