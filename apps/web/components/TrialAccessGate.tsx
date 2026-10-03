"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { useSWRConfig } from "swr";
import { useProductAccess } from "@/hooks/useProductAccess";
import { startFreescaleTrialAction } from "@/utils/actions/trial";
import { Button } from "@/components/ui/button";
import { LoadingContent } from "@/components/LoadingContent";

export function TrialAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, error, isLoading, mutate } = useProductAccess();
  const { mutate: revalidate } = useSWRConfig();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const bypass =
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/premium" ||
    pathname === "/settings" ||
    pathname === "/license";

  async function startTrial() {
    setStarting(true);
    setStartError(null);
    try {
      const result = await startFreescaleTrialAction();
      if (result?.serverError || !result?.data) {
        setStartError(
          result?.serverError || "Impossible de démarrer l’essai. Réessayez.",
        );
        return;
      }
      await mutate(result.data, false);
      await revalidate("/api/user/me");
    } catch {
      setStartError(
        "Connexion interrompue. Réessayez pour démarrer votre essai.",
      );
    } finally {
      setStarting(false);
    }
  }

  if (bypass) return <>{children}</>;

  return (
    <LoadingContent loading={isLoading} error={error}>
      {data?.canUseProduct ? (
        <>
          {data.state === "active" && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8A3EB5]/15 bg-[#8A3EB5]/5 px-5 py-3 text-sm text-[#0C0837]">
              <span className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#8A3EB5]" /> Essai complet ·{" "}
                {data.daysRemaining} jour{data.daysRemaining > 1 ? "s" : ""}{" "}
                restant{data.daysRemaining > 1 ? "s" : ""}
              </span>
              <Link
                className="font-semibold text-[#8A3EB5] hover:underline"
                href="/premium"
              >
                Choisir mon abonnement →
              </Link>
            </div>
          )}
          {children}
        </>
      ) : data ? (
        <div className="flex min-h-[85svh] items-center justify-center bg-[#F8F7FC] px-4 py-10 sm:px-8">
          <section
            aria-labelledby="trial-title"
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[#0C0837]/10 bg-white shadow-xl shadow-[#0C0837]/5"
          >
            <div className="h-2 bg-gradient-to-r from-[#33BBCF] via-[#8A3EB5] to-[#F70E44]" />
            <div className="p-7 sm:p-12">
              <span className="mb-7 inline-flex size-14 items-center justify-center rounded-2xl bg-[#8A3EB5]/10 text-[#8A3EB5]">
                <Sparkles className="size-7" />
              </span>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A3EB5]">
                Freescale ·{" "}
                {data.state === "expired"
                  ? "La suite vous attend"
                  : "Votre espace est prêt"}
              </p>
              <h1
                className="text-3xl font-semibold tracking-tight text-[#0C0837] sm:text-4xl"
                id="trial-title"
              >
                {data.state === "expired"
                  ? "Gardez votre élan."
                  : "14 jours pour tout essayer."}
              </h1>
              <p className="mt-4 leading-relaxed text-[#6B6A7F]">
                {data.state === "expired"
                  ? "Votre essai est terminé. Choisissez un abonnement pour retrouver Mue et continuer à piloter votre activité. Vos messages et vos données sont conservés."
                  : "Démarrez votre essai gratuit pour accéder à Freescale. Toutes les fonctionnalités sont incluses pendant 14 jours, sans carte bancaire."}
              </p>
              <ul className="my-7 space-y-3 text-sm text-[#0C0837]">
                {[
                  "Mue, votre copilote IA",
                  "Vos messages et vos canaux centralisés",
                  "Analyses, tâches et automatisations",
                ].map((feature) => (
                  <li className="flex items-center gap-3" key={feature}>
                    <Check className="size-4 shrink-0 text-[#33BBCF]" />
                    {feature}
                  </li>
                ))}
              </ul>
              {startError && (
                <p className="mb-4 text-sm text-[#F70E44]" role="alert">
                  {startError}
                </p>
              )}
              {data.state === "expired" ? (
                <Button
                  asChild
                  className="h-12 w-full rounded-xl bg-[#8A3EB5] hover:bg-[#713095]"
                >
                  <Link href="/premium">
                    Choisir mon abonnement{" "}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  className="h-12 w-full rounded-xl bg-[#8A3EB5] hover:bg-[#713095]"
                  disabled={starting}
                  onClick={startTrial}
                >
                  {starting
                    ? "Démarrage de votre essai…"
                    : "Démarrer mon essai gratuit"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-[#6B6A7F]">
                <ShieldCheck className="size-4 shrink-0" />
                Aucun prélèvement automatique à la fin de l’essai.
              </p>
              <Link
                className="mt-6 block text-center text-xs text-[#6B6A7F] underline"
                href="/settings"
              >
                Gérer mon compte
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </LoadingContent>
  );
}
