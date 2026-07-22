import type { z } from "zod";

export type FieldErrors = Record<string, string | undefined>;

export function getZodFieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }

  return errors;
}

export function replaceFieldErrors(target: FieldErrors, source: Record<string, string>) {
  for (const key of Object.keys(target)) {
    target[key] = undefined;
  }

  Object.assign(target, source);
}

export function clearFieldErrors(target: FieldErrors) {
  for (const key of Object.keys(target)) {
    target[key] = undefined;
  }
}