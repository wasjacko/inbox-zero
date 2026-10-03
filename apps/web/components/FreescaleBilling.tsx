"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";
import type { BillingPlansResponse } from "@/app/api/user/billing-plans/route";
import { useUser } from "@/hooks/useUser";
import { useProductAccess } from "@/hooks/useProductAccess";
import { generateCheckoutSessionAction } from "@/utils/actions/premium";
import { redirectToSafeUrl } from "@/utils/redirect";
import { ManageSubscription } from "@/app/(app)/premium/ManageSubscription";
import { LoadingContent } from "@/components/LoadingContent";
import { Button } from "@/components/ui/button";

export function FreescaleBilling() {
  const { data: user } = useUser();
  const { data: access } = useProductAccess();
  const {
    data: plans,
    isLoading,
    error,
  } = useSWR<BillingPlansResponse>("/api/user/billing-plans");
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [pending, setPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const plan = plans?.find(
    (item) =>
      item.tier ===
      (period === "month" ? "STARTER_MONTHLY" : "STARTER_ANNUALLY"),
  );
  const price =
    plan?.amount != null
      ? new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: plan.currency,
        }).format(plan.amount / 100)
      : null;
  const existingSubscription =
    access?.state === "subscribed" ||
    !!user?.premium?.stripeSubscriptionId ||
    !!user?.premium?.lemonSqueezyCustomerId ||
    !!user?.premium?.appleSubscriptionStatus;

  async function subscribe() {
    if (!plan?.available || existingSubscription) return;
    setPending(true);
    setCheckoutError(null);
    try {
      const result = await generateCheckoutSessionAction({ tier: plan.tier });
      if (result?.serverError || !result?.data?.url) {
        setCheckoutError(
          result?.serverError ||
            "Le paiement n’a pas pu être ouvert. Réessayez.",
        );
        return;
      }
      redirectToSafeUrl(result.data.url, { allowExternal: true });
    } catch {
      setCheckoutError("Le paiement n’a pas pu être ouvert. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-svh bg-[#F8F7FC] px-4 py-10 text-[#0C0837] sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A3EB5]">
          Freescale · Plan et facturation
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Continuez à piloter votre activité.
        </h1>
        <p className="mt-4 text-[#6B6A7F]">
          {access?.state === "active"
            ? `Votre essai complet est actif : ${access.daysRemaining} jours restants.`
            : access?.state === "subscribed"
              ? "Votre abonnement est actif. Gérez votre facturation depuis votre espace sécurisé."
              : "Retrouvez votre copilote et votre espace de travail avec un abonnement Freescale."}
        </p>
        <LoadingContent loading={isLoading} error={error}>
          <section className="mt-8 overflow-hidden rounded-3xl border border-[#0C0837]/10 bg-white shadow-lg shadow-[#0C0837]/5">
            <div className="h-2 bg-gradient-to-r from-[#33BBCF] via-[#8A3EB5] to-[#F70E44]" />
            <div className="p-7 sm:p-10">
              {existingSubscription ? (
                <>
                  <h2 className="text-xl font-semibold">Mon abonnement</h2>
                  <div className="mt-6">
                    <ManageSubscription premium={user?.premium} />
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="mb-7 flex rounded-xl bg-[#F8F7FC] p-1"
                    aria-label="Fréquence de facturation"
                    role="group"
                  >
                    {(["month", "year"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={period === value}
                        className={`min-h-11 flex-1 rounded-lg px-4 text-sm font-semibold ${period === value ? "bg-[#0C0837] text-white" : "text-[#6B6A7F]"}`}
                        onClick={() => setPeriod(value)}
                      >
                        {value === "month" ? "Mensuel" : "Annuel"}
                      </button>
                    ))}
                  </div>
                  <h2 className="text-xl font-semibold">
                    Votre abonnement Freescale
                  </h2>
                  <p className="mt-4 text-4xl font-semibold">
                    {price || "À venir"}
                    <span className="ml-2 text-base font-normal text-[#6B6A7F]">
                      {price ? (period === "month" ? "/ mois" : "/ an") : ""}
                    </span>
                  </p>
                  <p className="mt-3 text-sm text-[#6B6A7F]">
                    {period === "year"
                      ? "Facturation annuelle, en un seul paiement."
                      : "Facturation mensuelle."}{" "}
                    Le montant final et les taxes éventuelles sont confirmés
                    avant le paiement.
                  </p>
                  <ul className="my-7 space-y-3 text-sm">
                    {[
                      "Mue, votre copilote au quotidien",
                      "Vos messages et votre activité centralisés",
                      "Vos données conservées dans votre espace",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <Check className="size-4 text-[#33BBCF]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {!plan?.available && (
                    <p className="mb-4 text-sm text-[#6B6A7F]">
                      L’abonnement n’est pas encore disponible au paiement.
                      Votre essai reste accessible jusqu’à sa date de fin.
                    </p>
                  )}
                  {checkoutError && (
                    <p className="mb-4 text-sm text-[#F70E44]" role="alert">
                      {checkoutError}
                    </p>
                  )}
                  <Button
                    disabled={pending || !plan?.available}
                    onClick={subscribe}
                    className="h-12 w-full rounded-xl bg-[#8A3EB5] hover:bg-[#713095]"
                  >
                    {pending ? "Ouverture du paiement…" : "M’abonner"}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#6B6A7F]">
                    <ShieldCheck className="size-4" />
                    Paiement sécurisé · Abonnement confirmé après paiement
                  </p>
                  {access?.state === "active" && (
                    <p className="mt-4 text-center text-xs text-[#6B6A7F]">
                      En vous abonnant maintenant, la facturation commence dès
                      le paiement.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </LoadingContent>
      </div>
    </div>
  );
}
