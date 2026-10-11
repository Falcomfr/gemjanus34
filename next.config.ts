import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
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
