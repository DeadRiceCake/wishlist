import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wish Pixel",
    short_name: "WishPixel",
    description: "커플이 서로 하고 싶은 일을 공유하는 8비트 감성 PWA",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d8f7be",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
