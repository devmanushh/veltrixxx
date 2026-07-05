import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);
const defaultApiUrl =
  isVercel ? "https://veltrixxx-api.onrender.com" : "http://localhost:4000";
const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  (isVercel ? process.env.API_INTERNAL_URL || process.env.API_URL : process.env.LOCAL_API_URL) ||
  defaultApiUrl
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
