import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
// Uploaded PDFs are previewed from the Supabase storage.
const storageOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  `frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com ${storageOrigin}`.trim(),
  "object-src 'none'",
  "img-src 'self' data: https://i.ytimg.com",
  "font-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self'${isDevelopment ? " ws: http: https:" : ""}`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    // PDF uploads from the admin: 4 MB file cap, under Vercel's 4.5 MB request limit.
    serverActions: { bodySizeLimit: "5mb" },
  },
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The site previews its own PDFs in a frame; everything else stays unframeable.
      {
        source: "/documents/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'") },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/nous-contacter", destination: "/nous-rejoindre", permanent: true },
      {
        source: "/nous-contacter/devenir-adherent",
        destination: "/nous-rejoindre",
        permanent: true,
      },
      { source: "/nos-objectifs-2", destination: "/qui-sommes-nous", permanent: true },
      {
        source: "/nos-objectifs-2/les-activites",
        destination: "/activites",
        permanent: true,
      },
      { source: "/le-trouble-bipolaire-2", destination: "/ressources", permanent: true },
      {
        source: "/le-trouble-bipolaire-2/video-conferences",
        destination: "/ressources",
        permanent: true,
      },
      {
        source: "/le-trouble-bipolaire-2/sites-internet",
        destination: "/ressources",
        permanent: true,
      },
      { source: "/evenements", destination: "/actualites", permanent: true },
      {
        source: "/actualites-2__trashed/samedi",
        destination: "/actualites",
        permanent: true,
      },
      {
        source: "/actualites-2__trashed/conferences",
        destination: "/actualites",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
