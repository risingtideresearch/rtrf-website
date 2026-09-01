import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    BUILD_DATE: new Date().toISOString(),
  },
  devIndicators: false,
  turbopack: {
    root: __dirname,
  },
  /* TODO remove */
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
    // capture-stills.mjs versions these with ?v=<hash> to bust the image cache;
    // everything else keeps the default of no query string
    localPatterns: [
      { pathname: "/homepage/**" },
      { pathname: "/thumbs/**" },
      { pathname: "/**", search: "" },
    ],
  },
};

export default nextConfig;
