export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "https://mohamed-ashour.vercel.app";

  return raw.startsWith("http") ? raw : `https://${raw}`;
}