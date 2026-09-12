import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AutomationPreview } from "@/components/preview/AutomationPreview";

export default async function AutomationPage() {
  const fetchSite = (await headers()).get("sec-fetch-site");

  // Browsers can restore this legacy URL from history when the user types the
  // product name in the address bar. Treat that as a fresh app entry and open
  // the Brief; same-origin navigation still keeps Automations accessible.
  if (fetchSite === "none" || fetchSite === "cross-site") {
    redirect("/chat");
  }

  return <AutomationPreview />;
}
