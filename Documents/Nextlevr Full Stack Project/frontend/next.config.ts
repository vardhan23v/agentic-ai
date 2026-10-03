import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Standalone output is used for Docker self-hosting; Vercel uses the default build output.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
