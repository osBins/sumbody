import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to M/D/YYYY format (no leading zeros).
 * Returns the original string if it cannot be parsed into a valid date.
 * Returns an empty string if the input is empty/falsy.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}
