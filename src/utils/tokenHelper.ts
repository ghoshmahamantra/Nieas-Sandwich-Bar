/**
 * Centralized Token Number Generator & Formatter
 * Generates simple, clean tokens like T102, T204, T105 without ugly dashes or long strings.
 */
export function generateTokenNumber(): string {
  // Generates clean 3-digit token like T102, T204, T315
  const num = Math.floor(100 + Math.random() * 899);
  return `T${num}`;
}

export function formatTokenNumber(token?: string | null): string {
  if (!token) return "T101";
  // Remove hyphens if present: T-102 -> T102
  const cleaned = token.replace(/^T-?/i, "T").trim();
  return cleaned.startsWith("T") ? cleaned : `T${cleaned}`;
}
