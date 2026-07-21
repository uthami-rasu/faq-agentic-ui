import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allows production verification to run alongside `next dev` without both
  // processes writing to the same generated cache directory.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
