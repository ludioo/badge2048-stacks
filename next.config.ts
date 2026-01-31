import type { NextConfig } from "next";
import os from "node:os";

// On Vercel: 2 cores, 8GB. Limit parallelism to reduce memory pressure.
const numCpus = typeof os.cpus === "function" ? os.cpus().length : 2;
const cpus = Math.max(1, Math.min(2, numCpus - 1));

const nextConfig: NextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
    cpus,
    webpackBuildWorker: true,
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
