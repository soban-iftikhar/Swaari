/**
 * Boot-time environment validation.
 *
 * This module reads `process.env` only to assert that required variables are
 * present, then throws a descriptive error if any are missing so the process
 * fails fast at startup. It intentionally does NOT store, export, or expose any
 * secret values — every consumer reads `process.env` directly. Keep all values
 * in `.env` (see `.env.example` for the template).
 */

/** Variables the server cannot start without. */
const REQUIRED = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];

/**
 * Assert all required environment variables are set.
 * @throws {Error} Lists every missing variable in one message.
 */
export default function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  // MONGO_URI has a supported alias, so check it separately.
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    missing.push("MONGO_URI");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}.\n` +
        `Copy Backend/.env.example to Backend/.env and fill in the values.`,
    );
  }
}
