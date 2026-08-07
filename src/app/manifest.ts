import { brand } from "@/config/brand";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} — ${brand.fullName}`,
    short_name: brand.name,
    description: brand.promise,
    start_url: "/",
    display: "browser",
    background_color: brand.colors.background,
    theme_color: brand.colors.background,
    lang: "ru",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
