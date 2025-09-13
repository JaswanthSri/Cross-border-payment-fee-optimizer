import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ⚠️ This allows production builds to succeed even if
    // there are ESLint errors. Good for deployment, but
    // you should still fix errors later.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
