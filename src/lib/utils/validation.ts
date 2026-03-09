/**
 * Shared validation utilities.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.length >= 6;
}

export function isValidTimeRange(start: string, end: string): boolean {
  return TIME_RE.test(start) && TIME_RE.test(end) && start < end;
}

export function isValidBoxCount(count: unknown): boolean {
  const n = typeof count === "number" ? count : parseInt(String(count));
  return !isNaN(n) && n >= 1 && n <= 100;
}

export function isValidPrice(price: unknown): boolean {
  const n = typeof price === "number" ? price : parseFloat(String(price));
  return !isNaN(n) && n >= 1 && n <= 10;
}

export function isValidRating(rating: unknown): boolean {
  const n = typeof rating === "number" ? rating : parseFloat(String(rating));
  return !isNaN(n) && n >= 1 && n <= 5;
}
