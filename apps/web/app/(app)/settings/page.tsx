import { SettingsPreview } from "@/components/preview/MainPreviewPages";
import { redirect } from "next/navigation";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  if (section === "organization") redirect("/organization");

  return <SettingsPreview />;
}
