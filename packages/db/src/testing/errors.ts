/**
 * Drizzle wraps driver errors as "Failed query: ..." and keeps the Postgres
 * message on `cause`. Returns the innermost message for assertions.
 */
export async function pgErrorMessage(promise: PromiseLike<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    let current: unknown = error;
    while (current instanceof Error && current.cause instanceof Error) current = current.cause;
    return current instanceof Error ? current.message : String(current);
  }
  throw new Error("expected the query to fail, but it succeeded");
}
