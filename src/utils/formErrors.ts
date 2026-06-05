/**
 * Extracts a readable field validation message from TanStack Form errors.
 */
export function getFieldError(errors: unknown[]): string | undefined {
  const firstError = errors[0];

  if (!firstError) {
    return undefined;
  }

  if (typeof firstError === "string") {
    return firstError;
  }

  if (typeof firstError === "object" && "message" in firstError) {
    const value = firstError.message;

    if (typeof value === "string") {
      return value;
    }
  }

  return "Input tidak valid.";
}
