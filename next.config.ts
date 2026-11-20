import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // エックスサーバーは /kirei-ji/ 。同じファイルをドメイン直下に置いても動くよう、
  // クライアントは basePath を足さない。付いているときだけ外す。
  basePath: "/kirei-ji",
  experimental: {
    manualClientBasePath: true,
  },
};

export default nextConfig;
