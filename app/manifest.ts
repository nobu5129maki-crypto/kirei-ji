import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "字をきれいに",
    short_name: "きれい字",
    description: "大人の字を、もう一度整える。漢字・ひらがなの矯正練習。",
    start_url: "/",
    display: "standalone",
    background_color: "#F4EFE6",
    theme_color: "#F4EFE6",
    lang: "ja",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
