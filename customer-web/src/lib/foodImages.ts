// Image handling for menu dishes.
//
// 1. We ALWAYS prefer the dish's own image coming from the API (`dish.image`).
//    Relative/media paths are resolved against the backend origin.
// 2. When a dish has no image we DON'T reuse a shared stock photo (that caused
//    different dishes to show the same picture). Instead each dish gets a clean,
//    deterministic gradient tile + food icon, so every card looks distinct and
//    never breaks the layout.

import { API_BASE_URL } from "./api";

const MEDIA_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

/** Resolve a usable absolute URL for a dish image, or null when absent. */
export function resolveDishImage(image?: string | null): string | null {
  if (!image || typeof image !== "string") return null;
  const trimmed = image.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${MEDIA_ORIGIN}${trimmed}`;
  return `${MEDIA_ORIGIN}/${trimmed}`;
}

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Deterministic, appetising gradient (CSS value) for a dish's fallback tile.
 * The hue is spread across a warm/food-friendly range and derived from the
 * dish name, so each dish reliably gets its own distinct colour.
 */
export function getFallbackGradient(name: string): string {
  const h = hashString(name || "dish");
  const hue = h % 360;
  const hue2 = (hue + 24) % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 52%), hsl(${hue2} 72% 38%))`;
}
