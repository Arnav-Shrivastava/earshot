import pino, { type DestinationStream, type Logger } from "pino";

export type { Logger };

/** Field names whose values must never reach a log line. */
const SECRET_KEYS = [
  "apiKey",
  "api_key",
  "password",
  "token",
  "accessToken",
  "secret",
  "authorization",
  "cookie",
  "EARSHOT_SECRET",
  "DATABASE_URL",
];

export const REDACT_PATHS = [
  ...SECRET_KEYS,
  ...SECRET_KEYS.map((key) => `*.${key}`),
  ...SECRET_KEYS.map((key) => `*.*.${key}`),
  'headers["x-api-key"]',
  'req.headers["x-api-key"]',
];

export interface LoggerOptions {
  name?: string;
  level?: string;
  destination?: DestinationStream;
}

export function createLogger({
  name = "earshot",
  level = "info",
  destination,
}: LoggerOptions = {}): Logger {
  return pino(
    {
      name,
      level,
      redact: { paths: REDACT_PATHS, censor: "[redacted]" },
    },
    destination,
  );
}
