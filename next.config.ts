import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;