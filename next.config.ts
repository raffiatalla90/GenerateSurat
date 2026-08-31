import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output generation untuk production build
  output: undefined,

  // Enable React Strict Mode (optional)
  reactStrictMode: true,

  // Images handling (if needed later)
  images: {
    remotePatterns: [],
  },

  // Experimental settings (optional)
  experimental: {
    // serverActions: true,
  },
};

export default nextConfig;
