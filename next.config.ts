import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce memory usage on Vercel (8GB build container)
  experimental: {
    webpackMemoryOptimizations: true,
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
