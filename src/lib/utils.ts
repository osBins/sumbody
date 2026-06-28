import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a date string in MM/DD/YYYY or M/D/YYYY format (how it's stored in the DB).
 * Returns a Date object or null if unparseable.
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1; // MM is 1-indexed in input
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  // Fallback: try native Date parsing
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date string from MM/DD/YYYY (stored) to DD/MM/YYYY (display).
 * Returns the original string if it cannot be parsed.
 * Returns empty string if input is empty/falsy.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}
