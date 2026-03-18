import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth"],
  turbopack: {
    resolveAlias: {
      // Prevent jsPDF/fflate Node.js worker issues during SSR
      "fflate/node": "fflate",
    },
  },
};

export default nextConfig;
