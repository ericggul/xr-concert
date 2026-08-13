import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [process.env.NEXT_PUBLIC_DEV_HOSTNAME || "localhost"],
  devIndicators: false,
};

export default nextConfig;
