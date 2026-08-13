import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [process.env.NEXT_PUBLIC_DEV_HOSTNAME || "macbook-air-5.local"],
  devIndicators: false,
};

export default nextConfig;
