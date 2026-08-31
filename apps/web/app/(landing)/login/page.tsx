import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthPreview } from "@/components/preview/AuthOnboardingPreview";
import { auth } from "@/utils/auth";

export default async function AuthenticationPage() {
  const session = await auth();
  if (session) redirect("/chat");

  return (
    <Suspense
      fallback={
        <main
          aria-label="Chargement de la connexion"
          className="min-h-svh bg-background"
        />
      }
    >
      <AuthPreview />
    </Suspense>
  );
}
