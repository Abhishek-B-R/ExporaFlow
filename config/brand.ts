/**
 * Branding, in one place.
 *
 * Every value falls back to the ExporaFlow defaults, so nothing breaks if the
 * variables are unset. Set them in `.env` to run this as an internal tool
 * under your own name without touching any component.
 *
 * These are NEXT_PUBLIC_* because the sidebar, navbar and auth screens are
 * client components.
 */

export const brand = {
  /** Product name shown in the sidebar, navbar, page titles and emails. */
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "ExporaFlow",

  /** Company that operates the install. Used in legal copy and footers. */
  company: process.env.NEXT_PUBLIC_BRAND_COMPANY || "ExporaFlow",

  /** One-line description for metadata and the sign-in screen. */
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE ||
    "Internal ticketing and project tracking — incidents, change requests, sprints and SLAs in one place.",

  /** Logo served from /public. Swap the file or point at another path. */
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || "/logo.png",

  /** Support address surfaced when someone is denied access. */
  supportEmail: process.env.NEXT_PUBLIC_BRAND_SUPPORT_EMAIL || "",
} as const;

export type Brand = typeof brand;
