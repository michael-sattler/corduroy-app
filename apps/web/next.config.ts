import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.join(__dirname, "../..");

const vercelPathRewrites = [
  { source: "/app", destination: "/dashboard" },
  { source: "/app/:path*", destination: "/:path*" },
  { source: "/staff", destination: "/dashboard" },
  { source: "/staff/:path*", destination: "/:path*" },
];

const nextConfig: NextConfig = {
  // Standalone is for Docker/Railway self-hosting; Vercel uses its own output.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  outputFileTracingRoot: monorepoRoot,
  async rewrites() {
    return {
      beforeFiles: vercelPathRewrites,
    };
  },
};

export default nextConfig;
