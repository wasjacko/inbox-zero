import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/utils/branding";

export const metadata: Metadata = {
  title: `Conditions d'utilisation | ${BRAND_NAME}`,
  description: `Conditions d'utilisation du service ${BRAND_NAME}.`,
};

const updatedAt = "1er septembre 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Link href="/" className="text-sm font-semibold text-blue-600">
          ← Retour à {BRAND_NAME}
        </Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight">
          Conditions d'utilisation
        </h1>
        <p className="mt-3 text-sm text-slate-500">Mise à jour : {updatedAt}</p>

        <div className="mt-10 space-y-8 text-base leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              Objet du service
            </h2>
            <p className="mt-3">
              {BRAND_NAME} vous aide à centraliser vos échanges, organiser vos
              tâches et faire ressortir vos priorités. L'utilisation du service
              implique l'acceptation des présentes conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              Votre compte
            </h2>
            <p className="mt-3">
              Vous êtes responsable des informations fournies, de la sécurité de
              votre compte et des actions réalisées depuis celui-ci. Vous ne
              devez pas utiliser le service à des fins illégales ou portant
              atteinte aux droits de tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              Services connectés
            </h2>
            <p className="mt-3">
              Les connexions à Google ou à d'autres services tiers sont
              facultatives. Leur fonctionnement dépend aussi de ces fournisseurs
              et de leurs propres conditions. Vous pouvez retirer une connexion
              à tout moment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              Disponibilité et responsabilité
            </h2>
            <p className="mt-3">
              Nous faisons notre possible pour fournir un service fiable, mais
              ne garantissons pas une disponibilité ininterrompue. Les fonctions
              automatiques restent des aides : vous devez vérifier les actions
              importantes avant de les valider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              Suspension et évolution
            </h2>
            <p className="mt-3">
              Nous pouvons faire évoluer le service ou suspendre un compte en
              cas d'abus, de risque de sécurité ou de violation de ces
              conditions. Toute modification importante de ces conditions sera
              publiée sur cette page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
            <p className="mt-3">
              Pour toute question, écrivez à{" "}
              <a
                className="text-blue-600 underline"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
