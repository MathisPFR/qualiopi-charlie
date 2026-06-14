import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev et prod séparés : un `npm run build` ne doit pas casser `next dev` (CSS 404)
  distDir:
    process.env.NODE_ENV === "production"
      ? "node_modules/.cache/next-build"
      : "node_modules/.cache/next-dev",
  output: "standalone",
  serverExternalPackages: ["puppeteer", "@puppeteer/browsers"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
