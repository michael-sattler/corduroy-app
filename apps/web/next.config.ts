import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  // Standalone is for Docker/Railway self-hosting; Vercel uses its own output.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
