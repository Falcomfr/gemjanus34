import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data:",
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
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
