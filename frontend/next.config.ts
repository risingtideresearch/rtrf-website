import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  /* TODO remove */
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
