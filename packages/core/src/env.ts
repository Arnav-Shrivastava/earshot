import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string({
      error: "DATABASE_URL is required (e.g. postgres://earshot:earshot@localhost:5433/earshot)",
    })
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must start with postgres:// or postgresql://"),
  EARSHOT_SECRET: z
    .string({ error: "EARSHOT_SECRET is required (generate one with: openssl rand -base64 32)" })
    .min(32, "EARSHOT_SECRET must be at least 32 characters"),
  APP_URL: z.preprocess(emptyToUndefined, z.url().default("http://localhost:3000")),
  LOG_LEVEL: z.preprocess(
    emptyToUndefined,
    z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  ),
});

export type Env = z.infer<typeof envSchema>;

export class EnvError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid environment:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "EnvError";
  }
}

/** Validates environment variables. Throws EnvError listing every problem at once. */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((issue) => {
        const name = issue.path.join(".");
        return name && !issue.message.startsWith(name)
          ? `${name}: ${issue.message}`
          : issue.message;
      }),
    );
  }
  return result.data;
}
