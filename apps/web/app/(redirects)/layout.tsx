import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PreviewAppLayout } from "@/components/PreviewAppLayout";
import { auth } from "@/utils/auth";

export default async function RedirectsPreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <Suspense
      fallback={
        <main
          aria-label="Chargement de l’espace"
          className="min-h-svh bg-background"
        />
      }
    >
      <PreviewAppLayout>{children}</PreviewAppLayout>
    </Suspense>
  );
}
