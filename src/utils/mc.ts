import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely, resolving conflicts via tailwind-merge.
 */
export function mc(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
