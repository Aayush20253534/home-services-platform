/** Minimal shared primitives. Request DTO schemas follow in later phases. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isE164PhoneNumber(value: unknown): value is string {
  return typeof value === 'string' && /^\+[1-9]\d{7,14}$/.test(value);
}
