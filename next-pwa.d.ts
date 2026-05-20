declare module "next-pwa" {
  import type { NextConfig } from "next";

  type NextPwaConfig = {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
  };

  export default function nextPwa(config: NextPwaConfig): (
    nextConfig: NextConfig
  ) => NextConfig;
}
