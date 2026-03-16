import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HaulYeah LoadCalc",
    short_name: "LoadCalc",
    description: "Dump truck haul and material calculator",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#f97316",
    orientation: "portrait",
    icons: [
      {
        src: "/haulyeah-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/haulyeah-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}