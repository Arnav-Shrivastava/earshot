/**
 * Runs once when the Next.js server starts. Node-only code lives in
 * `instrumentation-node.ts` so the Edge bundle never sees Node APIs.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await import("./instrumentation-node");
}
