import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "node_modules/.cache/next-build",
  output: "standalone",
  serverExternalPackages: ["puppeteer", "@puppeteer/browsers"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
