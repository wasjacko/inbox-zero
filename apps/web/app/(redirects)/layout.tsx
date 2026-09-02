import { Suspense } from "react";
import { PreviewAppLayout } from "@/components/PreviewAppLayout";

export default function RedirectsPreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
