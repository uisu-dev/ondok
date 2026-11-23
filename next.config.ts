import type { NextConfig } from "next";

const noStoreHeaders = [
  {
    key: "Cache-Control",
    value: "private, no-store, no-cache, must-revalidate",
  },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "shopping-phinf.pstatic.net" },
      { protocol: "https", hostname: "*.pstatic.net" },
    ],
  },
  async headers() {
    return [
      { source: "/admin/students", headers: noStoreHeaders },
      { source: "/admin/students/:path*", headers: noStoreHeaders },
      { source: "/api/admin/students", headers: noStoreHeaders },
      { source: "/api/admin/students/:path*", headers: noStoreHeaders },
    ];
  },
};

export default nextConfig;
