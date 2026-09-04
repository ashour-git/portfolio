import type { NextConfig } from "next";

// Baseline hardening headers. The CSP keeps 'unsafe-inline' for scripts and
// styles because the no-flash ThemeInit snippet is intentionally inline;
// value comes from object-src/frame-ancestors/base-uri/connect-src lockdown.
// HSTS is intentionally omitted — Vercel sends it by default; duplicating it
// risks conflicting max-age values.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self' mailto:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@huggingface/transformers"],
  headers: async () => [
    { source: "/:path*", headers: securityHeaders },
  ],
};

export default nextConfig;
