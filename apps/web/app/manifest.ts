import type { MetadataRoute } from "next";
import { BRAND_ICON_URL, BRAND_NAME } from "@/utils/branding";

type ManifestIcon = NonNullable<MetadataRoute.Manifest["icons"]>[number];

const defaultIcons: ManifestIcon[] = [
  {
    src: "/icons/icon-192x192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any maskable",
  },
  {
    src: "/icons/icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any maskable",
  },
];

export default function manifest(): MetadataRoute.Manifest {
  const customIcon: ManifestIcon[] =
    BRAND_ICON_URL === "/icon.png"
      ? []
      : [{ src: BRAND_ICON_URL, sizes: "any" as const }];

  return {
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description:
      "Retrouvez vos messages, priorités et tâches dans un espace unique.",
    id: "/",
    lang: "fr",
    categories: ["business", "productivity"],
    icons: [...customIcon, ...defaultIcons],
    theme_color: "#FFFFFF",
    background_color: "#FFFFFF",
    start_url: "/chat",
    scope: "/",
    display: "standalone",
    shortcuts: [
      {
        name: "Accueil IA",
        short_name: "Accueil",
        description: "Voir les messages qui demandent votre attention.",
        url: "/chat",
      },
      {
        name: "Canaux",
        short_name: "Canaux",
        description: "Ouvrir vos conversations connectées.",
        url: "/channels-v4",
      },
      {
        name: "Tâches",
        short_name: "Tâches",
        description: "Consulter les prochaines actions.",
        url: "/tasks",
      },
    ],
  };
}
