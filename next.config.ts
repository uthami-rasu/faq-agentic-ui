import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev and production builds must never share generated files. Sharing `.next`
  // caused the live dev server to reference vendor chunks replaced by `next build`.
  distDir: process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === "production" ? ".next-build" : ".next-dev"),
};

export default nextConfig;
